import { headers } from "next/headers";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createLegalTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.LEGAL_EMAIL_USER;
  const pass = process.env.LEGAL_EMAIL_PASS;
  if (!host || !Number.isFinite(port) || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

type Body = {
  request_type?: string;
  full_name?: string;
  email?: string;
  identity_verification_method?: string | null;
  message?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const request_type = typeof body.request_type === "string" ? body.request_type.trim() : "";
  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const identity_verification_method =
    typeof body.identity_verification_method === "string" && body.identity_verification_method.trim().length > 0
      ? body.identity_verification_method.trim()
      : null;

  if (!request_type || !full_name || !email || !message) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (message.length < 20) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const h = await headers();
  const xff = h.get("x-forwarded-for");
  const ip_address = xff?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  const user_agent = h.get("user-agent") || "";

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await client
    .from("legal_requests")
    .insert({
      request_type,
      full_name,
      email,
      identity_verification_method,
      message,
      status: "received",
      ip_address: ip_address || null,
      user_agent: user_agent || null,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    console.error("[legal-request] insert", insertError?.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const id = inserted.id as string;
  const reference = `LR-${id.replace(/-/g, "").slice(0, 8)}`;
  const ts = new Date().toISOString();

  const transporter = createLegalTransporter();
  let userAckSent = false;

  if (transporter) {
    const internalHtml = `
      <p><strong>Legal request</strong></p>
      <p>Request type: ${escapeHtml(request_type)}</p>
      <p>Full name: ${escapeHtml(full_name)}</p>
      <p>Email: ${escapeHtml(email)}</p>
      <p>Identity verification: ${escapeHtml(identity_verification_method ?? "(none)")}</p>
      <p>Message:</p>
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(message)}</pre>
      <p>IP: ${escapeHtml(ip_address)}</p>
      <p>User agent: ${escapeHtml(user_agent)}</p>
      <p>Timestamp: ${escapeHtml(ts)}</p>
      <p>Reference: ${escapeHtml(reference)}</p>
      <p>Row id: ${escapeHtml(id)}</p>
    `;

    const ackHtml = `
      <div style="max-width:600px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;padding:32px;color:#0D1B2A;">
        <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0D1B2A;">ArbeidMatch <span style="color:#C9A84C;">Legal</span></p>
        <p style="margin:16px 0;">Dear ${escapeHtml(full_name)},</p>
        <p style="margin:12px 0;">We confirm receipt of your legal request submitted on ${escapeHtml(ts)}.</p>
        <p style="margin:12px 0;"><strong>Request type:</strong> ${escapeHtml(request_type)}</p>
        <p style="margin:12px 0;"><strong>Reference number:</strong> ${escapeHtml(reference)}</p>
        <p style="margin:12px 0;">We will respond within 30 days as required by GDPR Article 12(3). If we need additional information to verify your identity, we will contact you at this email address.</p>
        <p style="margin:12px 0;">If you did not submit this request, please reply to this email immediately.</p>
        <p style="margin:24px 0 8px;">Best regards,<br/>ArbeidMatch Legal Team</p>
        <p style="margin:0;font-size:13px;color:#0D1B2A;">ArbeidMatch Norge AS, Org.nr 935 667 089 MVA<br/>
        Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
        <p style="margin-top:24px;font-size:12px;">
          <a href="https://www.arbeidmatch.no/privacy" style="color:#C9A84C;">Privacy Policy</a>
          &nbsp;|&nbsp;
          <a href="https://www.arbeidmatch.no/dpa" style="color:#C9A84C;">Data Processing Agreement</a>
        </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: "legal@arbeidmatch.no",
        to: "legal@arbeidmatch.no",
        subject: `[Legal Request] ${request_type} from ${full_name}`,
        html: internalHtml,
      });
    } catch (e) {
      console.error("[legal-request] internal mail", e);
    }

    try {
      await transporter.sendMail({
        from: "legal@arbeidmatch.no",
        to: email,
        subject: "We received your legal request - ArbeidMatch",
        html: ackHtml,
      });
      userAckSent = true;
    } catch (e) {
      console.error("[legal-request] ack mail", e);
    }
  } else {
    console.error("[legal-request] missing SMTP or LEGAL_EMAIL credentials");
  }

  if (userAckSent) {
    const { error: upErr } = await client
      .from("legal_requests")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    if (upErr) console.error("[legal-request] acknowledged_at update", upErr.message);
  }

  return NextResponse.json({ ok: true, reference });
}
