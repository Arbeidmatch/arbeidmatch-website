import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type CandidateReminderRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_score: number | null;
  created_at: string | null;
  reminder_sent: string | null;
  reminder_count: number | null;
  phone: string | null;
  current_country: string | null;
  city: string | null;
  job_type_pref: string | null;
  experience_years: number | null;
  cv_uploaded: boolean | null;
};

function getMissingProfileItems(candidate: CandidateReminderRow): string[] {
  const missing: string[] = [];
  if (!candidate.first_name?.trim()) missing.push("First name");
  if (!candidate.last_name?.trim()) missing.push("Last name");
  if (!candidate.phone?.trim()) missing.push("Phone number");
  if (!candidate.current_country?.trim()) missing.push("Current country");
  if (!candidate.city?.trim()) missing.push("City");
  if (!candidate.job_type_pref?.trim()) missing.push("Preferred category");
  if ((candidate.experience_years ?? 0) <= 0) missing.push("Experience details");
  if (candidate.cv_uploaded !== true) missing.push("CV upload");
  return missing;
}

function scorePercent(value: number | null): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function progressBarTable(score: number): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">
      <tr>
        <td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;">
            <tr>
              <td width="${score}%" style="height:12px;background:#C9A84C;font-size:0;line-height:0;">&nbsp;</td>
              <td style="height:12px;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function missingItemsList(items: string[]): string {
  if (items.length === 0) {
    return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#ffffff;">Your profile is close to complete. Add a few final details to improve your match quality.</p>`;
  }
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border-collapse:collapse;">
      ${items
        .map(
          (item) => `
        <tr>
          <td style="padding:7px 0;border-top:1px solid rgba(255,255,255,0.08);font-size:14px;color:#ffffff;">• ${escapeHtml(item)}</td>
        </tr>`,
        )
        .join("")}
    </table>
  `;
}

function buildReminderEmail(candidate: CandidateReminderRow, subject: string, secondReminder: boolean): string {
  const firstName = candidate.first_name?.trim() || "there";
  const score = scorePercent(candidate.profile_score);
  const missing = getMissingProfileItems(candidate);
  const completeProfileUrl = `${getSiteOrigin()}/candidates`;
  const intro = secondReminder
    ? "Your profile is still incomplete. Complete it today so we can match you with relevant opportunities faster."
    : "Your profile is almost ready. Complete the remaining details so employers can review your profile.";

  return buildEmail({
    title: subject,
    preheader: secondReminder ? "Complete your profile to avoid missing opportunities." : "Complete your profile in a few minutes.",
    body: `
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#ffffff;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#ffffff;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Current progress</p>
      ${progressBarTable(score)}
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#ffffff;"><strong>${score}% complete</strong></p>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Missing profile details</p>
      ${missingItemsList(missing)}
    `,
    ctaText: "Complete Profile",
    ctaUrl: completeProfileUrl,
  });
}

async function sendReminderBatch(
  candidates: CandidateReminderRow[],
  subject: string,
  secondReminder: boolean,
): Promise<{ sent: number; failed: number; updated: number }> {
  const transporter = createSmtpTransporter();
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!transporter) throw new Error("SMTP not configured.");

  let sent = 0;
  let failed = 0;
  let updated = 0;
  const nowIso = new Date().toISOString();

  for (const candidate of candidates) {
    const to = candidate.email?.trim().toLowerCase() || "";
    if (!to.includes("@")) continue;

    try {
      const html = buildReminderEmail(candidate, subject, secondReminder);
      await transporter.sendMail({
        ...mailHeaders(),
        to,
        subject,
        html,
        text: `${subject}\n\nComplete your profile: ${getSiteOrigin()}/candidates`,
      });
      sent += 1;

      const nextReminderCount = Math.min(2, (candidate.reminder_count ?? 0) + 1);
      const { error: updateError } = await supabase
        .from("candidates")
        .update({ reminder_sent: nowIso, reminder_count: nextReminderCount, updated_at: nowIso })
        .eq("id", candidate.id);
      if (updateError) throw updateError;
      updated += 1;

      await logAuditEvent("candidate_profile_reminder_sent", "candidate", candidate.id, "system", {
        email: to,
        reminder_number: nextReminderCount,
        profile_score: candidate.profile_score ?? 0,
        subject,
      });
    } catch {
      failed += 1;
    }
  }

  return { sent, failed, updated };
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
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

    const commonSelect =
      "id,email,first_name,last_name,profile_score,created_at,reminder_sent,reminder_count,phone,current_country,city,job_type_pref,experience_years,cv_uploaded";

    const { data: firstReminderRows, error: firstError } = await supabase
      .from("candidates")
      .select(commonSelect)
      .lt("profile_score", 60)
      .gte("created_at", sevenDaysAgo)
      .is("reminder_sent", null);
    if (firstError) throw firstError;

    const { data: secondReminderRows, error: secondError } = await supabase
      .from("candidates")
      .select(commonSelect)
      .lt("profile_score", 60)
      .not("reminder_sent", "is", null)
      .lt("reminder_sent", threeDaysAgo)
      .or("reminder_count.is.null,reminder_count.lt.2");
    if (secondError) throw secondError;

    const firstBatch = await sendReminderBatch(
      (firstReminderRows ?? []) as CandidateReminderRow[],
      "Your ArbeidMatch profile is almost ready",
      false,
    );
    const secondBatch = await sendReminderBatch(
      (secondReminderRows ?? []) as CandidateReminderRow[],
      "Don't miss out — complete your profile today",
      true,
    );

    await logAuditEvent("candidate_profile_reminder_cron_run", "candidate", null, "system", {
      first_batch_candidates: (firstReminderRows ?? []).length,
      second_batch_candidates: (secondReminderRows ?? []).length,
      first_batch_sent: firstBatch.sent,
      second_batch_sent: secondBatch.sent,
      first_batch_failed: firstBatch.failed,
      second_batch_failed: secondBatch.failed,
    });

    return NextResponse.json({
      success: true,
      firstReminder: { selected: (firstReminderRows ?? []).length, ...firstBatch },
      secondReminder: { selected: (secondReminderRows ?? []).length, ...secondBatch },
    });
  } catch (error) {
    await notifyError({ route: "/api/cron/profile-reminder", error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
