import { SignJWT, jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const raw = process.env.PREMIUM_JWT_SECRET;
  if (!raw?.trim()) throw new Error("PREMIUM_JWT_SECRET is not configured.");
  return new TextEncoder().encode(raw.trim());
}

export async function signPremiumJwt(params: {
  email: string;
  plan?: string;
  /** e.g. "24h", "30d" */
  expiresIn?: string;
  /** Absolute expiry (preferred for trials aligned to trial_ends_at). */
  expiresAt?: Date;
}): Promise<string> {
  const secret = getSecret();
  const builder = new SignJWT({ plan: params.plan ?? "trial" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.email.trim().toLowerCase())
    .setIssuedAt();

  if (params.expiresAt) {
    builder.setExpirationTime(params.expiresAt);
  } else if (params.expiresIn) {
    builder.setExpirationTime(params.expiresIn);
  } else {
    builder.setExpirationTime("24h");
  }

  return builder.sign(secret);
}

export async function verifyPremiumJwt(token: string): Promise<{ email: string; plan?: string }> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  const email = typeof payload.sub === "string" ? payload.sub : "";
  if (!email) throw new Error("Invalid token subject.");
  return { email, plan: typeof payload.plan === "string" ? payload.plan : undefined };
}
