import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { unsubscribeUrlFor } from "@/lib/emailSubscription";
import { partnerApprovedLetter, partnerContactedLetter, partnerRejectedLetter } from "@/lib/emails/letters";
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
        const letter = partnerApprovedLetter({
          accessUrl,
          to: email,
          unsubscribeUrl: await unsubscribeUrlFor(email, "partner-request"),
        });
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: letter.subject,
          text: `Your partner account has been approved. Access Platform: ${accessUrl}\n\nThis link is valid for 24 hours.`,
          html: letter.html,
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
        const letter = partnerContactedLetter({
          to: email,
          unsubscribeUrl: await unsubscribeUrlFor(email, "partner-request"),
        });
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: letter.subject,
          text: "Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you within 1 to 2 business days.",
          html: letter.html,
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
        const letter = partnerRejectedLetter({
          to: email,
          unsubscribeUrl: await unsubscribeUrlFor(email, "partner-request"),
        });
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: letter.subject,
          text: "After reviewing your request, we are unable to offer partner access at this time. You are welcome to reapply in the future or contact us at support@arbeidmatch.no for more information.",
          html: letter.html,
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
