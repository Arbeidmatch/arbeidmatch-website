import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SlackPayload = {
  actions?: Array<{ action_id?: string; value?: string }>;
};

function isValidSlackSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  const signature = request.headers.get("x-slack-signature") || "";
  const timestamp = request.headers.get("x-slack-timestamp") || "";
  if (!secret || !signature.startsWith("v0=") || !timestamp) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = createHmac("sha256", secret).update(base).digest("hex");
  const expected = `v0=${digest}`;
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

function premiumEmailLayout(title: string, message: string, ctaLabel?: string, ctaHref?: string, note?: string): string {
  const cta =
    ctaLabel && ctaHref
      ? `<div style="margin-top:28px;text-align:center;">
           <a href="${ctaHref}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;padding:14px 28px;">
             ${ctaLabel}
           </a>
         </div>`
      : "";
  const noteBlock = note
    ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">${note}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0f18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f18;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0D1B2A;border:1px solid rgba(201,168,76,0.2);border-top:2px solid rgba(201,168,76,0.45);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:30px 34px 16px;text-align:center;">
          <span style="color:#ffffff;font-weight:700;font-size:24px;">Arbeid</span><span style="color:#C9A84C;font-weight:700;font-size:24px;">Match</span>
          <div style="width:60px;height:2px;background:#C9A84C;margin:12px auto 0;"></div>
        </td></tr>
        <tr><td style="padding:12px 34px 34px;">
          <h1 style="margin:0;font-size:26px;line-height:1.25;color:#ffffff;">${title}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.62);">${message}</p>
          ${cta}
          ${noteBlock}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!isValidSlackSignature(request, rawBody)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const formData = new URLSearchParams(rawBody);
    const payloadRaw = formData.get("payload");
    if (!payloadRaw) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const payload = JSON.parse(payloadRaw) as SlackPayload;
    const action = payload.actions?.[0];
    const actionId = action?.action_id;
    const requestId = action?.value;
    if (!actionId || !requestId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { data: partnerRequest, error: requestError } = await supabase
      .from("partner_requests")
      .select("id, email, company_name, org_number, full_name")
      .eq("id", requestId)
      .single();
    if (requestError || !partnerRequest) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const transporter = createSmtpTransporter();
    const email = partnerRequest.email;

    if (actionId === "approve_partner") {
      const domain = email.split("@")[1]?.toLowerCase().trim() || "";
      const { error: partnerInsertError } = await supabase.from("partners").insert({
        company_name: partnerRequest.company_name || "Partner",
        domain,
        active: true,
      });
      if (partnerInsertError) {
        throw partnerInsertError;
      }

      const sessionToken = crypto.randomUUID();
      const requestToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error: sessionError } = await supabase.from("partner_sessions").insert({
        email,
        session_token: sessionToken,
        request_token: requestToken,
        expires_at: expiresAt,
        used: false,
      });
      if (sessionError) {
        throw sessionError;
      }

      const { error: updateError } = await supabase
        .from("partner_requests")
        .update({ status: "approved" })
        .eq("id", requestId);
      if (updateError) {
        throw updateError;
      }

      if (transporter) {
        const accessUrl = `https://arbeidmatch.no/request/partner/${sessionToken}`;
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "Your ArbeidMatch partner access is ready",
          text: `Your partner account has been approved. Access Platform: ${accessUrl}\n\nThis link is valid for 24 hours.`,
          html: premiumEmailLayout(
            "Welcome to ArbeidMatch.",
            "Your partner account has been approved. Click below to access candidate profiles and submit your first request.",
            "Access Platform",
            accessUrl,
            "This link is valid for 24 hours.",
          ),
        });
      }

      return NextResponse.json({
        text: `Partner approved. Access link sent to ${email}.`,
      });
    }

    if (actionId === "contact_partner") {
      const { error: updateError } = await supabase
        .from("partner_requests")
        .update({ status: "contacted" })
        .eq("id", requestId);
      if (updateError) {
        throw updateError;
      }

      if (transporter) {
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "We received your ArbeidMatch partner request",
          text: "Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you within 1 to 2 business days.",
          html: premiumEmailLayout(
            "We will be in touch.",
            "Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you within 1 to 2 business days.",
          ),
        });
      }

      return NextResponse.json({
        text: `Contact email sent to ${email}.`,
      });
    }

    if (actionId === "reject_partner") {
      const { error: updateError } = await supabase
        .from("partner_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);
      if (updateError) {
        throw updateError;
      }

      if (transporter) {
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "Your ArbeidMatch partner request",
          text: "After reviewing your request, we are unable to offer partner access at this time. You are welcome to reapply in the future or contact us at support@arbeidmatch.no for more information.",
          html: premiumEmailLayout(
            "Thank you for your interest.",
            "After reviewing your request, we are unable to offer partner access at this time. You are welcome to reapply in the future or contact us at support@arbeidmatch.no for more information.",
          ),
        });
      }

      return NextResponse.json({
        text: `Request rejected. Email sent to ${email}.`,
      });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch (error) {
    await notifyError({ route: "/api/slack/interactions", error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
