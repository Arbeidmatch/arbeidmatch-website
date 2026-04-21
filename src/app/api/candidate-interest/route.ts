import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  candidateId: z.string().min(1),
  role: z.string().min(1),
  partnerDomain: z.string().min(1),
});

async function validateSessionToken(sessionToken: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("partner_sessions")
    .select("id")
    .eq("session_token", sessionToken)
    .eq("used", false)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

async function sendSlackMessage(text: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_EMPLOYERS;
  if (!webhook) return;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !portValue || !user || !pass) return null;
  const port = Number(portValue);
  if (!Number.isFinite(port)) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request: NextRequest) {
  const sessionToken = request.headers.get("x-session-token")?.trim() || "";
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isValid = await validateSessionToken(sessionToken);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { candidateId, role, partnerDomain } = parsedBody.data;
  const timestamp = new Date().toISOString();
  const slackText = `Partner interest expressed. Candidate ID: ${candidateId}. Role: ${role}. Partner: ${partnerDomain}.`;

  await sendSlackMessage(slackText).catch(() => undefined);

  const transporter = createTransporter();
  if (transporter) {
    const subject = `New candidate interest - ${role}`;
    const text = [
      "A partner expressed interest in a candidate profile.",
      "",
      `candidateId: ${candidateId}`,
      `role: ${role}`,
      `partnerDomain: ${partnerDomain}`,
      `timestamp: ${timestamp}`,
    ].join("\n");

    await transporter
      .sendMail({
        from: process.env.SMTP_USER,
        to: "post@arbeidmatch.no",
        subject,
        text,
      })
      .catch(() => undefined);
  }

  return NextResponse.json({ success: true });
}
