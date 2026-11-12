/**
 * ORDER 273: "Lagre en sikkerhetsnøkkel". His words of 12 November 2026: when
 * a client comes into Min side from the e-mail he is asked to save a security
 * key, "asta numai daca nu o are salvata deja", and then goes straight to the
 * projects.
 *
 * The login route adds ?nokkel=1 to the Min side address only when the ATS
 * says the access has no key and has not said "Senere" in the last 30 days.
 * The page then asks once more what only it can know: that this browser can
 * make a key, and that no other window has had this visit (the rank of
 * app-prompt.ts: the key dialog first, the install prompt second).
 */

import { visitPopupFree } from "@/lib/min-side/app-prompt";

export const KEY_PROMPT_PARAM = "nokkel";

/** The Min side address a login link goes to, with the key question added; any other address unchanged. */
export function withKeyPrompt(target: string, prompt: boolean): string {
  if (!prompt || !target.startsWith("/min-side/")) return target;
  const hashAt = target.indexOf("#");
  const base = hashAt < 0 ? target : target.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : target.slice(hashAt);
  return `${base}${base.includes("?") ? "&" : "?"}${KEY_PROMPT_PARAM}=1${hash}`;
}

/** Whether the address asked for the key question. */
export function keyPromptAsked(search: string): boolean {
  return new URLSearchParams(search).get(KEY_PROMPT_PARAM) === "1";
}

/** The search part with the key question taken out, for history.replaceState. */
export function withoutKeyPrompt(search: string): string {
  const q = new URLSearchParams(search);
  q.delete(KEY_PROMPT_PARAM);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type KeyDialogFacts = {
  asked: boolean;
  hasPasskey: boolean | null;
  supported: boolean;
  dismissedUntil: string | null;
  now: number;
  /** What sessionStorage says this visit already showed (VISIT_POPUP_KEY), null for nothing. */
  shownThisVisit: string | null;
};

/** The dialog opens only when all of it holds; an older ATS that says nothing about keys opens nothing. */
export function decideKeyDialog(f: KeyDialogFacts): boolean {
  if (!f.asked || f.hasPasskey !== false || !f.supported) return false;
  if (f.dismissedUntil) {
    const until = Date.parse(f.dismissedUntil);
    if (Number.isFinite(until) && until > f.now) return false;
  }
  return visitPopupFree(f.shownThisVisit);
}
