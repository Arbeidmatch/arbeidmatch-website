import { SignJWT, jwtVerify } from "jose";

type AvailabilityTokenPayload = {
  candidateId: string;
  email: string;
};

function getAvailabilitySecret(): Uint8Array {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!raw) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return new TextEncoder().encode(raw);
}

export async function signAvailabilityToken(payload: AvailabilityTokenPayload, expiresIn = "30d"): Promise<string> {
  const secret = getAvailabilitySecret();
  return new SignJWT({ cid: payload.candidateId, email: payload.email.trim().toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.candidateId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyAvailabilityToken(token: string): Promise<AvailabilityTokenPayload> {
  const secret = getAvailabilitySecret();
  const { payload } = await jwtVerify(token, secret);
  const candidateId = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!candidateId || !email) {
    throw new Error("Invalid availability token.");
  }
  return { candidateId, email };
}
