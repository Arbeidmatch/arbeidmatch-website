import { JOBS_BOARD_ORIGIN, jobsBoardAbsoluteUrl } from "@/lib/jobs/jobsBoardOrigin";

/** Safe post-profile redirects: legacy `/jobs…` on www, or same paths on the jobs subdomain (open redirect hardening). */
export function sanitizeApplyReturnPath(siteOrigin: string, raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().slice(0, 2000);
  if (t.includes("\n") || t.includes("\r")) return null;

  const jobsOrigin = new URL(JOBS_BOARD_ORIGIN).origin;

  if (t.startsWith("/")) {
    if (!t.startsWith("/jobs")) return null;
    if (t.startsWith("//")) return null;
    return jobsBoardAbsoluteUrl(t);
  }

  try {
    const u = new URL(t);
    if (u.origin === jobsOrigin && u.pathname.startsWith("/jobs")) {
      return u.href;
    }
    const base = new URL(siteOrigin);
    const rel = new URL(t, base);
    if (rel.origin !== base.origin) return null;
    if (!rel.pathname.startsWith("/jobs")) return null;
    return jobsBoardAbsoluteUrl(`${rel.pathname}${rel.search}${rel.hash}`);
  } catch {
    return null;
  }
}
