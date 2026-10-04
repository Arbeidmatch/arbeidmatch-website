/**
 * The public link to a job posting, and where it actually goes.
 *
 * HIS DECISION, 16 August 2026, in two halves on the same afternoon. First: the
 * ATS address is not to be visible in public, so a comment under one of our
 * adverts carries the posting on the board and not
 * `ats.arbeidmatch.no/api/go/apply?p=...`. Then, once he was shown that the
 * public comments produce twenty-one of every thirty-six taps we get: if we want
 * the count, it goes on the board link.
 *
 * A link straight to the board cannot be counted by us at all - the visitor
 * never touches anything of ours on the way. So the public link is this site,
 * `arbeidmatch.no/j/482823`, which is his own brand and not the ATS, and this
 * page is a redirect: it records the tap through the ATS and sends the person on
 * to the posting. One hop, a few milliseconds, and the address a stranger reads
 * is the one he approved.
 *
 * Pure and dependency-free so both halves are tested without a browser.
 */

/** A posting number, and only that: digits, up to twelve of them. */
export function boardPostingId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  return /^\d{1,12}$/.test(value) ? value : null;
}

/** Our own site, and the list of open positions on it. */
const SITE = "https://www.arbeidmatch.no";
export const OUR_JOB_LIST = `${SITE}/jobs`;

/**
 * Where the visitor ends up: the advert on our own site.
 *
 * REPAIR R20, 4 October 2026. HIS RULE, said twice: we work through RecOS only
 * and nothing of ours points at the old board. Until today this address sent
 * the person straight there, where applying puts them into another system and
 * they never reach the job or the project it belongs to. The link under every
 * advert we have ever published stays exactly as it is; what is behind it is
 * now the advert's own page here, where the application form reaches the job.
 *
 * Anything we cannot place lands on our own list rather than on an error page:
 * a stale reference in an old comment should show somebody what is open now.
 */
export function advertDestination(slug: unknown): string {
  const value = String(slug ?? "").trim();
  if (!value || !/^[A-Za-z0-9._-]{1,220}$/.test(value)) return OUR_JOB_LIST;
  return `${SITE}/stilling/${encodeURIComponent(value)}`;
}

/**
 * The posting number at the end of an imported advert's address, or null.
 *
 * Only ever applied to the rows the ATS gives us, so it judges the path and
 * leaves the host alone: an imported advert is the only thing carrying
 * `/job/<number>`, and the host it came from is not an address we repeat.
 */
export function postingIdOfExternalUrl(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const m = url.pathname.match(/^\/job\/(\d{1,12})\/?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Where the tap is recorded: the ATS redirect, called from our server and never
 * shown to anybody.
 *
 * `src` says which surface it came from, so a tap under an advert is not folded
 * into the bot's conversation funnel. Null when there is no posting to attribute
 * it to, and then nothing is recorded rather than something being recorded
 * against the wrong job.
 */
export function clickRecordUrl(raw: unknown, src: string | null): string | null {
  const posting = boardPostingId(raw);
  if (!posting) return null;
  const surface = String(src ?? "comment")
    .toLowerCase()
    .replace(/[^a-z_]/g, "")
    .slice(0, 24);
  return `https://ats.arbeidmatch.no/api/go/apply?p=${posting}&src=${surface || "comment"}`;
}
