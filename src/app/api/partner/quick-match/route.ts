import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PartnerSessionRow = {
  request_token: string | null;
  expires_at: string;
  used: boolean;
};

type EmployerRequestRow = {
  category: string | null;
  experience: number | null;
  driver_license: string | null;
  english_level: string | null;
  city: string | null;
};

type CandidateRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_type_pref: string | null;
  experience_years: number | null;
  has_permit: boolean | null;
  english_level: string | null;
  city: string | null;
  profile_score: number | null;
  share_with_employers: boolean | null;
  can_apply: boolean | null;
};

type QuickMatchResult = {
  candidateId: string;
  initials: string;
  category: string;
  experienceYears: number;
  compatibilityScore: number;
};

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function initials(firstName: string | null, lastName: string | null): string {
  const a = normalize(firstName).charAt(0).toUpperCase();
  const b = normalize(lastName).charAt(0).toUpperCase();
  if (a && b) return `${a}${b}`;
  if (a) return a;
  if (b) return b;
  return "C";
}

function computeCompatibility(req: EmployerRequestRow, candidate: CandidateRow): number {
  let score = 0;

  const reqCategory = normalize(req.category);
  const candCategory = normalize(candidate.job_type_pref);
  if (reqCategory && candCategory && reqCategory === candCategory) score += 40;
  else if (!reqCategory || !candCategory) score += 20;

  const minExperience = Number(req.experience ?? 0);
  const candExperience = Number(candidate.experience_years ?? 0);
  if (candExperience >= minExperience) score += 25;
  else score += Math.max(0, 25 - Math.round((minExperience - candExperience) * 5));

  const requiresLicense = normalize(req.driver_license).length > 0;
  if (!requiresLicense || candidate.has_permit === true) score += 15;

  const reqEnglish = normalize(req.english_level);
  const candEnglish = normalize(candidate.english_level);
  if (!reqEnglish || !candEnglish) score += 10;
  else if (candEnglish.includes(reqEnglish) || reqEnglish.includes(candEnglish)) score += 10;
  else score += 5;

  const reqCity = normalize(req.city);
  const candCity = normalize(candidate.city);
  if (!reqCity || !candCity) score += 10;
  else if (reqCity === candCity) score += 10;
  else score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { session_token?: string } | null;
  const sessionToken = normalize(body?.session_token);
  if (!sessionToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const nowIso = new Date().toISOString();
  const sessionRes = await supabase
    .from("partner_sessions")
    .select("request_token,expires_at,used")
    .eq("session_token", sessionToken)
    .maybeSingle();

  const sessionData = sessionRes.data as PartnerSessionRow | null;
  if (sessionRes.error || !sessionData || sessionData.used || sessionData.expires_at <= nowIso) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const requestToken = (sessionData.request_token || "").trim();
  if (!requestToken) {
    return NextResponse.json({ candidates: [] satisfies QuickMatchResult[] });
  }

  const requirementRes = await supabase
    .from("employer_requests")
    .select("category,experience,driver_license,english_level,city")
    .eq("token_id", requestToken)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const requirementData = requirementRes.data as EmployerRequestRow | null;
  if (requirementRes.error || !requirementData) {
    return NextResponse.json({ candidates: [] satisfies QuickMatchResult[] });
  }

  const candidateRes = await supabase
    .from("candidates")
    .select("id,first_name,last_name,job_type_pref,experience_years,has_permit,english_level,city,profile_score,share_with_employers,can_apply")
    .gte("profile_score", 60)
    .eq("share_with_employers", true)
    .eq("can_apply", true)
    .order("profile_score", { ascending: false })
    .limit(500);

  if (candidateRes.error) {
    return NextResponse.json({ error: "Could not compute matches." }, { status: 500 });
  }

  const matches = ((candidateRes.data || []) as CandidateRow[])
    .map((candidate) => {
      const compatibilityScore = computeCompatibility(requirementData, candidate);
      return {
        candidateId: candidate.id,
        initials: initials(candidate.first_name, candidate.last_name),
        category: candidate.job_type_pref || "General",
        experienceYears: Number(candidate.experience_years ?? 0),
        compatibilityScore,
      } satisfies QuickMatchResult;
    })
    .filter((item) => item.compatibilityScore >= 80)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 10);

  return NextResponse.json({ candidates: matches });
}
