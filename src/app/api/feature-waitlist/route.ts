import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { isUnsubscribed } from "@/lib/emailSubscription";
import { applyRecipientEmailPlaceholders, UNSUBSCRIBED_PAGE_EMAIL_HREF } from "@/lib/websiteEmailTemplates";

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
        const featureWaitlistHtml = `
            <div style="background:#0D1B2A;max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif;">
              <div style="background:#0a0f18;padding:32px 36px;text-align:center;">
                <span style="color:#ffffff;font-weight:700;font-size:24px;">Arbeid</span><span style="color:#C9A84C;font-weight:700;font-size:24px;">Match</span>
                <div style="width:60px;height:2px;background:#C9A84C;margin:12px auto 0;"></div>
              </div>
              <div style="padding:40px 36px;background:#0D1B2A;">
                <p style="margin:0 0 10px 0;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.12em;">YOU ARE ON THE LIST</p>
                <h1 style="font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;margin:0 0 16px 0;">We have got you covered.</h1>
                <p style="margin:0 0 24px 0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
                  You will be among the first to know when this feature launches. We are building something worth waiting for.
                </p>
                <div style="width:60px;height:1px;background:#C9A84C;margin:0 0 24px 0;"></div>
                <p style="font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;margin:0;">
                  No action needed. We will reach out directly when access becomes available for your account.
                </p>
              </div>
              <div style="background:#0a0f18;padding:24px 36px;text-align:center;">
                <p style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8;margin:0;">
                  ArbeidMatch Norge AS | Org.nr 935 667 089 MVA<br />
                  Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway<br />
                  <a href="mailto:support@arbeidmatch.no" style="color:rgba(201,168,76,0.5);text-decoration:none;">support@arbeidmatch.no</a>
                  <span> | </span>
                  <a href="https://arbeidmatch.no" style="color:rgba(201,168,76,0.5);text-decoration:none;">arbeidmatch.no</a>
                  <span> | </span>
                  <a href="${UNSUBSCRIBED_PAGE_EMAIL_HREF}" style="color:rgba(201,168,76,0.5);text-decoration:none;">Unsubscribe</a>
                </p>
              </div>
            </div>
          `;
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "You are on the waitlist",
          text: `Hi, you have been added to the waitlist for ${feature} on ArbeidMatch. We will notify you at this email when it becomes available. Unsubscribe anytime by replying to this email.

Best regards,
ArbeidMatch Team`,
          html: applyRecipientEmailPlaceholders(featureWaitlistHtml, email),
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
