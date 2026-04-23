import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PartnerSessionRow = {
  expires_at: string;
  used: boolean;
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
  hours_pref: string | null;
};

type SearchPayload = {
  session_token?: string;
  jobCategory?: string;
  experienceMin?: number;
  experienceMax?: number;
  drivingLicense?: boolean;
  language?: string;
  availability?: string;
};

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function initials(firstName: string | null, lastName: string | null): string {
  const a = normalize(firstName).charAt(0).toUpperCase();
  const b = normalize(lastName).charAt(0).toUpperCase();
  return `${a}${b}`.trim() || "C";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SearchPayload | null;
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
    .select("expires_at,used")
    .eq("session_token", sessionToken)
    .maybeSingle();

  const sessionData = sessionRes.data as PartnerSessionRow | null;
  if (sessionRes.error || !sessionData || sessionData.used || sessionData.expires_at <= nowIso) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let query = supabase
    .from("candidates")
    .select("id,first_name,last_name,job_type_pref,experience_years,has_permit,english_level,city,profile_score,share_with_employers,can_apply,hours_pref")
    .gte("profile_score", 60)
    .eq("share_with_employers", true)
    .eq("can_apply", true)
    .order("profile_score", { ascending: false })
    .limit(100);

  const jobCategory = normalize(body?.jobCategory);
  if (jobCategory) {
    query = query.ilike("job_type_pref", `%${jobCategory}%`);
  }
  if (typeof body?.experienceMin === "number" && Number.isFinite(body.experienceMin)) {
    query = query.gte("experience_years", body.experienceMin);
  }
  if (typeof body?.experienceMax === "number" && Number.isFinite(body.experienceMax)) {
    query = query.lte("experience_years", body.experienceMax);
  }
  if (body?.drivingLicense) {
    query = query.eq("has_permit", true);
  }
  const language = normalize(body?.language);
  if (language) {
    query = query.ilike("english_level", `%${language}%`);
  }
  const availability = normalize(body?.availability);
  if (availability) {
    query = query.ilike("hours_pref", `%${availability}%`);
  }

  const candidateRes = await query;
  if (candidateRes.error) {
    return NextResponse.json({ error: "Could not search candidates." }, { status: 500 });
  }

  const results = ((candidateRes.data || []) as CandidateRow[]).map((candidate) => {
    const base = Number(candidate.profile_score ?? 60);
    const expYears = Number(candidate.experience_years ?? 0);
    const score = Math.max(60, Math.min(99, Math.round(base * 0.75 + expYears * 2.5)));
    return {
      candidateId: candidate.id,
      initials: initials(candidate.first_name, candidate.last_name),
      category: candidate.job_type_pref || "General",
      experienceYears: expYears,
      compatibilityScore: score,
    };
  });

  return NextResponse.json({ candidates: results });
}
