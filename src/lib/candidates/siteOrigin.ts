/** Absolute site origin for magic links (no trailing slash). */
export function getSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "https://www.arbeidmatch.no";
  return raw.replace(/\/+$/, "");
}
