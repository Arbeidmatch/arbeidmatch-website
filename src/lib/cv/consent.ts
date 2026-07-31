import { createHash } from "node:crypto";

/**
 * The consent wording is versioned and hashed. Both the client and the server hash the
 * exact strings below, and the hash is stored with every consent record, so we can always
 * prove which text a person agreed to.
 *
 * Changing any character of PRIVACY_CONSENT_TEXT or WORK_PROFILE_CONSENT_TEXT means
 * bumping CV_POLICY_VERSION in the environment.
 */

export const PRIVACY_CONSENT_TEXT =
  "I have read and accept the Privacy Policy and the Terms of Use.";

export const WORK_PROFILE_CONSENT_TEXT =
  "I agree that ArbeidMatch Norge AS creates a work profile for me so that I can be matched with jobs. My CV and the details in it are shared with our own recruitment systems and with the processors we use to run them. I can access, correct or delete my data at any time.";

export const MARKETING_CONSENT_TEXT = "Send me relevant job openings by email.";

/** The two required statements, in the order they are rendered. */
export const REQUIRED_CONSENT_TEXTS = [PRIVACY_CONSENT_TEXT, WORK_PROFILE_CONSENT_TEXT] as const;

export const DEFAULT_POLICY_VERSION = "2026-07-31";

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
