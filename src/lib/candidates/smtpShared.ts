import nodemailer from "nodemailer";

export function getSmtpConfig(): { host: string; port: number; user: string; pass: string } | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;
  if (!host || !user || !pass) return null;
  if (!Number.isFinite(port)) return null;
  return { host, port, user, pass };
}

export function createSmtpTransporter() {
  const smtp = getSmtpConfig();
  if (!smtp) return null;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

/** Outbound mailbox for candidate transactional mail (must match SMTP mailbox where required). */
export const PROFILE_TRANSACTIONAL_FROM = '"ArbeidMatch" <post@arbeidmatch.no>';
