import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { noStoreJson } from "@/lib/apiSecurity";
import type { CandidateProfilePayload } from "@/lib/candidates/profileSchema";
import { logApiError } from "@/lib/secureLogger";

type RouteContext = { params: Promise<{ applicationId: string }> };

function formatSalaryHourly(band: CandidateProfilePayload["preferences"]["salaryHourly"]): string {
  switch (band) {
    case "400_500":
      return "NOK 400 to 500 per hour (preference band)";
    case "500_600":
      return "NOK 500 to 600 per hour (preference band)";
    case "600_plus":
      return "NOK 600+ per hour (preference band)";
    default:
      return "Not specified";
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { applicationId } = await context.params;
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!applicationId || !token) {
    return noStoreJson({ error: "Missing application or token." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return noStoreJson({ error: "Server misconfigured." }, { status: 500 });
  }

  const nowIso = new Date().toISOString();

  const res = await supabase
    .from("job_applications")
    .select(
      "id, job_id, job_title, match_score, profile_snapshot, behavioral_answers, employer_access_token, employer_access_expires_at, employer_decision, stage_2_unlocked_at, employer_feedback_reason, employer_feedback_details, feedback_shared_with_candidate",
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (res.error || !res.data) {
    logApiError("/api/employer/applications GET", res.error ?? new Error("no row"), { applicationId });
    return noStoreJson({ error: "Not found." }, { status: 404 });
  }

  const row = res.data as {
    id: string;
    job_id: string;
    job_title: string;
    match_score: number | null;
    profile_snapshot: CandidateProfilePayload | null;
    behavioral_answers: { deliveryUnderPressure?: string; safetyOnSite?: string } | null;
    employer_access_token: string | null;
    employer_access_expires_at: string | null;
    employer_decision: string | null;
    stage_2_unlocked_at: string | null;
    employer_feedback_reason: string | null;
    employer_feedback_details: string | null;
    feedback_shared_with_candidate: boolean | null;
  };

  if (!row.employer_access_token || row.employer_access_token !== token) {
    return noStoreJson({ error: "Invalid token." }, { status: 403 });
  }
  if (!row.employer_access_expires_at || row.employer_access_expires_at < nowIso) {
    return noStoreJson({ error: "Expired link." }, { status: 403 });
  }

  const snap = row.profile_snapshot;
  if (!snap) {
    return noStoreJson({ error: "Profile snapshot missing." }, { status: 500 });
  }

  const jobMeta = await supabase
    .from("employer_jobs")
    .select("category, mapped_job_type, experience_years_min")
    .eq("id", row.job_id)
    .maybeSingle();

  const category = jobMeta.data?.category ?? snap.preferences.jobType;
  const mappedType = jobMeta.data?.mapped_job_type ?? snap.preferences.jobType;

  const unlocked =
    !!row.stage_2_unlocked_at ||
    row.employer_decision === "accepted_interview" ||
    row.employer_decision === "accepted_hire";

  const stage1 = {
    jobTitle: row.job_title,
    matchScore: row.match_score,
    jobCategory: category,
    jobExperienceSignal: jobMeta.data?.experience_years_min ?? null,
    candidateExperienceBand: snap.preferences.experienceBand,
    salaryExpectationLabel: formatSalaryHourly(snap.preferences.salaryHourly),
    rotationPreference: snap.preferences.rotation,
    hasDrivingLicense: snap.preferences.hasPermit,
    housingPreference: snap.preferences.housing,
    travelPreference: snap.preferences.travel,
    behavioralAnswers: row.behavioral_answers,
    employerDecision: row.employer_decision ?? "pending",
  };

  if (!unlocked) {
    return noStoreJson({ stage: 1 as const, ...stage1 });
  }

  return noStoreJson({
    stage: 2 as const,
    ...stage1,
    fullName: `${snap.firstName} ${snap.lastName}`.trim(),
    email: snap.email,
    phone: snap.phone,
    videoUrl: snap.videoUrl,
  });
}
