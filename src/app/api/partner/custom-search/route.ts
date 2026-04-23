import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { notifyError } from "@/lib/errorNotifier";
import { computeCompatibilityScore, initials, makeCandidateHash, skillsPreview, validatePartnerSessionOrToken } from "@/lib/partnerSearch";

export const dynamic = "force-dynamic";

const filterSchema = z.object({
  category: z.string().trim().optional(),
  experience_min: z.number().min(0).max(50).optional(),
  experience_max: z.number().min(0).max(50).optional(),
  driving_license: z.boolean().optional(),
  languages: z.array(z.string().trim()).optional(),
  availability: z.enum(["available", "unavailable", "all"]).optional(),
});

const bodySchema = z.object({
  session_token: z.string().trim().min(1),
  filters: filterSchema.optional(),
  page: z.number().int().min(1).optional().default(1),
  jobCategory: z.string().trim().optional(),
  experienceMin: z.number().optional(),
  experienceMax: z.number().optional(),
  drivingLicense: z.boolean().optional(),
  language: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse((await request.json().catch(() => null)) as unknown);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }
    const { page } = parsed.data;
    const filters = parsed.data.filters ?? {
      category: parsed.data.jobCategory,
      experience_min: parsed.data.experienceMin,
      experience_max: parsed.data.experienceMax,
      driving_license: parsed.data.drivingLicense,
      languages: parsed.data.language ? [parsed.data.language] : undefined,
      availability: "all" as const,
    };

    const auth = await validatePartnerSessionOrToken(parsed.data.session_token);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    let query = supabase
      .from("candidates")
      .select("id,first_name,last_name,job_type_pref,experience_years,english_level,has_permit,profile_score,certifications,experiences,available,deleted_at,gdpr_consent")
      .gte("profile_score", 60)
      .is("deleted_at", null)
      .eq("gdpr_consent", true)
      .order("profile_score", { ascending: false })
      .limit(1000);

    if (filters.category?.trim()) {
      query = query.ilike("job_type_pref", `%${filters.category.trim()}%`);
    }
    if (typeof filters.experience_min === "number") {
      query = query.gte("experience_years", filters.experience_min);
    }
    if (typeof filters.experience_max === "number") {
      query = query.lte("experience_years", filters.experience_max);
    }
    if (filters.driving_license) {
      query = query.eq("has_permit", true);
    }
    if (filters.availability === "available") {
      query = query.eq("available", true);
    }
    if (filters.availability === "unavailable") {
      query = query.eq("available", false);
    }

    const candidateRes = await query;
    if (candidateRes.error) {
      return NextResponse.json({ error: "Could not search candidates." }, { status: 500 });
    }

    const allResults = (candidateRes.data ?? [])
      .map((candidate) => {
        const candidate_hash = makeCandidateHash(auth.sessionToken, candidate.id);
        const compatibility_score = computeCompatibilityScore({
          candidate,
          jobCategory: filters.category?.trim() || "",
          experienceMin: filters.experience_min ?? 0,
          drivingLicenseRequired: Boolean(filters.driving_license),
          languages: filters.languages ?? ["english"],
        });
        return {
          candidate_hash,
          initials: initials(candidate.first_name, candidate.last_name),
          category: candidate.job_type_pref || "General",
          experience_years: Number(candidate.experience_years ?? 0),
          compatibility_score,
          profile_score: Number(candidate.profile_score ?? 0),
          skills_preview: skillsPreview(candidate),
        };
      })
      .sort((a, b) => b.profile_score - a.profile_score);

    const limit = 10;
    const start = (page - 1) * limit;
    const pageResults = allResults.slice(start, start + limit);

    await supabase.from("partner_searches").insert({
      session_token: auth.sessionToken,
      search_type: "custom",
      criteria: filters,
      results_count: allResults.length,
    });

    if (pageResults.length > 0) {
      await supabase.from("candidate_presentations").insert(
        pageResults.map((row) => ({
          partner_session_token: auth.sessionToken,
          candidate_hash: row.candidate_hash,
          job_category: filters.category ?? null,
          compatibility_score: row.compatibility_score,
          requested_full_profile: false,
        })),
      );
    }

    return NextResponse.json({
      candidates: pageResults,
      page,
      limit,
      total: allResults.length,
      has_more: start + limit < allResults.length,
    });
  } catch (error) {
    await notifyError({ route: "/api/partner/custom-search", error });
    return NextResponse.json({ error: "Could not search candidates." }, { status: 500 });
  }
}
