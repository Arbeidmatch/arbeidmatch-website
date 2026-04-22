export const GDPR_LS_KEY = "arbeidmatch_gdpr_consent_v1";

export type GdprStoredConsent = "accepted" | "declined";

export function readGdprConsent(): GdprStoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(GDPR_LS_KEY);
    if (v === "accepted" || v === "declined") return v;
    return null;
  } catch {
    return null;
  }
}

export function writeGdprConsent(value: GdprStoredConsent) {
  try {
    localStorage.setItem(GDPR_LS_KEY, value);
  } catch {
    /* ignore */
  }
}
