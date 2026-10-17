import { NextRequest, NextResponse } from "next/server";

import { getRateLimitResult } from "@/lib/apiSecurity";
import { searchBrregCompanies } from "@/lib/brreg";
import { notifyError } from "@/lib/errorNotifier";

/** At most 60 searches per visitor in ten minutes (PROJ-SEC, 17 October 2026). */
const SEARCH_LIMIT = 60;
const SEARCH_WINDOW_MS = 10 * 60 * 1000;
/** No company name is longer than this; a longer query is refused, not sent on. */
const QUERY_MAX = 100;

/**
 * The company search behind the forms (the project portal's access form and
 * others). A refusal of the visitor's own request (too many, too long) is a
 * 4xx and never an error report: only a failure on our side notifies.
 */
export async function GET(request: NextRequest) {
  const rate = getRateLimitResult(request, "brreg-search", SEARCH_LIMIT, SEARCH_WINDOW_MS);
  if (rate.limited) {
    return NextResponse.json(
      { success: false, companies: [], error: "For mange søk. Prøv igjen litt senere." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length > QUERY_MAX) {
    return NextResponse.json({ success: false, companies: [], error: "Søket er for langt." }, { status: 400 });
  }
  if (q.length < 2) {
    return NextResponse.json({ success: true, companies: [] });
  }
  try {
    const companies = await searchBrregCompanies(q);
    return NextResponse.json({ success: true, companies: companies ?? [] });
  } catch (error) {
    await notifyError({ route: "/api/brreg/search", error });
    return NextResponse.json({ success: false, companies: [] }, { status: 500 });
  }
}
