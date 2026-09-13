/**
 * The front page's "Welcome" role picker and the cookie banner take turns.
 *
 * On a phone's first visit both used to open together: the picker is a
 * full-screen dialog, the banner is pinned to the bottom above it, and the
 * banner covered the picker's buttons and text (found 13 September 2026). The
 * picker announces when it opens and closes; the banner waits while it is open,
 * and on a first visit to the front page it waits a moment for the picker
 * before showing itself.
 */

export const WELCOME_SHOWN_KEY = "welcome_shown";
export const WELCOME_OPEN_EVENT = "am:welcome-open";
export const WELCOME_CLOSED_EVENT = "am:welcome-closed";

let welcomeOpen = false;

export function isWelcomeOpen(): boolean {
  return welcomeOpen;
}

export function setWelcomeOpen(open: boolean): void {
  if (welcomeOpen === open) return;
  welcomeOpen = open;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(open ? WELCOME_OPEN_EVENT : WELCOME_CLOSED_EVENT));
  }
}

/** True on the front page when the picker has not been shown yet, so it is about to open. */
export function welcomeLikelyPending(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname !== "/") return false;
  try {
    return window.localStorage.getItem(WELCOME_SHOWN_KEY) !== "true";
  } catch {
    return false;
  }
}
