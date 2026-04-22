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

export async function renewEmployerJobByToken(
  jobId: string,
  renewToken: string,
): Promise<{ ok: true; expiresAt: string; renewToken: string } | { ok: false; reason: string }> {
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
  const nextRenewToken = randomUUID();

  const upd = await supabase
    .from("employer_jobs")
    .update({
      expires_at: nextExpires,
      status: "live",
      renew_token: nextRenewToken,
      notification_sent_7d: false,
      notification_sent_3d: false,
      notification_sent_1d: false,
      notification_sent_expiry: false,
      updated_at: nowIso,
    })
    .eq("id", jobId)
    .select("id, expires_at, renew_token")
    .maybeSingle();

  if (upd.error || !upd.data) {
    logApiError("renewEmployerJobByToken", upd.error ?? new Error("update failed"), { jobId });
    return { ok: false, reason: "Renewal failed." };
  }

  const out = upd.data as { id: string; expires_at: string; renew_token: string };
  return { ok: true, expiresAt: out.expires_at, renewToken: out.renew_token };
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

    const expiresMs = new Date(row.expires_at).getTime();
    const nowMs = Date.now();
    const days = (expiresMs - nowMs) / MS_DAY;

    // Past due: final email (once) + archive. Listing leaves the board.
    if (expiresMs <= nowMs) {
      if (!row.notification_sent_expiry) {
        const mailed = await sendEmployerJobExpiredEmail({
          to: row.employer_email,
          jobId: row.id,
          title: row.title,
          renewToken,
        });
        if (mailed) emails.expired += 1;
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

    // Live jobs with expires_at still in the future: staged reminders (7d / 3d / 1d).
    if (days <= 1 && days > 0 && !row.notification_sent_1d) {
      const mailed = await sendEmployerJobExpiryReminderEmail({
        to: row.employer_email,
        jobId: row.id,
        title: row.title,
        renewToken,
        variant: "1d",
      });
      if (mailed) {
        await supabase.from("employer_jobs").update({ notification_sent_1d: true }).eq("id", row.id);
        emails.d1 += 1;
      }
    } else if (days <= 3 && days > 1 && !row.notification_sent_3d) {
      const mailed = await sendEmployerJobExpiryReminderEmail({
        to: row.employer_email,
        jobId: row.id,
        title: row.title,
        renewToken,
        variant: "3d",
      });
      if (mailed) {
        await supabase.from("employer_jobs").update({ notification_sent_3d: true }).eq("id", row.id);
        emails.d3 += 1;
      }
    } else if (days <= 7 && days > 3 && !row.notification_sent_7d) {
      const mailed = await sendEmployerJobExpiryReminderEmail({
        to: row.employer_email,
        jobId: row.id,
        title: row.title,
        renewToken,
        variant: "7d",
      });
      if (mailed) {
        await supabase.from("employer_jobs").update({ notification_sent_7d: true }).eq("id", row.id);
        emails.d7 += 1;
      }
    }
  }

  return { archived, emails };
}
