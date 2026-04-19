/** Base URL for Premium Stripe redirects (same pattern as DSB checkout). */
export function getPublicBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.arbeidmatch.no";
  return raw.replace(/\/$/, "");
}
