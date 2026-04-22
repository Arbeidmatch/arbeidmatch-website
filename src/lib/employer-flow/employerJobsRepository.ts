import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { JobRecord, JobStatus } from "@/lib/jobs/types";
import type { GeneratedEmployerJobInsert } from "@/lib/employer-flow/generateEmployerJob";
import { sendEmployerJobDraftReadyEmail } from "@/lib/employer-flow/employerJobEmails";
import { logApiError } from "@/lib/secureLogger";

type EmployerJobRow = {
  id: string;
  employer_request_id: string | null;
  slug: string;
  title: string;
  description: string;
  requirements: string;
  salary_min: number | null;
  salary_max: number | null;
  hours: string | null;
  rotation: string | null;
  license_required: boolean;
  housing_provided: boolean;
  travel_paid: boolean;
  status: "draft" | "live" | "closed";
  company_name: string;
  employer_email: string;
  location: string;
  category: string | null;
  mapped_job_type: string | null;
  experience_years_min: number | null;
  edit_token: string | null;
  token_expires_at: string | null;
  locked_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
};

function mapStatus(row: EmployerJobRow): JobStatus {
  if (row.status === "live") return "active";
  if (row.status === "closed") return "closed";
  return "draft";
}

function rowToJobRecord(row: EmployerJobRow): JobRecord {
  const salary =
    row.salary_min !== null && row.salary_max !== null
      ? `NOK ${Math.round(row.salary_min)} to ${Math.round(row.salary_max)}`
      : "Discussed with employer";

  const requirementsList = row.requirements
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const meta = {
    mappedJobType: row.mapped_job_type,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    hours: row.hours,
    rotation: row.rotation,
    licenseRequired: row.license_required,
    housingProvided: row.housing_provided,
    travelPaid: row.travel_paid,
    experienceYearsMin: row.experience_years_min,
    category: row.category,
  };

  return {
    id: row.id,
    employerJobId: row.id,
    source: "employer_board",
    externalId: null,
    title: row.title,
    slug: row.slug,
    companyName: row.company_name,
    hideCompany: false,
    location: row.location,
    category: row.category,
    trade: row.category,
    contractType: null,
    workModel: row.hours,
    languageRequirement: null,
    salary,
    summary: row.description.slice(0, 220) + (row.description.length > 220 ? "..." : ""),
    description: row.description,
    responsibilities: [],
    requirements: requirementsList,
    benefits: [],
    startDate: null,
    applicationMethod: "internal",
    applicationUrl: null,
    applicationEmail: null,
    status: mapStatus(row),
    featured: false,
    publishedAt: row.published_at,
    expiryDate: null,
    syncStatus: "none",
    syncError: null,
    lastSyncedAt: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    employerBoardMeta: meta,
  };
}

export async function listLiveEmployerJobsAsRecords(): Promise<JobRecord[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const res = await supabase
    .from("employer_jobs")
    .select("*")
    .eq("status", "live")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (res.error || !res.data) return [];
  return (res.data as EmployerJobRow[]).map(rowToJobRecord);
}

export async function getEmployerJobBySlug(slug: string): Promise<JobRecord | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const res = await supabase.from("employer_jobs").select("*").eq("slug", slug).eq("status", "live").maybeSingle();

  if (res.error || !res.data) return null;
  return rowToJobRecord(res.data as EmployerJobRow);
}

export async function createEmployerJobDraftAfterRequest(params: {
  employerRequestId: string;
  generated: GeneratedEmployerJobInsert;
}): Promise<{ jobId: string; editToken: string; slug: string } | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const editToken = randomUUID();
  const expires = new Date(Date.now() + 7 * 86400000).toISOString();

  const insertJob = await supabase
    .from("employer_jobs")
    .insert({
      employer_request_id: params.employerRequestId,
      slug: params.generated.slug,
      title: params.generated.title,
      description: params.generated.description,
      requirements: params.generated.requirements,
      salary_min: params.generated.salary_min,
      salary_max: params.generated.salary_max,
      hours: params.generated.hours,
      rotation: params.generated.rotation,
      license_required: params.generated.license_required,
      housing_provided: params.generated.housing_provided,
      travel_paid: params.generated.travel_paid,
      status: "draft",
      company_name: params.generated.company_name,
      employer_email: params.generated.employer_email,
      location: params.generated.location,
      category: params.generated.category,
      mapped_job_type: params.generated.mapped_job_type,
      experience_years_min: params.generated.experience_years_min,
      edit_token: editToken,
      token_expires_at: expires,
    })
    .select("id, slug")
    .maybeSingle();

  if (insertJob.error || !insertJob.data?.id) {
    return null;
  }

  const jobId = insertJob.data.id as string;
  const slug = insertJob.data.slug as string;

  const tok = await supabase
    .from("job_edit_tokens")
    .insert({
      job_id: jobId,
      token: editToken,
      expires_at: expires,
    })
    .select("id")
    .maybeSingle();

  if (tok.error) {
    return null;
  }

  try {
    await sendEmployerJobDraftReadyEmail({
      to: params.generated.employer_email,
      jobId,
      editToken,
      title: params.generated.title,
    });
  } catch (e) {
    logApiError("createEmployerJobDraftAfterRequest email", e, { jobId });
  }

  return { jobId, editToken, slug };
}

export async function getEmployerDraftJobForEdit(jobId: string, token: string): Promise<EmployerJobRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const nowIso = new Date().toISOString();

  const tokenRow = await supabase
    .from("job_edit_tokens")
    .select("id, job_id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenRow.error || !tokenRow.data) return null;
  if (tokenRow.data.used_at) return null;
  if (tokenRow.data.expires_at < nowIso) return null;
  if (tokenRow.data.job_id !== jobId) return null;

  const jobRes = await supabase.from("employer_jobs").select("*").eq("id", jobId).maybeSingle();
  if (jobRes.error || !jobRes.data) return null;
  const row = jobRes.data as EmployerJobRow;
  if (row.status !== "draft" || row.locked_at) return null;
  if (row.edit_token !== token) return null;
  if (row.token_expires_at && row.token_expires_at < nowIso) return null;

  return row;
}

export async function commitEmployerJobEdit(params: {
  jobId: string;
  token: string;
  title: string;
  description: string;
  requirements: string;
}): Promise<{ ok: true; slug: string } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, reason: "Server misconfigured." };

  const draft = await getEmployerDraftJobForEdit(params.jobId, params.token);
  if (!draft) return { ok: false, reason: "Invalid or expired link." };

  const nowIso = new Date().toISOString();
  const published = nowIso.slice(0, 10);

  const upd = await supabase
    .from("employer_jobs")
    .update({
      title: params.title.trim(),
      description: params.description.trim(),
      requirements: params.requirements.trim(),
      status: "live",
      locked_at: nowIso,
      published_at: published,
      edit_token: null,
      token_expires_at: null,
      updated_at: nowIso,
    })
    .eq("id", params.jobId)
    .eq("status", "draft")
    .select("slug")
    .maybeSingle();

  if (upd.error || !upd.data?.slug) {
    return { ok: false, reason: "Could not publish job." };
  }

  await supabase.from("job_edit_tokens").update({ used_at: nowIso }).eq("token", params.token).is("used_at", null);

  return { ok: true, slug: upd.data.slug as string };
}
