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

/**
 * Every name this project has ever stored the ATS address under.
 *
 * On 12 August 2026 the CV consent step answered "Could not send the code" to every
 * visitor for hours. Nothing was broken in the mail path: the secret was set on both
 * sides and the ATS endpoint was up. The address was set too, but under
 * NEXT_PUBLIC_ATS_URL, and this function only looked at the other two names, so it
 * returned null and the mailer reported mail_not_configured before it ever called out.
 * Reading all three names means the feature works with whichever name the deployment
 * already carries, instead of failing silently on a naming difference.
 */
const ATS_BASE_URL_VARS = ["ATS_BASE_URL", "ATS_PUBLIC_BASE_URL", "NEXT_PUBLIC_ATS_URL"] as const;

export function atsEmailEndpoint(): string | null {
  for (const name of ATS_BASE_URL_VARS) {
    const base = process.env[name]?.trim();
    if (base) return `${base.replace(/\/+$/, "")}/api/public/website-email`;
  }
  return null;
}

export async function sendCvEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<SendResult> {
  const url = atsEmailEndpoint();
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
