import { NextRequest, NextResponse } from "next/server";

import { safeSendEmail } from "@/lib/email/safeSend";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { notifyCronFailed } from "@/lib/slack/notify";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type RoleAlertRow = {
  id: string;
  partner_email: string;
  job_category: string;
  notification_frequency: "instant" | "daily" | "weekly";
  min_candidates: number | null;
  created_at: string | null;
};

type CandidateRow = {
  id: string;
  first_name: string | null;
  job_type_pref: string | null;
  available: boolean | null;
  profile_score: number | null;
  gdpr_consent: boolean | null;
  can_apply: boolean | null;
  share_with_employers: boolean | null;
  created_at: string | null;
};

function isOsloNineAm(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  return hour === 9;
}

function isOsloMonday(date = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", weekday: "long" }).format(date).toLowerCase();
  return weekday.includes("monday");
}

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}

function candidateMatchesCategory(candidate: CandidateRow, category: string): boolean {
  const pref = normalizeCategory(candidate.job_type_pref || "");
  const target = normalizeCategory(category);
  return pref.includes(target) || target.includes(pref);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const force = request.nextUrl.searchParams.get("force") === "1";

  if (!cronSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!force && !isOsloNineAm()) {
    return NextResponse.json({ success: true, skipped: true, reason: "outside_09_00_oslo_window" });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });

    const alertsRes = await supabase
      .from("role_alerts")
      .select("id,partner_email,job_category,notification_frequency,min_candidates,created_at")
      .eq("alert_status", "active");
    if (alertsRes.error) throw alertsRes.error;

    const alerts = (alertsRes.data ?? []) as RoleAlertRow[];
    const weeklyAllowed = isOsloMonday();
    const activeAlerts = alerts.filter((alert) => {
      if (alert.notification_frequency === "weekly") return weeklyAllowed;
      return true;
    });

    if (activeAlerts.length === 0) {
      return NextResponse.json({ success: true, processed: 0, sent: 0, skipped: 0 });
    }

    const candidatesRes = await supabase
      .from("candidates")
      .select("id,first_name,job_type_pref,available,profile_score,gdpr_consent,can_apply,share_with_employers,created_at")
      .eq("available", true)
      .gte("profile_score", 60)
      .eq("gdpr_consent", true)
      .is("deleted_at", null);
    if (candidatesRes.error) throw candidatesRes.error;
    const candidates = (candidatesRes.data ?? []) as CandidateRow[];

    let sent = 0;
    let skipped = 0;

    for (const alert of activeAlerts) {
      const minCandidates = Math.max(1, Number(alert.min_candidates ?? 3));
      const latestNotificationRes = await supabase
        .from("role_alert_notifications")
        .select("sent_at")
        .eq("alert_id", alert.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestNotificationRes.error) throw latestNotificationRes.error;

      const baselineIso = latestNotificationRes.data?.sent_at || alert.created_at || new Date(0).toISOString();
      const baselineTime = new Date(baselineIso).getTime();

      const matchedNewCandidates = candidates.filter((candidate) => {
        if (!candidate.created_at) return false;
        if (!candidateMatchesCategory(candidate, alert.job_category)) return false;
        if (candidate.can_apply === false) return false;
        if (candidate.share_with_employers === false) return false;
        return new Date(candidate.created_at).getTime() > baselineTime;
      });

      if (matchedNewCandidates.length < minCandidates) {
        skipped += 1;
        continue;
      }

      const sampleNames = matchedNewCandidates
        .slice(0, 3)
        .map((candidate) => candidate.first_name?.trim() || "Candidate")
        .join(", ");

      const subject = `Role Alert: ${matchedNewCandidates.length} new ${alert.job_category} profiles`;
      const html = `
        <p>Hello,</p>
        <p>We found <strong>${matchedNewCandidates.length}</strong> new profiles for <strong>${alert.job_category}</strong>.</p>
        <p>Sample candidates: ${sampleNames || "New profiles available"}.</p>
        <p>Open your partner dashboard to review the latest presentations.</p>
      `;
      const text = `Role alert: ${matchedNewCandidates.length} new profiles for ${alert.job_category}.`;

      await safeSendEmail(alert.partner_email, subject, html, {
        ...mailHeaders(),
        text,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      });

      await supabase.from("role_alert_notifications").insert({
        alert_id: alert.id,
        candidates_count: matchedNewCandidates.length,
      });

      sent += 1;
    }

    return NextResponse.json({
      success: true,
      processed: activeAlerts.length,
      sent,
      skipped,
      pricing: {
        free_active_alerts: 2,
        premium_alerts: "included_in_growth_scale",
        pay_per_alert_monthly_nok: 50,
      },
    });
  } catch (error) {
    await notifyError({ route: "/api/cron/alert-check", error });
    await notifyCronFailed("alert-check", error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
import { NextRequest, NextResponse } from "next/server";

import { trackGa4ServerEvent } from "@/lib/analytics/ga4Server";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildRoleAlertNotificationEmail, mailHeaders } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type RoleAlertRow = {
  id: string;
  partner_email: string | null;
  job_category: string | null;
  min_candidates: number | null;
  last_notification: string | null;
  active?: boolean | null;
  status?: string | null;
  alert_status?: string | null;
  notification_frequency?: string | null;
};

function normalizeEmail(value: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeNumber(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
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

    const { data: alertsData, error: alertsError } = await supabase
      .from("role_alerts")
      .select("id,partner_email,job_category,min_candidates,last_notification,active,status,alert_status,notification_frequency")
      .or("active.eq.true,status.eq.active,alert_status.eq.active");
    if (alertsError) throw alertsError;

    const alerts = ((alertsData ?? []) as RoleAlertRow[]).filter((alert) => {
      const partnerEmail = normalizeEmail(alert.partner_email);
      const role = (alert.job_category || "").trim();
      return partnerEmail.length > 0 && role.length > 0;
    });

    const transporter = createSmtpTransporter();
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://arbeidmatch.no";
    let notificationsSent = 0;

    for (const alert of alerts) {
      const partnerEmail = normalizeEmail(alert.partner_email);
      const role = (alert.job_category || "").trim();
      const minCandidates = Math.max(1, normalizeNumber(alert.min_candidates, 1));
      const lastNotification = alert.last_notification || new Date(0).toISOString();

      let newCandidates = 0;
      const countByCategory = await supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .eq("category", role)
        .gt("created_at", lastNotification);
      if (countByCategory.error) {
        const countByJobType = await supabase
          .from("candidates")
          .select("id", { count: "exact", head: true })
          .eq("job_type_pref", role)
          .gt("created_at", lastNotification);
        if (countByJobType.error) {
          throw countByJobType.error;
        }
        newCandidates = countByJobType.count ?? 0;
      } else {
        newCandidates = countByCategory.count ?? 0;
      }
      if (newCandidates < minCandidates) continue;

      const ctaUrl = `${origin}/partner/search?role=${encodeURIComponent(role)}&alert_id=${encodeURIComponent(alert.id)}`;
      const manageUrl = `${origin}/partner/alerts`;
      const subject = `${role} candidates available - ${newCandidates} new matches`;
      const html = buildRoleAlertNotificationEmail({
        role,
        count: newCandidates,
        alertId: alert.id,
        ctaUrl,
        manageUrl,
      });

      if (transporter) {
        await safeSendEmail(partnerEmail, subject, html, {
          ...mailHeaders(),
          text: `Role Alert Notification\n\nWe found ${newCandidates} qualified candidates for ${role}.\nView candidates: ${ctaUrl}\nManage preferences: ${manageUrl}`,
          transporter,
        });
      }

      await supabase.from("role_alert_notifications").insert({
        alert_id: alert.id,
        partner_email: partnerEmail,
        job_category: role,
        candidate_count: newCandidates,
        sent_at: new Date().toISOString(),
      });

      await supabase
        .from("role_alerts")
        .update({ last_notification: new Date().toISOString() })
        .eq("id", alert.id);

      await notifySlack("employers", {
        title: "Role alert triggered",
        fields: {
          Role: role,
          "Partner email": partnerEmail,
          "Candidates count": String(newCandidates),
        },
      });

      await logAuditEvent("role_alert_notification_sent", "partner", alert.id, "system", {
        role,
        partner_email: partnerEmail,
        count: newCandidates,
      });

      await trackGa4ServerEvent("alert_notification_sent", {
        role,
        count: newCandidates,
        alert_id: alert.id,
      });

      notificationsSent += 1;
    }

    return NextResponse.json({
      success: true,
      activeAlerts: alerts.length,
      notificationsSent,
    });
  } catch (error) {
    await notifyError({ route: "/api/cron/alert-check", error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

