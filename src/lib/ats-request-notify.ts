/**
 * Tells the ATS a request has just been saved, so its proposal is made at once
 * instead of when the inbox is next read (the owner, 25 September 2026: "de ce
 * trebuie sa astept eu 15 minute?"). Only the row's id travels; the ATS reads
 * the row from the database the two share, and makes one proposal per row.
 *
 * Never throws and never holds the client up for long: the ATS answers before
 * it does the work. The office copy to post@ stays the backstop for both
 * forms: the detailed form sends it through /api/send-request-email, and the
 * pop-up's save route sends the same letter itself (ORDER 296), see
 * src/lib/request-letters.ts.
 */
const ATS_BASE_URL = (process.env.ATS_BASE_URL || "https://ats.arbeidmatch.no").replace(/\/$/, "");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function atsProposeUrl(requestId: string): string | null {
  const id = String(requestId ?? "").trim();
  return UUID.test(id) ? `${ATS_BASE_URL}/api/public/website-request/${id}/propose` : null;
}

export async function tellAtsAboutRequest(requestId: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const url = atsProposeUrl(requestId);
  if (!url) return false;
  try {
    const res = await fetcher(url, { method: "POST", signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}
