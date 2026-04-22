import { createHmac, timingSafeEqual } from "node:crypto";

export type PartnerOfferDecision = "accept" | "decline";

type SignedPayload = {
  requestId: string;
  decision: PartnerOfferDecision;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.PARTNER_OFFER_ACTION_SECRET?.trim() || process.env.SLACK_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing PARTNER_OFFER_ACTION_SECRET");
  }
  return secret;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signData(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createPartnerOfferDecisionToken(requestId: string, decision: PartnerOfferDecision, ttlMinutes = 60 * 24 * 14): string {
  const payload: SignedPayload = {
    requestId,
    decision,
    exp: Math.floor(Date.now() / 1000) + ttlMinutes * 60,
  };
  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const sig = signData(payloadEncoded);
  return `${payloadEncoded}.${sig}`;
}

export function verifyPartnerOfferDecisionToken(token: string, expectedDecision: PartnerOfferDecision): {
  valid: boolean;
  reason?: "invalid" | "expired" | "decision_mismatch";
  requestId?: string;
} {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return { valid: false, reason: "invalid" };
  }

  const expectedSig = signData(payloadEncoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, reason: "invalid" };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadEncoded)) as SignedPayload;
    if (!parsed.requestId || !parsed.decision || !parsed.exp) {
      return { valid: false, reason: "invalid" };
    }
    if (parsed.decision !== expectedDecision) {
      return { valid: false, reason: "decision_mismatch" };
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: "expired" };
    }
    return { valid: true, requestId: parsed.requestId };
  } catch {
    return { valid: false, reason: "invalid" };
  }
}

export function getSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "https://arbeidmatch.no";
}

