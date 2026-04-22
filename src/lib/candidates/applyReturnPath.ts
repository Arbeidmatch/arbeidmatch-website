/** Only in-app job URLs may be used as post-profile redirects (open redirect hardening). */
export function sanitizeApplyReturnPath(siteOrigin: string, raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().slice(0, 2000);
  if (t.includes("\n") || t.includes("\r")) return null;

  if (t.startsWith("/")) {
    if (!t.startsWith("/jobs")) return null;
    if (t.startsWith("//")) return null;
    return t;
  }

  try {
    const base = new URL(siteOrigin);
    const u = new URL(t, base);
    if (u.origin !== base.origin) return null;
    if (!u.pathname.startsWith("/jobs")) return null;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}
