import { createHmac } from "crypto";

export type EligibilityVerificationPayload = {
  source: "eligibility-assistance";
  notifyEmail: string;
  wantsAssistance?: string;
  targetRegion?: string;
  targetCountry?: string;
  marketingConsent?: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSecret(): string {
  return process.env.EMAIL_VERIFICATION_SECRET || process.env.CRON_SECRET || "change-this-secret";
}

export function createEligibilityVerificationToken(
  payload: Omit<EligibilityVerificationPayload, "iat" | "exp">,
  expiresInSeconds = 24 * 60 * 60,
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: EligibilityVerificationPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest("hex");
  return `${encodedPayload}.${signature}`;
}

export function verifyEligibilityVerificationToken(token: string): EligibilityVerificationPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmac("sha256", getSecret()).update(encodedPayload).digest("hex");
  if (expectedSignature !== signature) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as EligibilityVerificationPayload;
    if (parsed.source !== "eligibility-assistance") return null;
    if (!parsed.notifyEmail || !parsed.notifyEmail.includes("@")) return null;
    if (!parsed.exp || Math.floor(Date.now() / 1000) > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
