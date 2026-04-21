import { NextRequest, NextResponse } from "next/server";

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
  qualificationOtherText: string | null;
  preferenceTags: unknown;
  rating: number | null;
  cvText: string | null;
};

type CandidateOut = Omit<CandidateRow, "cvText"> & { compatibilityScore: number };

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

async function validateSessionToken(sessionToken: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("partner_sessions")
    .select("id")
    .eq("session_token", sessionToken)
    .eq("used", false)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const sessionToken = request.headers.get("x-session-token")?.trim() || "";
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const validSession = await validateSessionToken(sessionToken);
  if (!validSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ candidates: [], total: 0 }, { status: 500 });
  }

  const role = (request.nextUrl.searchParams.get("role") || "").trim();
  const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20);
  const offset = parsePositiveInt(request.nextUrl.searchParams.get("offset"), 0);

  let countQuery = supabase
    .from("Candidate")
    .select("id", { count: "exact", head: true })
    .is("deletedAt", null);

  let dataQuery = supabase
    .from("Candidate")
    .select(
      "id,nationality,city,country,availableFrom,englishLevel,norwegianLevel,yearsOfExperience,hasDrivingLicense,salaryExpectations,salaryExpectationsCurrency,qualificationOtherText,preferenceTags,rating,cvText",
    )
    .is("deletedAt", null)
    .range(offset, offset + Math.max(1, limit) - 1);

  if (role) {
    const rolePattern = `%${role}%`;
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
    qualificationOtherText: candidate.qualificationOtherText,
    preferenceTags: candidate.preferenceTags,
    rating: candidate.rating,
    compatibilityScore: computeCompatibilityScore(role, candidate.rating),
  }));

  return NextResponse.json({
    candidates,
    total: count ?? 0,
  });
}
