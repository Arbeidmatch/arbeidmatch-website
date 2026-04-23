import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { notifyCronFailed } from "@/lib/slack/notify";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { resolveWorkTypeFromCategoryString } from "@/lib/candidates/profileSchema";

export const dynamic = "force-dynamic";

type EmployerRequestRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  category: string | null;
  experience: number | null;
  driver_license: string | null;
  created_at: string | null;
};

type CandidateRow = {
  id: string;
  first_name: string | null;
  job_type_pref: string | null;
  experience_years: number | null;
  has_permit: boolean | null;
  can_apply: boolean | null;
  share_with_employers: boolean | null;
  created_at: string | null;
};

type AuditLogRow = {
  entity_id: string | null;
  metadata: { candidate_ids?: unknown } | null;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function needsDrivingLicense(value: string | null): boolean {
  return asString(value).length > 0;
}

function normalizeEmail(value: string | null): string {
  return asString(value).toLowerCase();
}

function getCandidateIdsFromMetadata(metadata: AuditLogRow["metadata"]): string[] {
  const ids = metadata?.candidate_ids;
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => asString(id)).filter(Boolean);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const now = new Date();
    const cutoff30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const cutoff24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: employerRequests, error: employerErr }, { data: freshCandidates, error: candidateErr }, { data: priorLogs, error: auditErr }] =
      await Promise.all([
        supabase
          .from("employer_requests")
          .select("id,email,full_name,category,experience,driver_license,created_at")
          .gte("created_at", cutoff30Days),
        supabase
          .from("candidates")
          .select("id,first_name,job_type_pref,experience_years,has_permit,can_apply,share_with_employers,created_at")
          .gte("created_at", cutoff24Hours),
        supabase
          .from("master_audit_log")
          .select("entity_id,metadata")
          .eq("event_type", "employer_match_notify_sent")
          .gte("created_at", cutoff30Days),
      ]);

    if (employerErr) throw employerErr;
    if (candidateErr) throw candidateErr;
    if (auditErr) throw auditErr;

    const requests = ((employerRequests ?? []) as EmployerRequestRow[]).filter((req) => normalizeEmail(req.email));
    const candidates = ((freshCandidates ?? []) as CandidateRow[]).filter((cand) => {
      // honor candidate sharing/apply settings when available
      if (cand.can_apply === false) return false;
      if (cand.share_with_employers === false) return false;
      return true;
    });

    const alreadyNotifiedByRequest = new Map<string, Set<string>>();
    for (const log of (priorLogs ?? []) as AuditLogRow[]) {
      const requestId = asString(log.entity_id);
      if (!requestId) continue;
      const ids = getCandidateIdsFromMetadata(log.metadata);
      if (!alreadyNotifiedByRequest.has(requestId)) alreadyNotifiedByRequest.set(requestId, new Set<string>());
      const bucket = alreadyNotifiedByRequest.get(requestId)!;
      ids.forEach((id) => bucket.add(id));
    }

    const transporter = createSmtpTransporter();
    let processedRequests = 0;
    let notificationsSent = 0;

    for (const req of requests) {
      processedRequests += 1;
      const employerEmail = normalizeEmail(req.email);
      const requiredCategory = resolveWorkTypeFromCategoryString(asString(req.category));
      if (!requiredCategory) continue;

      const minExperience = asNumber(req.experience) ?? 0;
      const requireLicense = needsDrivingLicense(req.driver_license);
      const previouslyNotified = alreadyNotifiedByRequest.get(req.id) ?? new Set<string>();

      const matched = candidates.filter((cand) => {
        const candidateCategory = resolveWorkTypeFromCategoryString(asString(cand.job_type_pref));
        if (candidateCategory !== requiredCategory) return false;

        const candidateExperience = asNumber(cand.experience_years) ?? 0;
        if (candidateExperience < minExperience) return false;

        if (requireLicense && cand.has_permit !== true) return false;
        if (previouslyNotified.has(cand.id)) return false;

        return true;
      });

      if (matched.length === 0) continue;

      if (transporter) {
        const ctaUrl = "https://arbeidmatch.no/contact";
        const html = buildEmail({
          title: "New candidates available for your request",
          preheader: "Fresh matched candidate profiles are available.",
          body: `
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
              We found <strong>${matched.length}</strong> new candidate${matched.length === 1 ? "" : "s"} matching your request for <strong>${requiredCategory}</strong>.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.7);">
              Contact us to review and receive candidate details.
            </p>
          `,
          ctaText: "View Candidates",
          ctaUrl,
        });

        await safeSendEmail(employerEmail, "New candidates available for your request", html, {
          ...mailHeaders(),
          text: `New candidates available for your request.\n\nWe found ${matched.length} new matched candidate(s) for ${requiredCategory}.\n\nView candidates: ${ctaUrl}`,
          transporter,
        });
      }

      notificationsSent += 1;
      const candidateIds = matched.map((cand) => cand.id);
      await logAuditEvent("employer_match_notify_sent", "employer_request", req.id, "system", {
        employer_email: employerEmail,
        job_category: requiredCategory,
        candidates_count: matched.length,
        candidate_ids: candidateIds,
        sent_at: now.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      processedRequests,
      freshCandidates: candidates.length,
      notificationsSent,
    });
  } catch (error) {
    await notifyError({ route: "/api/cron/match-notify", error });
    await notifyCronFailed("match-notify", error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

