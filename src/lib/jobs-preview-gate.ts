/**
 * No `server-only` here on purpose: the middleware imports it, and the edge
 * runtime is not the place to argue with that guard. Nothing leaks either way -
 * `JOBS_PREVIEW_KEY` has no NEXT_PUBLIC prefix, so a client bundle would read
 * undefined and refuse everybody.
 */
/**
 * Who may see the jobs section while it is still being built.
 *
 * The owner asked for it to live here rather than in the ATS, and to stay
 * invisible until it is ready, with one exception: a link he opens himself from
 * Slack. So this is a key in the address, and once it is right a cookie carries
 * it for the rest of the session - he taps the link once on his phone rather
 * than pasting a query string on every page.
 *
 * A WRONG KEY IS A 404, NOT A LOCKED PAGE. A "you need access" screen tells
 * anybody who wanders past that there is something here and invites them to
 * guess. Nothing should be visible at all.
 *
 * The key is `JOBS_PREVIEW_KEY` in the environment. With none set the section is
 * closed to everybody, including whoever forgot to set it - a preview that
 * defaults to open is how an unfinished page ends up in a search result.
 */

export const JOBS_PREVIEW_COOKIE = "am_jobs_preview";
export const JOBS_PREVIEW_PARAM = "k";

function configuredKey(): string | null {
  const raw = process.env.JOBS_PREVIEW_KEY?.trim();
  return raw && raw.length >= 12 ? raw : null;
}

/**
 * Constant time, because this is compared against a value from the address bar.
 * A short circuit on the first wrong character is a way to learn the key one
 * character at a time.
 */
function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isPreviewKeyValid(candidate: string | null | undefined): boolean {
  const key = configuredKey();
  if (!key) return false;
  const value = (candidate ?? "").trim();
  if (!value) return false;
  return sameKey(value, key);
}

/** True when this request may see the section: a key in the url, or the cookie it set. */
export function mayViewJobsPreview(args: { paramKey?: string | null; cookieKey?: string | null }): boolean {
  return isPreviewKeyValid(args.paramKey) || isPreviewKeyValid(args.cookieKey);
}
