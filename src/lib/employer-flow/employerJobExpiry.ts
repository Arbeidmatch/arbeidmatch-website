import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { logApiError } from "@/lib/secureLogger";
import {
  sendEmployerJobExpiredEmail,
  sendEmployerJobExpiryReminderEmail,
} from "@/lib/employer-flow/employerJobExpiryEmails";

const MS_DAY = 24 * 60 * 60 * 1000;
const EXTEND_MS = 30 * MS_DAY;

type EmployerJobExpiryRow = {
  id: string;
  title: string;
  slug: string;
  employer_email: string;
  status: string;
  expires_at: string;
  renew_token: string | null;
  notification_sent_7d: boolean;
  notification_sent_3d: boolean;
  notification_sent_1d: boolean;
  notification_sent_expiry: boolean;
};

function daysUntilExpiry(expiresAtIso: string): number {
  return (new Date(expiresAtIso).getTime() - Date.now()) / MS_DAY;
}

export async function renewEmployerJobByToken(jobId: string, renewToken: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, reason: "Server misconfigured." };

  const cur = await supabase
    .from("employer_jobs")
    .select("id, expires_at, renew_token, status")
    .eq("id", jobId)
    .maybeSingle();

  if (cur.error || !cur.data) return { ok: false, reason: "Job not found." };
  const row = cur.data as { id: string; expires_at: string; renew_token: string | null; status: string };
  if (!row.renew_token || row.renew_token !== renewToken) {
    return { ok: false, reason: "Invalid renewal link." };
  }
  if (row.status !== "live" && row.status !== "archived") {
    return { ok: false, reason: "This listing cannot be renewed." };
  }

  const base = Math.max(Date.now(), new Date(row.expires_at).getTime());
  const nextExpires = new Date(base + EXTEND_MS).toISOString();
  const nowIso = new Date().toISOString();

  const upd = await supabase
    .from("employer_jobs")
    .update({
      expires_at: nextExpires,
      status: "live",
      notification_sent_7d: false,
      notification_sent_3d: false,
      notification_sent_1d: false,
      notification_sent_expiry: false,
      updated_at: nowIso,
    })
    .eq("id", jobId)
    .select("id")
    .maybeSingle();

  if (upd.error || !upd.data) {
    logApiError("renewEmployerJobByToken", upd.error ?? new Error("update failed"), { jobId });
    return { ok: false, reason: "Renewal failed." };
  }

  return { ok: true };
}

export async function runEmployerJobExpirySweep(): Promise<{
  archived: number;
  emails: { d7: number; d3: number; d1: number; expired: number };
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { archived: 0, emails: { d7: 0, d3: 0, d1: 0, expired: 0 } };

  const res = await supabase
    .from("employer_jobs")
    .select(
      "id, title, slug, employer_email, status, expires_at, renew_token, notification_sent_7d, notification_sent_3d, notification_sent_1d, notification_sent_expiry",
    )
    .eq("status", "live");

  if (res.error || !res.data) {
    logApiError("runEmployerJobExpirySweep select", res.error ?? new Error("no data"), {});
    return { archived: 0, emails: { d7: 0, d3: 0, d1: 0, expired: 0 } };
  }

  const rows = res.data as EmployerJobExpiryRow[];
  const emails = { d7: 0, d3: 0, d1: 0, expired: 0 };
  let archived = 0;

  for (const row of rows) {
    let renewToken = row.renew_token;
    if (!renewToken) {
      renewToken = randomUUID();
      await supabase.from("employer_jobs").update({ renew_token: renewToken }).eq("id", row.id);
    }

    const days = daysUntilExpiry(row.expires_at);

    if (days <= 0) {
      if (!row.notification_sent_expiry) {
        try {
          await sendEmployerJobExpiredEmail({
            to: row.employer_email,
            jobId: row.id,
            title: row.title,
            renewToken,
          });
        } catch (e) {
          logApiError("runEmployerJobExpirySweep email expired", e, { jobId: row.id });
        }
        emails.expired += 1;
      }

      const nowIso = new Date().toISOString();
      const arch = await supabase
        .from("employer_jobs")
        .update({
          status: "archived",
          notification_sent_expiry: true,
          updated_at: nowIso,
        })
        .eq("id", row.id)
        .eq("status", "live");

      if (!arch.error) archived += 1;
      continue;
    }

    if (days <= 1 && days > 0 && !row.notification_sent_1d) {
      try {
        await sendEmployerJobExpiryReminderEmail({
          to: row.employer_email,
          jobId: row.id,
          title: row.title,
          renewToken,
          variant: "1d",
        });
      } catch (e) {
        logApiError("runEmployerJobExpirySweep email 1d", e, { jobId: row.id });
      }
      await supabase.from("employer_jobs").update({ notification_sent_1d: true }).eq("id", row.id);
      emails.d1 += 1;
    } else if (days <= 3 && days > 1 && !row.notification_sent_3d) {
      try {
        await sendEmployerJobExpiryReminderEmail({
          to: row.employer_email,
          jobId: row.id,
          title: row.title,
          renewToken,
          variant: "3d",
        });
      } catch (e) {
        logApiError("runEmployerJobExpirySweep email 3d", e, { jobId: row.id });
      }
      await supabase.from("employer_jobs").update({ notification_sent_3d: true }).eq("id", row.id);
      emails.d3 += 1;
    } else if (days <= 7 && days > 3 && !row.notification_sent_7d) {
      try {
        await sendEmployerJobExpiryReminderEmail({
          to: row.employer_email,
          jobId: row.id,
          title: row.title,
          renewToken,
          variant: "7d",
        });
      } catch (e) {
        logApiError("runEmployerJobExpirySweep email 7d", e, { jobId: row.id });
      }
      await supabase.from("employer_jobs").update({ notification_sent_7d: true }).eq("id", row.id);
      emails.d7 += 1;
    }
  }

  return { archived, emails };
}
