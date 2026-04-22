/**
 * Path prefixes for pages that export robots noindex (internal / tool flows).
 * Keep in sync with page-level `robots: { index: false }` metadata.
 */
const NOINDEX_PREFIXES = [
  "/admin",
  "/request",
  "/score",
  "/verified",
  "/jobs/edit",
  "/candidates",
  "/employer/candidates",
  "/dsb-guide/eu",
  "/dsb-guide/non-eu",
  "/dsb-support",
  "/dsb-assistance",
  "/feedback",
  "/premium/success",
  "/premium/browse",
  "/dsb-preview",
  "/engineers-technical",
  "/dsb-support/verify",
] as const;

export function isInternalNoIndexPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
