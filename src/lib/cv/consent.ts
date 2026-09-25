import { createHash } from "node:crypto";

import { REQUIRED_CONSENT_TEXTS } from "./consent-copy";
export { PRIVACY_CONSENT_TEXT, WORK_PROFILE_CONSENT_TEXT, MARKETING_CONSENT_TEXT, REQUIRED_CONSENT_TEXTS } from "./consent-copy";

export const DEFAULT_POLICY_VERSION = "2026-09-25";

export function getPolicyVersion(): string {
  return process.env.CV_POLICY_VERSION?.trim() || DEFAULT_POLICY_VERSION;
}

/**
 * Hash of the exact rendered text. Computed identically on the client (Web Crypto) and
 * here, so a mismatch means the user saw different wording than we think.
 */
export function hashConsentText(texts: readonly string[] = REQUIRED_CONSENT_TEXTS): string {
  return createHash("sha256").update(texts.join("\n")).digest("hex");
}

export const CONSENT_TEXT_SHA256 = hashConsentText();
