import nodemailer from "nodemailer";

/** Shared SMTP config from env. */
export function createSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !Number.isFinite(port) || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    // A relay that does not answer is given up on in seconds, so a retry still fits
    // in the request (13 October 2026: send.one.com 46.30.211.141 timed out once).
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

type SmtpTransporter = NonNullable<ReturnType<typeof createSmtpTransporter>>;
type MailOptions = Parameters<SmtpTransporter["sendMail"]>[0];

const NETWORK_FAULT = /ETIMEDOUT|ECONNECTION|ECONNRESET|ECONNREFUSED|ESOCKET|EAI_AGAIN/;

/**
 * Send once, and once more on a fresh connection when the network failed
 * (send.one.com resolves to two relays; the second try may reach the other).
 * A refusal by the server (5xx) is not retried: it would refuse again.
 */
export async function sendMailWithRetry(transporter: SmtpTransporter, options: MailOptions) {
  try {
    return await transporter.sendMail(options);
  } catch (error) {
    const text = `${(error as { code?: string }).code ?? ""} ${error instanceof Error ? error.message : String(error)}`;
    if (!NETWORK_FAULT.test(text)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    const fresh = createSmtpTransporter() ?? transporter;
    return await fresh.sendMail(options);
  }
}

/**
 * The From an SMTP account may actually send as (D3, 5 October 2026).
 *
 * The contact form's letters left as no-reply@arbeidmatch.no through the post@
 * account, and the server refused every one with 550 ("no-reply not allowed
 * for post@"), silently, since 25 September. The display name stays; the
 * address becomes the account that signs in, unless they already agree.
 */
export function authenticatedFrom(from: string, smtpUser = process.env.SMTP_USER): string {
  const user = String(smtpUser ?? "").trim();
  if (!user.includes("@")) return from;
  const m = /^(.*)<([^>]+)>\s*$/.exec(from);
  const address = (m ? m[2] : from).trim().toLowerCase();
  if (address === user.toLowerCase()) return from;
  const name = m ? m[1].trim() : "";
  return name ? `${name} <${user}>` : user;
}
