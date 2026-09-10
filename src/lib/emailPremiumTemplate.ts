/**
 * Mail headers and the Oslo timestamp, which is all that is left here.
 *
 * The gold-band wrapper that used to live in this file is gone: since 10
 * September 2026 every email the website sends leaves in the ArbeidMatch letter
 * (`arbeidmatchEmailShell.ts`, a port of the ATS `premium-shell.ts`).
 */

/** From header (must match SMTP auth mailbox for one.com / similar providers). */
export const EMAIL_FROM = '"ArbeidMatch Norge AS" <no-reply@arbeidmatch.no>';
export const EMAIL_REPLY_TO = "support@arbeidmatch.no";

/** Standard nodemailer fields for outbound mail. */
export function mailHeaders() {
  return { from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO } as const;
}

export function formatEmailTimestampCet(date = new Date()): string {
  return (
    date.toLocaleString("en-GB", {
      timeZone: "Europe/Oslo",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " CET"
  );
}
