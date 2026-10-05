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
  });
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
  const m = /^(.*)<([^>]+)>s*$/.exec(from);
  const address = (m ? m[2] : from).trim().toLowerCase();
  if (address === user.toLowerCase()) return from;
  const name = m ? m[1].trim() : "";
  return name ? `${name} <${user}>` : user;
}
