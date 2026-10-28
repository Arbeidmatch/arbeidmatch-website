import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { hiringCsvQuery, isProfileToken } from "@/lib/min-side/profile";
import { callAtsRaw } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const NOT_FOUND = "Listen ble ikke funnet.";
const BAD_REQUEST = "Ugyldig forespørsel.";
const UNAVAILABLE = "Listen kunne ikke hentes akkurat nå. Prøv igjen om litt.";

/**
 * ORDER 157: "Last ned" in Bedrifter som ansetter, the list as CSV with the
 * filters on screen. The ATS decides whether this person may have it (404 in
 * Basis, or without hiring alerts); this only checks the shapes and passes the
 * file on from this site's own address, so the page key never leaves for
 * another host.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProfileToken(token)) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  const rate = getRateLimitResult(request, "min-side-hiring-csv", 120, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: "For mange forespørsler. Prøv igjen litt senere." }, { status: 429 });
  const query = hiringCsvQuery(request.nextUrl.searchParams);
  if (query === null) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });

  const res = await callAtsRaw(`/api/public/client-profile/${token}/hiring-csv${query ? `?${query}` : ""}`, { visitorHeaders: request.headers, accept: "text/csv" });
  if (!res) return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
  if (!res.ok || !String(res.headers.get("content-type") ?? "").includes("text/csv") || !res.body) {
    return noStoreJson({ error: res.status === 404 ? NOT_FOUND : UNAVAILABLE }, { status: res.status === 404 ? 404 : 503 });
  }
  const disposition = res.headers.get("content-disposition");
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": disposition && /^attachment;/i.test(disposition) ? disposition : 'attachment; filename="bedrifter-som-ansetter.csv"',
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
