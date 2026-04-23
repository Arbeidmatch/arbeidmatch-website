import { NextRequest, NextResponse } from "next/server";

import { trackGa4ServerEvent } from "@/lib/analytics/ga4Server";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildRoleAlertNotificationEmail, mailHeaders } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { notifyCronFailed } from "@/lib/slack/notify";
import { notifySlack } from "@/lib/slackNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RoleAlertRow = {
  id: string;
  partner_email: string | null;
  job_category: string | null;
  notification_frequency: "instant" | "daily" | "weekly";
  min_candidates: number | null;
  last_notification: string | null;
  created_at: string | null;
};

function normalizeEmail(value: string | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeNumber(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function isOsloMonday(date = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", weekday: "long" }).format(date).toLowerCase();
  return weekday.includes("monday");
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

    const alertsRes = await supabase
      .from("role_alerts")
      .select("id,partner_email,job_category,notification_frequency,min_candidates,last_notification,created_at")
      .eq("alert_status", "active");
    if (alertsRes.error) throw alertsRes.error;

    const weeklyAllowed = isOsloMonday();
    const alerts = ((alertsRes.data ?? []) as RoleAlertRow[]).filter((alert) => {
      if (alert.notification_frequency === "weekly" && !weeklyAllowed) return false;
      const role = (alert.job_category || "").trim();
      return normalizeEmail(alert.partner_email).length > 0 && role.length > 0;
    });

    const transporter = createSmtpTransporter();
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://arbeidmatch.no";
    let sent = 0;

    for (const alert of alerts) {
      const partnerEmail = normalizeEmail(alert.partner_email);
      const role = (alert.job_category || "").trim();
      const minCandidates = Math.max(1, normalizeNumber(alert.min_candidates, 1));
      const baselineIso = alert.last_notification || alert.created_at || new Date(0).toISOString();

      const countRes = await supabase
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .eq("job_type_pref", role)
        .gt("created_at", baselineIso);
      if (countRes.error) throw countRes.error;

      const newCandidates = countRes.count ?? 0;
      if (newCandidates < minCandidates) continue;

      const ctaUrl = `${origin}/partner/search?role=${encodeURIComponent(role)}&alert_id=${encodeURIComponent(alert.id)}`;
      const manageUrl = `${origin}/partner/alerts`;
      const subject = `${role} candidates available - ${newCandidates} new matches`;

      if (transporter) {
        const html = buildRoleAlertNotificationEmail({
          role,
          count: newCandidates,
          alertId: alert.id,
          ctaUrl,
          manageUrl,
        });
        await safeSendEmail(partnerEmail, subject, html, {
          ...mailHeaders(),
          text: `Role Alert Notification\n\nWe found ${newCandidates} qualified candidates for ${role}.\nView candidates: ${ctaUrl}\nManage preferences: ${manageUrl}`,
          transporter,
          ipAddress: request.headers.get("x-forwarded-for") || undefined,
        });
      }

      await supabase.from("role_alert_notifications").insert({
        alert_id: alert.id,
        candidates_count: newCandidates,
      });

      await supabase.from("role_alerts").update({ last_notification: new Date().toISOString() }).eq("id", alert.id);

      await notifySlack("employers", {
        title: "Alert triggered",
        fields: {
          Role: role,
          "Partner email": partnerEmail,
          Count: String(newCandidates),
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

      sent += 1;
    }

    return NextResponse.json({ success: true, processed: alerts.length, sent });
  } catch (error) {
    await notifyError({ route: "/api/cron/alert-check", error });
    await notifyCronFailed("alert-check", error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

