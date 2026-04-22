import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildJobCompatibilityPayload } from "@/lib/candidates/jobCompatibility";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getJobBySlug } from "@/lib/jobs/repository";
import { isRateLimited } from "@/lib/requestProtection";
import { jobPreferencesSchema, workExperienceSchema } from "@/lib/candidates/profileSchema";
import { jobsBoardAbsoluteUrl } from "@/lib/jobs/jobsBoardOrigin";
import { logApiError } from "@/lib/secureLogger";

const bodySchema = z.object({
  email: z.string().trim().email(),
  jobSlug: z.string().trim().min(1).max(200),
});

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

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

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
