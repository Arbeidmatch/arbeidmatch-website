export const MARKETING_COOKIE_CONSENT_STORAGE_KEY = "arbeidmatch_cookie_consent_v2";
export const ANALYTICS_CONSENT_EVENT = "arbeidmatch-analytics-consent-changed";

/** Dispatched on `window` to reopen the cookie UI from footer etc. */
export const MARKETING_COOKIE_SETTINGS_EVENT = "arbeidmatch-open-cookie-settings";

/** Our renewal interval; an expired choice never permits collection. */
export const MARKETING_COOKIE_CONSENT_MAX_AGE_DAYS = 365;

export type MarketingCookieConsent = {
  v: 2;
  necessary: true;
  analytics: boolean;
  marketing: false;
  ts: string;
};

export function defaultNecessaryOnlyConsent(): MarketingCookieConsent {
  return {
    v: 2,
    necessary: true,
    analytics: false,
    marketing: false,
    ts: new Date().toISOString(),
  };
}

export function acceptAllConsent(): MarketingCookieConsent {
  return {
    v: 2,
    necessary: true,
    analytics: true,
    marketing: false,
    ts: new Date().toISOString(),
  };
}

/** True when the record is older than the maximum age, or its timestamp cannot be read. */
export function isConsentExpired(ts: string, now: Date = new Date()): boolean {
  const taken = Date.parse(ts);
  if (!Number.isFinite(taken)) return true;
  const ageDays = (now.getTime() - taken) / 86_400_000;
  // A timestamp in the future is a clock that moved, not a fresh choice.
  if (ageDays < 0) return true;
  return ageDays > MARKETING_COOKIE_CONSENT_MAX_AGE_DAYS;
}

export function parseStoredMarketingConsent(
  raw: string | null,
  now: Date = new Date(),
): MarketingCookieConsent | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<MarketingCookieConsent>;
    if (j?.v !== 2 || j.necessary !== true || typeof j.analytics !== "boolean") return null;
    const ts = typeof j.ts === "string" && j.ts ? j.ts : "";
    if (!ts || isConsentExpired(ts, now)) return null;
    return {
      v: 2,
      necessary: true,
      analytics: j.analytics,
      marketing: false,
      ts,
    };
  } catch {
    return null;
  }
}

/** Read at the point of collection, including after withdrawal in another tab. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return parseStoredMarketingConsent(window.localStorage.getItem(MARKETING_COOKIE_CONSENT_STORAGE_KEY))?.analytics === true;
  } catch {
    return false;
  }
}
