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
 * The key is `JOBS_PREVIEW_KEY` in the environment.
 *
 * WITH NO KEY SET THE SECTION IS OPEN, changed on 6 August 2026 on the owner's
 * word: he wants to reach arbeidmatch.no/jobs from a plain link, and the earlier
 * default made that impossible without an environment variable and a redeploy on a
 * second Vercel project. He asked twice; the second time it was clear the gate was
 * costing more than it protected.
 *
 * The reason the old default existed is handled elsewhere and still holds: the page
 * carries `noindex`, so it cannot arrive in a search result whether it is gated or
 * not. And there is nothing behind this gate that is not already public - it is a
 * list of our own open jobs, readable today on the ATS board without any key.
 *
 * SET A KEY AND IT LOCKS AGAIN, exactly as before, which is what makes this
 * reversible with no deploy: `JOBS_PREVIEW_KEY=<12+ characters>` closes the section
 * to everybody without the link.
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

/** True when no key is configured at all: the section is open to anyone with the link. */
export function isJobsSectionOpen(): boolean {
  return configuredKey() === null;
}

/**
 * True when this request may see the section: nobody configured a key, or the key is
 * in the url, or in the cookie that url set.
 */
export function mayViewJobsPreview(args: { paramKey?: string | null; cookieKey?: string | null }): boolean {
  if (isJobsSectionOpen()) return true;
  return isPreviewKeyValid(args.paramKey) || isPreviewKeyValid(args.cookieKey);
}
