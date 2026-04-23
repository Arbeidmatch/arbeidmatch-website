import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  candidate_id: z.string().uuid(),
});

type ScoreBreakdown = {
  cv_uploaded: number;
  profile_photo: number;
  experience: number;
  certifications: number;
  driving_license: number;
  english_b2_plus: number;
  profile_complete: number;
};

function englishIsB2Plus(level: string | null): boolean {
  if (!level) return false;
  const up = level.trim().toUpperCase();
  return up === "B2" || up === "C1" || up === "C2" || up.includes("B2") || up.includes("C1") || up.includes("C2");
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const candidateId = parsed.data.candidate_id;

  const rpcRes = await supabase.rpc("recalculate_candidate_profile_score", { p_candidate_id: candidateId });
  if (!rpcRes.error && rpcRes.data) {
    return NextResponse.json(rpcRes.data);
  }

  const rowRes = await supabase
    .from("candidates")
    .select("id,cv_uploaded,profile_photo_url,experience_years,certifications,has_permit,english_level,profile_completion_step")
    .eq("id", candidateId)
    .maybeSingle();

  if (rowRes.error || !rowRes.data) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const row = rowRes.data as {
    cv_uploaded: boolean | null;
    profile_photo_url: string | null;
    experience_years: number | null;
    certifications: unknown;
    has_permit: boolean | null;
    english_level: string | null;
    profile_completion_step: number | null;
  };

  const certCount = Array.isArray(row.certifications) ? row.certifications.length : 0;
  const breakdown: ScoreBreakdown = {
    cv_uploaded: row.cv_uploaded ? 20 : 0,
    profile_photo: row.profile_photo_url ? 10 : 0,
    experience: row.experience_years != null && row.experience_years > 5 ? 25 : row.experience_years != null && row.experience_years > 3 ? 15 : 0,
    certifications: Math.min(20, Math.max(0, certCount) * 5),
    driving_license: row.has_permit ? 10 : 0,
    english_b2_plus: englishIsB2Plus(row.english_level) ? 15 : 0,
    profile_complete: (row.profile_completion_step ?? 0) >= 9 ? 10 : 0,
  };

  const score = Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  const updateRes = await supabase.from("candidates").update({ profile_score: score }).eq("id", candidateId);
  if (updateRes.error) {
    return NextResponse.json({ error: "Could not update profile score." }, { status: 500 });
  }

  return NextResponse.json({
    candidate_id: candidateId,
    profile_score: score,
    breakdown,
    source: "js_fallback",
  });
}
