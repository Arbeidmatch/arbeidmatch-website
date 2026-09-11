/**
 * Browser storage for the advert flow, every access guarded: a private window
 * or a blocked site-data setting throws on access, and the form must still work.
 */

export const DRAFT_KEY = "am_job_ad_draft_v1";
const ORDERS_KEY = "am_job_ad_orders_v1";

export function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the draft is simply not kept.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}

export type RememberedOrder = { token: string; title: string; savedAt: number };

/** The last few orders this browser created, so a client who closed the tab can find the order again. */
export function rememberedOrders(): RememberedOrder[] {
  const list = readJson<RememberedOrder[]>(ORDERS_KEY);
  return Array.isArray(list) ? list.filter((o) => o && typeof o.token === "string").slice(0, 5) : [];
}

export function rememberOrder(token: string, title: string): void {
  const rest = rememberedOrders().filter((o) => o.token !== token);
  writeJson(ORDERS_KEY, [{ token, title, savedAt: Date.now() }, ...rest].slice(0, 5));
}
