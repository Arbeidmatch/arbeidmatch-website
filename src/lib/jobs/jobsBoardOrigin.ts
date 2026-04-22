/** Public job board (subdomain). Listing lives at origin; job paths mirror legacy `/jobs/…` routes. */
export const JOBS_BOARD_ORIGIN = "https://jobs.arbeidmatch.no";

/**
 * Maps in-app paths like `/jobs`, `/jobs?browse=1`, `/jobs/slug/apply` to absolute URLs on the jobs subdomain.
 * `/jobs` (and `/jobs/` with query only) resolves to `https://jobs.arbeidmatch.no` preserving search params.
 */
export function jobsBoardAbsoluteUrl(internalPathAndQuery: string): string {
  const raw = internalPathAndQuery.trim();
  if (!raw) return JOBS_BOARD_ORIGIN;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  const u = new URL(normalized, `${JOBS_BOARD_ORIGIN}/`);
  const pathCollapsed = u.pathname.replace(/\/+$/, "") || "/";
  if (pathCollapsed === "/jobs") {
    const listing = new URL(JOBS_BOARD_ORIGIN);
    u.searchParams.forEach((value, key) => {
      listing.searchParams.set(key, value);
    });
    return listing.href;
  }
  return u.href;
}
