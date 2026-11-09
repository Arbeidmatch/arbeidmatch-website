import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { hiringTableQuery, isProfileToken } from "@/lib/min-side/profile";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const NOT_FOUND = "Listen ble ikke funnet.";
const BAD_REQUEST = "Ugyldig forespørsel.";
const UNAVAILABLE = "Listen kunne ikke hentes akkurat nå. Prøv igjen om litt.";

/**
 * ORDER 252: one page of "Bedrifter som ansetter", searched, filtered and
 * sorted by the ATS. The ATS decides what this key may see (404 without an
 * accepted hiring subscription; Basis cut to its county and seven days); this
 * only checks the shapes and passes the JSON on from this site's own address,
 * so the page key never leaves for another host.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProfileToken(token)) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  const rate = getRateLimitResult(request, "min-side-hiring-table", 600, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: "For mange forespørsler. Prøv igjen litt senere." }, { status: 429 });
  const query = hiringTableQuery(request.nextUrl.searchParams);
  if (query === null) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });

  const res = await callAts(`/api/public/client-profile/${token}/hiring${query ? `?${query}` : ""}`, { method: "GET", visitorHeaders: request.headers });
  if (res.status === 404) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  if (res.status !== 200 || !Array.isArray(res.body.rows)) return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
  return noStoreJson(res.body, { status: 200 });
}
