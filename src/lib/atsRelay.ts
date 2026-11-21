import "server-only";

import { atsBase } from "@/lib/prosjekter/ats";

/**
 * The website's one door into the ATS database (ORDER 415, 21 November 2026).
 *
 * This site used to carry the ATS project's service-role key, so a leak of its
 * environment opened every ATS table. Pageviews, cookie answers, website errors
 * and candidate counts now go to the ATS's /api/public/website-relay, server to
 * server, with the same shared secret the mail and advert orders already send.
 * The secret never reaches a browser.
 */

export type RelayKind = "pageview" | "consent" | "incident" | "candidate-count";

export async function atsRelay<T = Record<string, unknown>>(
  kind: RelayKind,
  payload: Record<string, unknown>,
  timeoutMs = 8_000,
): Promise<T | null> {
  const secret = process.env.ATS_EMAIL_SECRET?.trim();
  if (!secret) return null;
  try {
    const res = await fetch(`${atsBase()}/api/public/website-relay`, {
      method: "POST",
      headers: { "x-website-email-secret": secret, "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, kind }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}
