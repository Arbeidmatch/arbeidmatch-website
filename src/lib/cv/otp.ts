import "server-only";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_EMAIL_PER_HOUR = 3;
export const OTP_MAX_SENDS_PER_IP_PER_HOUR = 10;

export const DOWNLOAD_TOKEN_TTL_MS = 15 * 60 * 1000;
export const MY_DATA_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function pepper(): string | null {
  return process.env.CV_OTP_PEPPER?.trim() || null;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Emails are stored hashed until a code is verified, so an unverified request leaves
 * nothing behind that identifies a person.
 */
export function hashEmail(email: string): string | null {
  const secret = pepper();
  if (!secret) return null;
  return createHash("sha256").update(`email:${secret}:${normalizeEmail(email)}`).digest("hex");
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code: string): string | null {
  const secret = pepper();
  if (!secret) return null;
  return createHash("sha256").update(`${code}${secret}`).digest("hex");
}

/** Constant time comparison, so a wrong code cannot be found by timing the response. */
export function verifyOtpCode(code: string, storedHash: string): boolean {
  const computed = hashOtpCode(code);
  if (!computed) return false;
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(storedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hashIp(ip: string | null): string | null {
  const secret = pepper();
  if (!secret || !ip) return null;
  return createHash("sha256").update(`ip:${secret}:${ip}`).digest("hex");
}

/** Opaque single use token. Only its hash is stored. */
export function createAccessToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashAccessToken(token) };
}

export function hashAccessToken(token: string): string {
  const secret = process.env.CV_DOWNLOAD_TOKEN_SECRET?.trim() || pepper() || "";
  return createHash("sha256").update(`token:${secret}:${token}`).digest("hex");
}

export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}
