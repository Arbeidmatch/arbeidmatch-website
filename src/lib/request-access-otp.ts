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
