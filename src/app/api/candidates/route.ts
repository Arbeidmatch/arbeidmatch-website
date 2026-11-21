import { NextRequest, NextResponse } from "next/server";

import { isKeyRateLimited } from "@/lib/apiSecurity";
import { partnerSessionFor } from "@/lib/partnerSession";
import { safeIlikePattern } from "@/lib/postgrestSafe";
import { isRateLimited } from "@/lib/requestProtection";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type CandidateRow = {
  id: string;
  nationality: string | null;
  city: string | null;
  country: string | null;
  availableFrom: string | null;
  englishLevel: string | null;
  norwegianLevel: string | null;
  yearsOfExperience: number | null;
  hasDrivingLicense: boolean | null;
  salaryExpectations: string | number | null;
  salaryExpectationsCurrency: string | null;
  rating: number | null;
};

/** Only what the partner page shows (ORDER 415); the rating is used for the score and not sent. */
type CandidateOut = Omit<CandidateRow, "rating"> & { compatibilityScore: number };

const MAX_PAGE = 50;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function computeCompatibilityScore(role: string, rating: number | null): number {
  if (!role) return 50;
  const safeRating = Number.isFinite(rating ?? null) ? Number(rating) : 0;
  return Math.min(99, Math.max(0, Math.round(70 + safeRating * 5)));
}

export async function GET(request: NextRequest) {
  const sessionToken = request.headers.get("x-session-token")?.trim() || "";
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(request, "partner-candidates", 30, 10 * 60 * 1000) || isKeyRateLimited("partner-candidates", sessionToken, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const session = await partnerSessionFor(sessionToken, { startWindow: true });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ candidates: [], total: 0 }, { status: 500 });
  }

  const role = (request.nextUrl.searchParams.get("role") || "").trim().slice(0, 120);
  const limit = Math.min(MAX_PAGE, parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20));
  const offset = parsePositiveInt(request.nextUrl.searchParams.get("offset"), 0);

  let countQuery = supabase
    .from("Candidate")
    .select("id", { count: "exact", head: true })
    .is("deletedAt", null);

  let dataQuery = supabase
    .from("Candidate")
    .select(
      "id,nationality,city,country,availableFrom,englishLevel,norwegianLevel,yearsOfExperience,hasDrivingLicense,salaryExpectations,salaryExpectationsCurrency,rating",
    )
    .is("deletedAt", null)
    .range(offset, offset + Math.max(1, limit) - 1);

  const rolePattern = role ? safeIlikePattern(role, 80) : null;
  if (rolePattern) {
    countQuery = countQuery.ilike("cvText", rolePattern);
    dataQuery = dataQuery.ilike("cvText", rolePattern);
  }

  const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery]);
  if (countError || dataError) {
    return NextResponse.json({ candidates: [], total: 0 }, { status: 500 });
  }

  const candidates: CandidateOut[] = ((data ?? []) as CandidateRow[]).map((candidate) => ({
    id: candidate.id,
    nationality: candidate.nationality,
    city: candidate.city,
    country: candidate.country,
    availableFrom: candidate.availableFrom,
    englishLevel: candidate.englishLevel,
    norwegianLevel: candidate.norwegianLevel,
    yearsOfExperience: candidate.yearsOfExperience,
    hasDrivingLicense: candidate.hasDrivingLicense,
    salaryExpectations: candidate.salaryExpectations,
    salaryExpectationsCurrency: candidate.salaryExpectationsCurrency,
    compatibilityScore: computeCompatibilityScore(role, candidate.rating),
  }));

  return NextResponse.json({
    candidates,
    total: count ?? 0,
  });
}
