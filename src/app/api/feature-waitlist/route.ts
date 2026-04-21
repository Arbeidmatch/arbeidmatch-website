import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { notifyError } from "@/lib/errorNotifier";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { buildEmail } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;
    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "feature-waitlist", 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const feature = typeof body.feature === "string" ? body.feature.trim().slice(0, 120) : "";
    const consent = body.consent === true || body.consent === "true";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Consent is required." }, { status: 400 });
    }
    if (!feature) {
      return NextResponse.json({ error: "Feature name is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const wantsFromBody = body.wants_assistance;
    const wantsDefault = `feature-waitlist|feature=${feature}|guideWanted=1|consent=1`;
    /** `wants_assistance` is text in DB. If client omits the field, treat as not provided → use default pipeline string. */
    const wantsProvided =
      Object.prototype.hasOwnProperty.call(body, "wants_assistance") &&
      wantsFromBody !== undefined &&
      wantsFromBody !== null;
    const wants: string = wantsProvided
      ? wantsFromBody === false || wantsFromBody === "false"
        ? "false"
        : typeof wantsFromBody === "string" && wantsFromBody.trim().length > 0
          ? wantsFromBody.trim()
          : wantsDefault
      : wantsDefault;
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("guide_interest_signups")
      .select("id")
      .eq("notify_email", email)
      .eq("target_region", feature)
      .eq("target_country", "feature-waitlist")
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("guide_interest_signups")
        .update({ wants_assistance: wants, verified_at: now })
        .eq("id", existing.id);
    } else {
      const { error: dbError } = await supabase.from("guide_interest_signups").insert({
        notify_email: email,
        target_region: feature,
        target_country: "feature-waitlist",
        wants_assistance: wants,
        email_verified: true,
        verified_at: now,
      });
      if (dbError) throw new Error(dbError.message);
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      try {
        if (await isUnsubscribed(email)) {
          return NextResponse.json({ success: true });
        }
        const unsubToken = await getOrCreateSubscription(email, "feature-waitlist");
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "You are on the waitlist",
          text: `Hi, you have been added to the waitlist for ${feature} on ArbeidMatch. We will notify you at this email when it becomes available. Unsubscribe anytime by replying to this email.

Best regards,
ArbeidMatch Team`,
          html: buildEmail({
            title: "You are on the waitlist",
            preheader: "Your feature waitlist registration is confirmed",
            body: `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">Hi, you have been added to the waitlist for <strong>${escapeHtml(
              feature,
            )}</strong> on ArbeidMatch.</p><p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">We will notify you at this email when it becomes available.</p><p style="margin:0;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">Unsubscribe anytime by replying to this email.<br/><br/>Best regards,<br/>ArbeidMatch Team</p>`,
            unsubscribeToken: unsubToken,
          }),
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[feature-waitlist] error:", JSON.stringify(error, null, 2), (error as Error)?.message);
    await notifyError({ route: "/api/feature-waitlist", error });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
