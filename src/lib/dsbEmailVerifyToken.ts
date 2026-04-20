import { createHmac, timingSafeEqual } from "crypto";

import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

export type DsbEmailVerifyPayload = {
  email: string;
  guide_slug: DsbGuideSlug;
  exp: number;
};

function getSecretOrThrow(): string {
  const secret = process.env.DSB_EMAIL_VERIFY_SECRET?.trim();
  if (!secret) {
    throw new Error("DSB_EMAIL_VERIFY_SECRET is not configured");
  }
  return secret;
}

function getSecretForVerify(): string | null {
  const secret = process.env.DSB_EMAIL_VERIFY_SECRET?.trim();
  return secret || null;
}

/** Signed token: base64url(payload).hmac - valid until `exp` (unix ms). */
export function signDsbEmailVerifyToken(
  payload: Omit<DsbEmailVerifyPayload, "exp"> & { expMs: number },
): string {
  const secret = getSecretOrThrow();
  const body: DsbEmailVerifyPayload = {
    email: payload.email.trim().toLowerCase(),
    guide_slug: payload.guide_slug,
    exp: payload.expMs,
  };
  const payloadB64 = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyDsbEmailVerifyToken(token: string): DsbEmailVerifyPayload | null {
  const secret = getSecretForVerify();
  if (!secret) return null;
  const parts = token.trim().split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;
  const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  let parsed: DsbEmailVerifyPayload;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as DsbEmailVerifyPayload;
  } catch {
    return null;
  }
  if (parsed.guide_slug !== "eu" && parsed.guide_slug !== "non-eu") return null;
  if (!parsed.email?.includes("@")) return null;
  if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
  return parsed;
}
