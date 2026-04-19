import nodemailer from "nodemailer";

/** Shared SMTP config (one.com) - requires SMTP_PASS in env. */
export function createSmtpTransporter() {
  if (!process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: "send.one.com",
    port: 465,
    secure: true,
    auth: {
      user: "no-replay@arbeidmatch.no",
      pass: process.env.SMTP_PASS,
    },
  });
}
