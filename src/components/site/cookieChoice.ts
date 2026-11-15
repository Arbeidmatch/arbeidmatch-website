import {
  ANALYTICS_CONSENT_EVENT,
  MARKETING_COOKIE_CONSENT_STORAGE_KEY,
  acceptAllConsent,
  defaultNecessaryOnlyConsent,
  parseStoredMarketingConsent,
} from "@/lib/marketing-cookie-consent";

/**
 * The visitor's cookie choice, shared by the slim cookie bar and the cookies
 * sheet. The same storage, event and server record the old banner used, so
 * what is counted and when does not change (ORDER 295 changes only the look).
 */

export const COOKIE_SHEET_EVENT = "am:cookie-choice";

export function storedChoice(): { analytics: boolean } | null {
  try {
    const parsed = parseStoredMarketingConsent(localStorage.getItem(MARKETING_COOKIE_CONSENT_STORAGE_KEY));
    if (!parsed) return null;
    return { analytics: Boolean((parsed as { analytics?: unknown }).analytics) };
  } catch {
    return null;
  }
}

export function saveChoice(analytics: boolean): void {
  const choice = analytics ? acceptAllConsent() : defaultNecessaryOnlyConsent();
  try {
    localStorage.setItem(MARKETING_COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(choice));
  } catch {
    /* No stored permission means no statistics. */
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
  window.dispatchEvent(new Event(COOKIE_SHEET_EVENT));
  void fetch("/api/cookie-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analytics }),
    keepalive: true,
  }).catch(() => {});
}
