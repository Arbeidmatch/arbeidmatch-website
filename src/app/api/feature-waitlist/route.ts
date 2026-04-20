import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { notifyError } from "@/lib/errorNotifier";
import { buildEmail } from "@/lib/emailTemplate";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "feature-waitlist", 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const feature = typeof body.feature === "string" ? body.feature.trim().slice(0, 120) : "";
    const consent = body.consent === true;

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

    const wants = `feature-waitlist|feature=${feature}|guideWanted=1|consent=1`;
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
      const { error } = await supabase.from("guide_interest_signups").insert({
        notify_email: email,
        target_region: feature,
        target_country: "feature-waitlist",
        wants_assistance: wants,
        email_verified: true,
        verified_at: now,
      });
      if (error) {
        return NextResponse.json({ error: "Could not save signup." }, { status: 500 });
      }
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"ArbeidMatch" <no-replay@arbeidmatch.no>`,
          to: email,
          subject: "You are on the waitlist",
          text: `Hi, you have been added to the waitlist for ${feature} on ArbeidMatch. We will notify you at this email when it becomes available. Unsubscribe anytime by replying to this email.

Best regards,
ArbeidMatch Team`,
          html: buildEmail({
            title: "You are on the waitlist",
            preheader: "Your feature waitlist registration is confirmed",
            body: `<p style="margin:0 0 16px;">Hi, you have been added to the waitlist for <strong>${feature}</strong> on ArbeidMatch.</p><p style="margin:0 0 16px;">We will notify you at this email when it becomes available.</p><p style="margin:0;">Unsubscribe anytime by replying to this email.<br/><br/>Best regards,<br/>ArbeidMatch Team</p>`,
          }),
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/feature-waitlist", error });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
