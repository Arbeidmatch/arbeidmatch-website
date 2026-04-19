import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const PREVIEW_COOKIE = "dsb_preview_auth";

function getPreviewSecret(): string {
  return process.env.PREVIEW_PASSWORD?.trim() || "";
}

function getCookieSigningSecret(): string {
  return process.env.PREVIEW_COOKIE_SECRET?.trim() || "";
}

function signValue(value: string): string {
  const secret = getCookieSigningSecret();
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function verifyPreviewPassword(input: string): boolean {
  const expected = getPreviewSecret();
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildPreviewCookieValue(): string | null {
  const secret = getCookieSigningSecret();
  if (!secret) return null;
  const payload = "ok";
  return `${payload}.${signValue(payload)}`;
}

export function validatePreviewCookieValue(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return false;
  const expected = signValue(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function previewCookieName(): string {
  return PREVIEW_COOKIE;
}

export async function isPreviewAuthorized(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(PREVIEW_COOKIE)?.value;
  return validatePreviewCookieValue(value);
}
