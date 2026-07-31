import "server-only";

import { logApiError } from "@/lib/secureLogger";

/**
 * Mail for the CV generator goes through the ATS, not from here.
 *
 * The ATS owns the mail infrastructure: suppression lists, bounce handling, SMTP
 * routing and the Gmail circuit breaker. Sending straight from the website would be a
 * second, unmanaged path to the same mailboxes, so a hard bounce recorded there would
 * not stop us mailing the same person from here.
 *
 * Everything is sent as no-reply, which is what the ATS endpoint enforces.
 */

export interface MailAttachment {
  filename: string;
  content: Uint8Array;
  contentType?: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

function endpoint(): string | null {
  const base = process.env.ATS_BASE_URL?.trim() || process.env.ATS_PUBLIC_BASE_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/api/public/website-email`;
}

export async function sendCvEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<SendResult> {
  const url = endpoint();
  const secret = process.env.ATS_EMAIL_SECRET?.trim();
  if (!url || !secret) {
    return { ok: false, error: "mail_not_configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-website-email-secret": secret,
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments?.map((attachment) => ({
          filename: attachment.filename,
          contentBase64: Buffer.from(attachment.content).toString("base64"),
          contentType: attachment.contentType ?? "application/pdf",
        })),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: body.error ?? `ats_${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    logApiError("cv/mailer", error);
    return { ok: false, error: "ats_unreachable" };
  }
}
