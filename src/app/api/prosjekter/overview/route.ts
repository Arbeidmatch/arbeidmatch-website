import { NextRequest, NextResponse } from "next/server";

import { getRateLimitResult } from "@/lib/apiSecurity";
import { callAts } from "@/lib/prosjekter/ats";
import { filtersFrom, filtersQuery } from "@/lib/prosjekter/types";

export const dynamic = "force-dynamic";

/**
 * The open project register, for the /prosjekter page when a visitor changes a
 * filter or a page. Forwards only the parameters the ATS reads, vouching for
 * the visitor so the ATS counts them and not this site.
 */
export async function GET(request: NextRequest) {
  const rate = getRateLimitResult(request, "prosjekter-overview", 120, 10 * 60 * 1000);
  if (rate.limited) {
    return NextResponse.json(
      { error: "For mange forespørsler. Prøv igjen litt senere." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }
  const query = filtersQuery(filtersFrom(Object.fromEntries(request.nextUrl.searchParams)));
  const answer = await callAts(`/api/public/projects-overview${query}`, {
    method: "GET",
    visitorHeaders: request.headers,
  });
  return NextResponse.json(answer.body, {
    status: answer.status,
    headers: {
      "Cache-Control": answer.status === 200 ? "public, max-age=60, s-maxage=300" : "no-store",
    },
  });
}
