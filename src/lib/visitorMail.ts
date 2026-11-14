/**
 * Mail to the address a visitor typed. That address is the visitor's, not ours:
 * a refusal of it ("550 5.1.1 Invalid recipient") says the visitor mistyped, and
 * must never cost us the message we already hold (ORDER 284, 13 November 2026).
 */

const EMAIL_SHAPE = /^[^\s@<>()[\]\,;:"]+@[^\s@<>()[\]\,;:"]+\.[^\s@<>()[\]\,;:".]{2,}$/;

/** A typed address that can be an address at all: one @, a dotted domain, no spaces or list separators. */
export function isPlausibleEmail(value: string): boolean {
  const email = value.trim();
  return email.length >= 6 && email.length <= 254 && EMAIL_SHAPE.test(email) && !email.includes("..");
}

/** The SMTP server refused the recipient (a 5xx on RCPT, e.g. 550 5.1.1), as opposed to a network or account fault. */
export function isRecipientRefused(error: unknown): boolean {
  const e = error as { code?: string; responseCode?: number; response?: string; command?: string } | null;
  if (!e || typeof e !== "object") return false;
  const code = Number(e.responseCode);
  if (e.code === "EENVELOPE") return true;
  if (e.command === "RCPT TO" && code >= 500 && code < 600) return true;
  return /\b5\.1\.[0-9]\b|\b55[0134]\b.*(recipient|mailbox|user|address)/i.test(String(e.response ?? ""));
}
