/**
 * THE FORSPRANG APP PROMPT (ORDER 272, 12 November 2026). His words: "vreau ca
 * clientii sa poata descarca aplicatia in mobilul lor si sa fie intrebati daca
 * vor daca nu o au. dar doar cand deschide de pe mobil nu si de pe desktop".
 *
 * So: a phone only (a coarse pointer and narrower than 768), never where the
 * app is already what opened the page, never within thirty days of "Senere",
 * and never on top of another window. Android gets the Google Play sheet (or the
 * browser's own install until the listing is live); an iPhone gets the three
 * Add to Home Screen steps. Everything else gets nothing.
 *
 * Pure: the component reads the browser and the profile, this decides.
 */

export const FORSPRANG_PACKAGE = "no.arbeidmatch.forsprang";
export const FORSPRANG_PLAY_URL = `https://play.google.com/store/apps/details?id=${FORSPRANG_PACKAGE}`;
export const PHONE_MAX_WIDTH = 768;

/** What the ATS sends with the profile; an older ATS sends nothing and nothing is offered. */
export type AppState = { play_live: boolean; prompt_hidden: boolean; read_only: boolean };

export function appStateFrom(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return { play_live: r.play_live === true, prompt_hidden: r.prompt_hidden === true, read_only: r.read_only === true };
}

export type Platform = "android" | "ios" | null;

export function platformOf(userAgent: string, maxTouchPoints = 0): Platform {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPod/i.test(userAgent)) return "ios";
  // iPadOS reports itself as a Mac; a Mac with a touch screen is an iPad. It is not a phone, but the width rule decides that.
  if (/iPad/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
  return null;
}

export type DeviceFacts = {
  userAgent: string;
  maxTouchPoints?: number;
  coarsePointer: boolean;
  width: number;
  /** display-mode: standalone (or fullscreen), which is how the app and a home-screen icon open the page. */
  standalone: boolean;
  /** iOS Safari's own flag for a page opened from the home screen. */
  navigatorStandalone?: boolean;
  referrer: string;
  /** navigator.getInstalledRelatedApps found the Play package. */
  relatedAppInstalled: boolean;
};

/** Inside the Forsprang Android app itself: since 13 Nov 2026 a native WebView, which names itself in the user agent. */
export function insideForsprangApp(userAgent: string): boolean {
  return /\bForsprangApp\//.test(userAgent);
}

/** The app, or a home-screen icon, is what opened this page. */
export function alreadyInstalled(f: DeviceFacts): boolean {
  return insideForsprangApp(f.userAgent) || f.standalone || f.navigatorStandalone === true || f.referrer.startsWith("android-app://") || f.relatedAppInstalled;
}

export function isPhone(f: Pick<DeviceFacts, "coarsePointer" | "width">): boolean {
  return f.coarsePointer && f.width > 0 && f.width < PHONE_MAX_WIDTH;
}

/**
 * One window per visit, by rank: the key dialog (ORDER 270), then this prompt,
 * then the recommendation (ORDER 271). A window claims the visit (in
 * sessionStorage, VISIT_POPUP_KEY) as it opens, and once one has, no other opens
 * until the next visit. The rank orders them when several want the same load:
 * each waits visitPopupDelay(kind) first, so the higher one claims it first.
 */
export const VISIT_POPUP_KEY = "am-min-side-visit-popup";
export const VISIT_POPUP_RANK = { key_dialog: 1, install_app: 2, recommendation: 3 } as const;
export type VisitPopup = keyof typeof VISIT_POPUP_RANK;

export function visitPopupDelay(kind: VisitPopup): number {
  return VISIT_POPUP_RANK[kind] * 900;
}

/** Whether a window may still open in this visit, given what it has already shown (null: nothing). */
export function visitPopupFree(shown: string | null): boolean {
  return !shown;
}

export type PromptDecision = { sheet: "android" | "ios"; primary: "play" | "install" } | null;

export function decideAppPrompt(f: DeviceFacts, app: AppState | null, shownThisVisit: string | null): PromptDecision {
  if (!app || app.prompt_hidden) return null;
  if (!isPhone(f) || alreadyInstalled(f)) return null;
  if (!visitPopupFree(shownThisVisit)) return null;
  const platform = platformOf(f.userAgent, f.maxTouchPoints);
  if (platform === "android") return { sheet: "android", primary: app.play_live ? "play" : "install" };
  if (platform === "ios") return { sheet: "ios", primary: "install" };
  return null;
}
