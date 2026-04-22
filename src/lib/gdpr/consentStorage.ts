/** Current consent flags (explicit keys per product spec). */
export const GDPR_LS_KEY_ACCEPTED = "gdpr_accepted";
export const GDPR_LS_KEY_DISMISSED = "gdpr_dismissed";

/** Legacy single-key storage; still read for migration. */
export const GDPR_LS_KEY_LEGACY = "arbeidmatch_gdpr_consent_v1";

export type GdprStoredConsent = "accepted" | "declined" | "dismissed";

export function readGdprConsent(): GdprStoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(GDPR_LS_KEY_ACCEPTED) === "true") return "accepted";
    if (localStorage.getItem(GDPR_LS_KEY_DISMISSED) === "true") return "dismissed";

    const legacy = localStorage.getItem(GDPR_LS_KEY_LEGACY);
    if (legacy === "accepted") return "accepted";
    if (legacy === "declined") return "declined";
    return null;
  } catch {
    return null;
  }
}

export function writeGdprConsentAccepted(): void {
  try {
    localStorage.setItem(GDPR_LS_KEY_ACCEPTED, "true");
    localStorage.removeItem(GDPR_LS_KEY_DISMISSED);
    localStorage.setItem(GDPR_LS_KEY_LEGACY, "accepted");
  } catch {
    /* ignore */
  }
}

export function writeGdprConsentDismissed(): void {
  try {
    localStorage.setItem(GDPR_LS_KEY_DISMISSED, "true");
    localStorage.removeItem(GDPR_LS_KEY_ACCEPTED);
  } catch {
    /* ignore */
  }
}
