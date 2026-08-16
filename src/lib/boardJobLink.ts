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

/** The board, and only the board: a posting id is digits, up to twelve of them. */
export function boardPostingId(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  return /^\d{1,12}$/.test(value) ? value : null;
}

/** Where the visitor ends up. Anything that is not a posting id goes to the board itself. */
export function boardDestination(raw: unknown): string {
  const posting = boardPostingId(raw);
  return posting ? `https://jobs.arbeidmatch.no/job/${posting}` : "https://jobs.arbeidmatch.no";
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
