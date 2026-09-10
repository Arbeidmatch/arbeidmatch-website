import { headers } from "next/headers";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { unsubscribeUrlFor } from "@/lib/emailSubscription";
import { legalRequestNoticeLetter, legalRequestReceiptLetter } from "@/lib/emails/letters";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const notice = legalRequestNoticeLetter({
      requestType: request_type,
      fullName: full_name,
      email,
      identityVerification: identity_verification_method,
      message,
      ip: ip_address,
      userAgent: user_agent,
      timestamp: ts,
      reference,
      rowId: id,
    });

    try {
      await transporter.sendMail({
        from: "legal@arbeidmatch.no",
        to: "legal@arbeidmatch.no",
        subject: notice.subject,
        html: notice.html,
      });
    } catch (e) {
      console.error("[legal-request] internal mail", e);
    }

    try {
      const receipt = legalRequestReceiptLetter({
        fullName: full_name,
        requestType: request_type,
        reference,
        timestamp: ts,
        to: email,
        unsubscribeUrl: await unsubscribeUrlFor(email, "legal-request"),
      });
      await transporter.sendMail({
        from: "legal@arbeidmatch.no",
        to: email,
        subject: receipt.subject,
        html: receipt.html,
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
