import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

import { isKeyRateLimited } from "@/lib/apiSecurity";
import { candidateInterestNoticeLetter } from "@/lib/emails/letters";
import { partnerSessionFor } from "@/lib/partnerSession";
import { isRateLimited } from "@/lib/requestProtection";

// The partner comes from the session row, never from the browser (ORDER 415).
const bodySchema = z.object({
  candidateId: z.string().min(1).max(64),
  role: z.string().min(1).max(120),
});

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

  if (isRateLimited(request, "partner-interest", 20, 10 * 60 * 1000) || isKeyRateLimited("partner-interest", sessionToken, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const session = await partnerSessionFor(sessionToken);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { candidateId, role } = parsedBody.data;
  const partnerDomain = session.domain;
  const timestamp = new Date().toISOString();
  const slackText = `Partner interest expressed. Candidate ID: ${candidateId}. Role: ${role}. Partner: ${partnerDomain}.`;

  await sendSlackMessage(slackText).catch(() => undefined);

  const transporter = createTransporter();
  if (transporter) {
    const letter = candidateInterestNoticeLetter({ candidateId, role, partnerDomain, timestamp });
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
        subject: letter.subject,
        text,
        html: letter.html,
      })
      .catch(() => undefined);
  }

  return NextResponse.json({ success: true });
}
