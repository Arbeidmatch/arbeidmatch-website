import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_HOUR = 5;

export type RequestAccessFlow = "partner" | "new_company";

export function normalizeRequestEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidRequestEmail(email: string): boolean {
  return email.includes("@") && email.length <= 200;
}

function getOtpSecret(): string | null {
  const secret =
    process.env.REQUEST_OTP_SECRET?.trim() || process.env.EMAIL_VERIFICATION_SECRET?.trim() || "";
  return secret || null;
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code: string): string | null {
  const secret = getOtpSecret();
  if (!secret) return null;
  return createHash("sha256").update(`${secret}:${code}`).digest("hex");
}

export function verifyOtpCode(code: string, storedHash: string): boolean {
  const computed = hashOtpCode(code);
  if (!computed) return false;
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(storedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildOtpEmailHtml(code: string): string {
  const safeCode = code.replace(/[^\d]/g, "");
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #0D1B2A;">Your verification code</h2>
  <p style="color: #0D1B2A;">Use this code to continue your ArbeidMatch request:</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #0D1B2A; margin: 24px 0;">${safeCode}</p>
  <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">ArbeidMatch Norge AS | Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
</div>`;
}

export function requestAccessRedirectUrl(token: string): string {
  return `/request/${token}`;
}

export function resolveSiteOrigin(): string {
  const siteBaseRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.arbeidmatch.no";
  try {
    const base = siteBaseRaw.startsWith("http") ? siteBaseRaw : `https://${siteBaseRaw}`;
    return new URL(base).origin;
  } catch {
    return "https://www.arbeidmatch.no";
  }
}
