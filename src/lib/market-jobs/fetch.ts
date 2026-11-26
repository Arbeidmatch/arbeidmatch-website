import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { atsBaseUrl } from "@/lib/jobs-fetch";
import { portalSecret } from "@/lib/prosjekter/ats";
import { cleanPreviewToken, PREVIEW_COOKIE, PREVIEW_HEADER, type MarketEventInput } from "./pure";
import type { MarketJobsList, MarketSiteDetail } from "./types";

/**
 * The server-side reads and writes of the market jobs (ORDER 514).
 *
 * EVERY READ IS PER REQUEST, `cache: "no-store"`, and that is the whole point.
 * While the owner's Go public switch is off the ATS answers a request without
 * a valid preview token with no jobs, and answers a staff member's preview
 * with the jobs. A response cached here would hand one person's preview to
 * the next visitor, so nothing is ever kept between requests.
 */

/** The staff preview token from this request's cookie, or null for every visitor. */
export async function previewTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return cleanPreviewToken(jar.get(PREVIEW_COOKIE)?.value);
}

function previewHeaders(token: string | null): Record<string, string> {
  return token ? { [PREVIEW_HEADER]: token } : {};
}

const EMPTY: MarketJobsList = { jobs: [], privateTest: false, staff: false };

/** The market jobs for this request. Empty, never an error, when the ATS has none or does not answer. */
export async function fetchMarketJobs(token: string | null): Promise<MarketJobsList> {
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/market-jobs`, {
      headers: previewHeaders(token),
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return EMPTY;
    const body = (await res.json()) as { data?: Partial<MarketJobsList> };
    const jobs = Array.isArray(body.data?.jobs) ? body.data.jobs.filter((j) => j && j.kind === "market" && typeof j.id === "string") : [];
    return { jobs, privateTest: body.data?.privateTest === true, staff: body.data?.staff === true };
  } catch {
    return EMPTY;
  }
}

/**
 * One market job, or null for "not there" and "the ATS did not answer" alike.
 * Wrapped in React's per-request cache so the page and its metadata share one
 * call; nothing outlives the request.
 */
export const fetchMarketJob = cache(async (id: string, token: string | null): Promise<{ job: MarketSiteDetail; staff: boolean } | null> => {
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/market-jobs/${encodeURIComponent(id)}`, {
      headers: previewHeaders(token),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: MarketSiteDetail; staff?: boolean };
    if (!body.data || body.data.kind !== "market" || body.data.id !== id) return null;
    return { job: body.data, staff: body.staff === true };
  } catch {
    return null;
  }
});

export type MarketEventResult = { status: number; body: Record<string, unknown> };

/**
 * One event, server to server with the shared secret. The visitor is named
 * only by the anonymous id; the address is never sent.
 */
export async function postMarketEvent(
  id: string,
  event: MarketEventInput,
  visitor: { visitorId: string; userAgent: string },
  token: string | null,
): Promise<MarketEventResult> {
  const secret = portalSecret();
  if (!secret) return { status: 503, body: { error: "not_configured" } };
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/market-jobs/${encodeURIComponent(id)}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-arbeidmatch-website-secret": secret, ...previewHeaders(token) },
      body: JSON.stringify({ ...event, visitorId: visitor.visitorId, userAgent: visitor.userAgent }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: res.status, body: body ?? { error: "bad_answer" } };
  } catch {
    return { status: 503, body: { error: "unreachable" } };
  }
}
