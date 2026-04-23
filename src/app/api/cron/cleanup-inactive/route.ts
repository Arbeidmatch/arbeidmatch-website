import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { buildAnonymizedConfirmationEmailHtml, buildInactiveWarningEmailHtml } from "@/lib/candidates/availabilityEmail";
import { signAvailabilityToken } from "@/lib/candidates/availabilityToken";
import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { notifyCronFailed } from "@/lib/slack/notify";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type CandidateCleanupRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  profile_score: number | null;
  created_at: string | null;
  last_login: string | null;
  last_availability_check: string | null;
  availability_checked_at: string | null;
  deleted_at: string | null;
  status: string | null;
};

type AuditRow = {
  entity_id: string | null;
  created_at: string | null;
};

function hashEmail(input: string): string {
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

function isOlderThan(value: string | null, cutoffIso: string): boolean {
  if (!value) return true;
  return new Date(value).getTime() < new Date(cutoffIso).getTime();
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseServiceClient();
    const transporter = createSmtpTransporter();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });

    const now = new Date();
    const cutoff14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const cutoff90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const cutoff7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const { data: candidateRows, error: candidatesError } = await supabase
      .from("candidates")
      .select(
        "id,email,first_name,profile_score,created_at,last_login,last_availability_check,availability_checked_at,deleted_at,status",
      )
      .is("deleted_at", null);
    if (candidatesError) throw candidatesError;
    const candidates = (candidateRows ?? []) as CandidateCleanupRow[];

    const inactiveByNoResponse = candidates.filter((c) => c.last_availability_check && isOlderThan(c.last_availability_check, cutoff14Days));
    for (const candidate of inactiveByNoResponse) {
      await supabase.from("candidates").update({ status: "inactive", updated_at: nowIso }).eq("id", candidate.id);
      await logAuditEvent("candidate_marked_inactive_no_response", "candidate", candidate.id, "system", {
        reason: "last_availability_check_older_than_14_days",
      });
    }

    const { data: warningLogsData, error: warningLogErr } = await supabase
      .from("master_audit_log")
      .select("entity_id,created_at")
      .eq("event_type", "candidate_inactivity_warning_sent")
      .gte("created_at", cutoff90Days);
    if (warningLogErr) throw warningLogErr;
    const warningLogs = (warningLogsData ?? []) as AuditRow[];
    const latestWarningByCandidate = new Map<string, string>();
    for (const row of warningLogs) {
      const cid = row.entity_id?.trim();
      const created = row.created_at?.trim();
      if (!cid || !created) continue;
      const existing = latestWarningByCandidate.get(cid);
      if (!existing || new Date(created).getTime() > new Date(existing).getTime()) latestWarningByCandidate.set(cid, created);
    }

    let warningsSent = 0;
    let anonymized = 0;

    const warningCandidates = candidates.filter((c) => {
      const score = c.profile_score ?? 0;
      if (score >= 30) return false;
      if (!c.created_at || !isOlderThan(c.created_at, cutoff90Days)) return false;
      if (c.last_login && !isOlderThan(c.last_login, cutoff90Days)) return false;
      if ((c.status ?? "active") === "anonymized") return false;
      return true;
    });

    for (const candidate of warningCandidates) {
      const email = candidate.email?.trim().toLowerCase() ?? "";
      if (!email.includes("@")) continue;
      const warnedAt = latestWarningByCandidate.get(candidate.id);
      if (warnedAt) continue;
      if (!transporter) continue;

      const token = await signAvailabilityToken({ candidateId: candidate.id, email });
      const keepActiveUrl = `${getSiteOrigin()}/api/candidates/availability?token=${encodeURIComponent(token)}&status=available`;
      await safeSendEmail(
        email,
        "Profile inactivity warning",
        buildInactiveWarningEmailHtml({ firstName: candidate.first_name?.trim() || "there", keepActiveUrl }),
        {
          ...mailHeaders(),
          text:
            "Your profile will be removed in 7 days due to inactivity.\n" +
            "Keep profile active: " +
            keepActiveUrl,
          transporter,
        },
      );
      warningsSent += 1;
      await logAuditEvent("candidate_inactivity_warning_sent", "candidate", candidate.id, "system", {
        email,
        keep_active_url: keepActiveUrl,
      });
    }

    const anonymizeCandidates = candidates.filter((candidate) => {
      const warnedAt = latestWarningByCandidate.get(candidate.id);
      if (!warnedAt) return false;
      if (!isOlderThan(warnedAt, cutoff7Days)) return false;
      if (candidate.availability_checked_at && new Date(candidate.availability_checked_at).getTime() > new Date(warnedAt).getTime()) {
        return false;
      }
      return true;
    });

    for (const candidate of anonymizeCandidates) {
      const rawEmail = candidate.email?.trim().toLowerCase() ?? "";
      if (transporter && rawEmail.includes("@")) {
        await safeSendEmail(
          rawEmail,
          "Profile anonymized confirmation",
          buildAnonymizedConfirmationEmailHtml({ firstName: candidate.first_name?.trim() || "there" }),
          {
            ...mailHeaders(),
            text:
              "Your data has been anonymized per your request or due to inactivity.\n" +
              "Contact post@arbeidmatch.no for data requests.",
            transporter,
          },
        );
      }

      const hashedEmail = rawEmail ? `deleted+${hashEmail(rawEmail)}@anonymized.local` : `deleted+${candidate.id}@anonymized.local`;
      const { error: anonymizeErr } = await supabase
        .from("candidates")
        .update({
          first_name: "Deleted",
          last_name: "User",
          email: hashedEmail,
          phone: null,
          city: null,
          current_country: null,
          profile_draft: {},
          experiences: [],
          job_preferences: {},
          profile_photo_url: null,
          video_link: null,
          available: false,
          status: "anonymized",
          deleted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", candidate.id);
      if (anonymizeErr) throw anonymizeErr;

      anonymized += 1;
      await logAuditEvent("candidate_anonymized_inactivity", "candidate", candidate.id, "system", {
        email_hash: hashEmail(rawEmail || candidate.id),
      });
    }

    await logAuditEvent("candidate_cleanup_cron_run", "candidate", null, "system", {
      inactive_marked: inactiveByNoResponse.length,
      warnings_sent: warningsSent,
      anonymized,
    });

    return NextResponse.json({
      success: true,
      inactiveMarked: inactiveByNoResponse.length,
      warningsSent,
      anonymized,
    });
  } catch (error) {
    await notifyError({ route: "/api/cron/cleanup-inactive", error });
    await notifyCronFailed(
      "cleanup-inactive",
      error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error),
    );
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
