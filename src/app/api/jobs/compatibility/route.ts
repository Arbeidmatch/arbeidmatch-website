import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildJobCompatibilityPayload } from "@/lib/candidates/jobCompatibility";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getJobBySlug } from "@/lib/jobs/repository";
import { listPublicActiveJobs } from "@/lib/jobs/repository";
import { isRateLimited } from "@/lib/requestProtection";
import { jobPreferencesSchema, workExperienceSchema } from "@/lib/candidates/profileSchema";
import { jobsBoardAbsoluteUrl } from "@/lib/jobs/jobsBoardOrigin";
import { logApiError } from "@/lib/secureLogger";
import type { JobRecord } from "@/lib/jobs/types";

const singleJobSchema = z.object({
  email: z.string().trim().email(),
  jobSlug: z.string().trim().min(1).max(200),
});

const smartMatchSchema = z.object({
  email: z.string().trim().email(),
  mode: z.literal("smart_match"),
  filters: z
    .object({
      category: z.string().trim().optional(),
      location: z.string().trim().optional(),
      salaryFrom: z.number().optional(),
      drivingLicenseRequired: z.boolean().optional(),
      experienceYears: z.number().min(0).max(10).optional(),
    })
    .optional(),
});

function inferCategory(job: JobRecord): string {
  const lower = `${job.category ?? ""} ${job.title} ${job.summary ?? ""} ${job.description}`.toLowerCase();
  if (lower.includes("electrical") || lower.includes("electrician")) return "Electrical & Technical";
  if (lower.includes("logistics") || lower.includes("transport")) return "Logistics & Transport";
  if (lower.includes("industry") || lower.includes("production")) return "Industry & Production";
  if (lower.includes("cleaning") || lower.includes("facility")) return "Cleaning & Facility";
  if (lower.includes("hospitality") || lower.includes("healthcare")) return "Hospitality & Healthcare";
  return "Construction & Civil";
}

function parseExperienceYears(job: JobRecord): number {
  const meta = job.employerBoardMeta?.experienceYearsMin;
  if (typeof meta === "number" && Number.isFinite(meta)) return meta;
  const text = `${job.requirements ?? ""} ${job.summary ?? ""}`;
  const m = text.match(/(\d+)\s*\+?\s*(?:years|year|yrs|yr)/i);
  return m ? Number.parseInt(m[1], 10) : 0;
}

function scoreMatch(params: {
  job: JobRecord;
  candidateCategory: string;
  candidateExperienceYears: number;
  candidateLocation: string;
  candidateHasLicense: boolean;
  candidateLanguages: string[];
}): number {
  let score = 0;
  const jobCategory = inferCategory(params.job);
  if (params.candidateCategory && params.candidateCategory.toLowerCase() === jobCategory.toLowerCase()) score += 40;

  const jobMinExp = parseExperienceYears(params.job);
  if (params.candidateExperienceYears >= jobMinExp) score += 20;

  const loc = params.candidateLocation.toLowerCase();
  if (loc && params.job.location.toLowerCase().includes(loc)) score += 15;

  const langBlob = `${params.job.languageRequirement ?? ""} ${params.job.description}`.toLowerCase();
  if (params.candidateLanguages.some((l) => langBlob.includes(l.toLowerCase()))) score += 15;

  const licenseRequired = Boolean(params.job.employerBoardMeta?.licenseRequired);
  if (!licenseRequired || params.candidateHasLicense) score += 10;

  return Math.min(100, Math.max(0, score));
}

function profileComplete(row: {
  profile_completed_at?: string | null;
  profile_completion_step?: number | null;
}): boolean {
  if (row.profile_completed_at) return true;
  const step = row.profile_completion_step ?? 0;
  return step >= 9;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "jobs-compatibility", 24, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const smartParsed = smartMatchSchema.safeParse(json);
    if (smartParsed.success) {
      const email = smartParsed.data.email.trim().toLowerCase();
      const supabase = getSupabaseAdminClient();
      if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

      const candidateRes = await supabase
        .from("candidates")
        .select("job_type_pref, experience_years, city, has_permit, permit_categories, english_level")
        .eq("email", email)
        .maybeSingle();
      if (candidateRes.error || !candidateRes.data) {
        return NextResponse.json({ error: "Candidate profile not found." }, { status: 404 });
      }

      const candidateCategory = (candidateRes.data.job_type_pref || "").trim();
      const candidateExperienceYears = Number(candidateRes.data.experience_years ?? 0);
      const candidateLocation = (smartParsed.data.filters?.location || candidateRes.data.city || "").trim();
      const candidateHasLicense = Boolean(candidateRes.data.has_permit || candidateRes.data.permit_categories);
      const candidateLanguages = [String(candidateRes.data.english_level || "english"), "english"];

      const activeJobs = await listPublicActiveJobs();
      const salaryFrom = smartParsed.data.filters?.salaryFrom;
      const onlyLicenseRequired = Boolean(smartParsed.data.filters?.drivingLicenseRequired);
      const filterCategory = (smartParsed.data.filters?.category || "").trim();
      const filterExperience = smartParsed.data.filters?.experienceYears;

      const scored = activeJobs
        .map((job) => {
          const score = scoreMatch({
            job,
            candidateCategory,
            candidateExperienceYears,
            candidateLocation,
            candidateHasLicense,
            candidateLanguages,
          });
          return { ...job, matchScore: score };
        })
        .filter((job) => job.matchScore >= 50)
        .filter((job) => {
          if (filterCategory && inferCategory(job).toLowerCase() !== filterCategory.toLowerCase()) return false;
          if (typeof filterExperience === "number" && parseExperienceYears(job) > filterExperience) return false;
          if (onlyLicenseRequired && !job.employerBoardMeta?.licenseRequired) return false;
          if (typeof salaryFrom === "number") {
            const text = job.salary || "";
            const num = Number((text.match(/(\d{2,4})/) || [])[1] || "0");
            if (num > 0 && num < salaryFrom) return false;
          }
          return true;
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return NextResponse.json({ mode: "smart_match", jobs: scored });
    }

    const parsed = singleJobSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

    const email = parsed.data.email.trim().toLowerCase();
    const jobSlug = parsed.data.jobSlug.trim();

    const job = await getJobBySlug(jobSlug);
    if (!job || job.status !== "active") {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const res = await supabase
      .from("candidates")
      .select("profile_completed_at, profile_completion_step, job_preferences, experiences")
      .eq("email", email)
      .maybeSingle();

    if (res.error || !res.data) {
      return NextResponse.json({ complete: false as const });
    }

    const row = res.data as {
      profile_completed_at?: string | null;
      profile_completion_step?: number | null;
      job_preferences?: unknown;
      experiences?: unknown;
    };

    if (!profileComplete(row)) {
      return NextResponse.json({ complete: false as const });
    }

    const prefsParsed = jobPreferencesSchema.safeParse(row.job_preferences ?? {});
    const expsParsed = z.array(workExperienceSchema).safeParse(row.experiences ?? []);

    if (!prefsParsed.success || !expsParsed.success) {
      return NextResponse.json({ complete: false as const });
    }

    const profileInput = {
      preferences: prefsParsed.data,
      experiences: expsParsed.data,
    };

    const payload = buildJobCompatibilityPayload(job, profileInput);
    const applyHref =
      job.applicationMethod === "external_url"
        ? job.applicationUrl || jobsBoardAbsoluteUrl(`/jobs/${job.slug}/apply`)
        : job.applicationMethod === "email"
          ? `mailto:${job.applicationEmail || "post@arbeidmatch.no"}`
          : jobsBoardAbsoluteUrl(`/jobs/${job.slug}/apply`);

    return NextResponse.json({
      complete: true as const,
      ...payload,
      applyHref,
      improveProfileHref: "/candidates/complete-profile",
    });
  } catch (error) {
    logApiError("/api/jobs/compatibility", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
