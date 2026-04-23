import { NextRequest, NextResponse } from "next/server";
import { buildEmail } from "@/lib/emailTemplate";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { campaignUpsellMessage } from "@/lib/partnerMonetization";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseServiceClient();
    const transporter = createSmtpTransporter();
    if (!supabase || !transporter) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const sinceIso = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString();
    const logsRes = await supabase
      .from("master_audit_log")
      .select("metadata")
      .eq("event_type", "partner_alert_slot_claimed")
      .gte("created_at", sinceIso);
    const logs = (logsRes.data ?? []) as Array<{ metadata?: { partner_email?: string } | null }>;
    const emails = Array.from(
      new Set(
        logs
          .map((log) => (log.metadata?.partner_email || "").trim().toLowerCase())
          .filter((email) => email.includes("@")),
      ),
    );

    let sent = 0;
    for (const email of emails) {
      const campaignMessage = campaignUpsellMessage();
      const isLimitedOffer = campaignMessage.toLowerCase().includes("limited time");
      const html = buildEmail({
        title: "Your free alerts expire in 5 days",
        preheader: "Upgrade now for unlimited instant alerts.",
        body: `
          <p style="margin:0 0 12px 0;color:rgba(255,255,255,0.85);font-size:14px;line-height:1.7;">
            ${campaignMessage}
          </p>
          <p style="margin:0;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.7;">
            ${
              isLimitedOffer
                ? "Your free alerts expire in 5 days. Upgrade to Growth for unlimited instant alerts and priority access."
                : "Your current free alert limit is ending soon. Upgrade to Growth for unlimited instant alerts and priority access."
            }
          </p>
        `,
        ctaText: "Upgrade to Growth",
        ctaUrl: "https://arbeidmatch.no/pricing",
        audience: "b2b",
        unsubscribeEmail: email,
      });
      await safeSendEmail(email, "Your free alerts expire in 5 days", html, {
        ...mailHeaders(),
        text: "Your free alerts expire in 5 days. Upgrade to Growth for unlimited.",
        transporter,
      });
      sent += 1;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    await notifyError({ route: "/api/cron/partner-alert-expiry", error });
    return NextResponse.json({ success: false, error: "Failed to send partner alert expiry emails." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
