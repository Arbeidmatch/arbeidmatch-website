import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import {
  sendCandidateAcceptedEmail,
  sendCandidateRejectionFeedbackEmail,
} from "@/lib/employer-flow/employerJobEmails";

const decisionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept_interview"),
    token: z.string().uuid(),
  }),
  z.object({
    action: z.literal("accept_hire"),
    token: z.string().uuid(),
  }),
  z.object({
    action: z.literal("reject"),
    token: z.string().uuid(),
    reason: z.enum(["Experience", "Salary", "Location", "Professionalism", "Other"]),
    details: z.string().trim().min(8).max(4000),
    shareWithCandidate: z.boolean(),
  }),
]);

type RouteContext = { params: Promise<{ applicationId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { applicationId } = await context.params;
  if (!applicationId) {
    return noStoreJson({ error: "Missing application id." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return noStoreJson({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = decisionSchema.safeParse(json);
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return noStoreJson({ error: "Server misconfigured." }, { status: 500 });
  }

  const nowIso = new Date().toISOString();

  const existing = await supabase
    .from("job_applications")
    .select(
      "id, email, job_title, employer_access_token, employer_access_expires_at, employer_decision, stage_2_unlocked_at",
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return noStoreJson({ error: "Not found." }, { status: 404 });
  }

  const row = existing.data as {
    id: string;
    email: string;
    job_title: string;
    employer_access_token: string | null;
    employer_access_expires_at: string | null;
    employer_decision: string | null;
    stage_2_unlocked_at: string | null;
  };

  if (!row.employer_access_token || row.employer_access_token !== parsed.data.token) {
    return noStoreJson({ error: "Invalid token." }, { status: 403 });
  }
  if (!row.employer_access_expires_at || row.employer_access_expires_at < nowIso) {
    return noStoreJson({ error: "Expired link." }, { status: 403 });
  }

  const currentDecision = row.employer_decision ?? "pending";
  if (currentDecision !== "pending") {
    return noStoreJson({ error: "Decision already recorded." }, { status: 409 });
  }

  if (parsed.data.action === "reject") {
    const upd = await supabase
      .from("job_applications")
      .update({
        employer_decision: "rejected",
        employer_feedback_reason: parsed.data.reason,
        employer_feedback_details: parsed.data.details,
        feedback_shared_with_candidate: parsed.data.shareWithCandidate,
      })
      .eq("id", applicationId)
      .or("employer_decision.is.null,employer_decision.eq.pending")
      .select("id")
      .maybeSingle();

    if (upd.error || !upd.data) {
      logApiError("/api/employer/applications decision reject", upd.error ?? new Error("no row"), { applicationId });
      return noStoreJson({ error: "Could not save decision." }, { status: 500 });
    }

    try {
      if (parsed.data.shareWithCandidate) {
        await sendCandidateRejectionFeedbackEmail({
          to: row.email,
          jobTitle: row.job_title,
          reason: parsed.data.reason,
          details: parsed.data.details,
        });
      }
    } catch (e) {
      logApiError("/api/employer/applications decision reject mail", e, { applicationId });
    }

    return noStoreJson({ success: true });
  }

  const decision = parsed.data.action === "accept_hire" ? "accepted_hire" : "accepted_interview";
  const upd = await supabase
    .from("job_applications")
    .update({
      employer_decision: decision,
      stage_2_unlocked_at: nowIso,
    })
    .eq("id", applicationId)
    .or("employer_decision.is.null,employer_decision.eq.pending")
    .select("id")
    .maybeSingle();

  if (upd.error || !upd.data) {
    logApiError("/api/employer/applications decision accept", upd.error ?? new Error("no row"), { applicationId });
    return noStoreJson({ error: "Could not save decision." }, { status: 500 });
  }

  try {
    await sendCandidateAcceptedEmail({
      to: row.email,
      jobTitle: row.job_title,
      mode: parsed.data.action === "accept_hire" ? "hire" : "interview",
    });
  } catch (e) {
    logApiError("/api/employer/applications decision accept mail", e, { applicationId });
  }

  return noStoreJson({ success: true });
}
