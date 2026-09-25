/**
 * The consent wording is versioned and hashed. Both the client and the server hash the
 * exact strings below, and the hash is stored with every consent record, so we can always
 * prove which text a person agreed to.
 *
 * Changing any character of PRIVACY_CONSENT_TEXT or WORK_PROFILE_CONSENT_TEXT means
 * bumping CV_POLICY_VERSION in the environment.
 *
 * Legal review, 25 September 2026: the first box is an acknowledgement that the
 * privacy notice was read, never an acceptance of it, and the CV builder does not
 * ask anyone to accept our Terms. The consent is the second box, on its own.
 */

export const PRIVACY_CONSENT_TEXT = "I have read the privacy notice.";

export const WORK_PROFILE_CONSENT_TEXT =
  "I agree that ArbeidMatch Norge AS creates a work profile for me so that I can be matched with jobs. My CV and the details in it are shared with our own recruitment systems and with the processors we use to run them. I can access, correct or delete my data at any time.";

export const MARKETING_CONSENT_TEXT = "Send me relevant job openings by email.";

/** The two required statements, in the order they are rendered. */
export const REQUIRED_CONSENT_TEXTS = [PRIVACY_CONSENT_TEXT, WORK_PROFILE_CONSENT_TEXT] as const;

