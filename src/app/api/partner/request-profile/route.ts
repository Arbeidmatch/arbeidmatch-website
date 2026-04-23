import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { buildInternalEmailHtml, mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { validatePartnerSessionOrToken } from "@/lib/partnerSearch";
import { alertIdFromCategory, getAlertSlotState, resolvePartnerTier } from "@/lib/partnerMonetization";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  session_token: z.string().trim().min(1),
  candidate_hash: z.string().trim().min(1),
  job_category: z.string().trim().optional().default("Unknown"),
});

async function sendSlackNotification(message: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_EMPLOYERS?.trim();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch {
    // do not fail request on Slack issues
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse((await request.json().catch(() => null)) as unknown);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const auth = await validatePartnerSessionOrToken(parsed.data.session_token);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const tier = await resolvePartnerTier(supabase, auth.email ?? "");
    const alertId = alertIdFromCategory(parsed.data.job_category || "general");
    const slotState = await getAlertSlotState(supabase, alertId, auth.email ?? "");
    const priorityBypass = tier === "growth_scale";
    if (slotState.isFull && !priorityBypass) {
      return NextResponse.json(
        { error: "This alert is full. Upgrade to Growth for priority access." },
        { status: 409 },
      );
    }

    const { data: presentation, error: presentationError } = await supabase
      .from("candidate_presentations")
      .select("id,compatibility_score,requested_full_profile")
      .eq("partner_session_token", auth.sessionToken)
      .eq("candidate_hash", parsed.data.candidate_hash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (presentationError || !presentation) {
      return NextResponse.json({ error: "Candidate presentation not found." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("candidate_presentations")
      .update({ requested_full_profile: true, requested_at: nowIso })
      .eq("id", presentation.id);
    if (updateError) {
      return NextResponse.json({ error: "Could not update request." }, { status: 500 });
    }

    const score = Number(presentation.compatibility_score ?? 0);
    const msg =
      `Partner requested full profile: ${parsed.data.job_category}, score ${score}. ` +
      `session=${auth.sessionToken}, company=${auth.company ?? "Unknown"}, email=${auth.email ?? "Unknown"}`;

    await sendSlackNotification(msg);
    await logAuditEvent("partner_alert_slot_claimed", "partner_alert", alertId, "system", {
      alert_id: alertId,
      partner_email: auth.email ?? "unknown",
      tier,
      claimed_at: nowIso,
      job_category: parsed.data.job_category || "Unknown",
    });

    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = buildInternalEmailHtml({
        title: "Partner requested full profile",
        rows: [
          { label: "Category", value: parsed.data.job_category },
          { label: "Compatibility score", value: String(score) },
          { label: "Partner session token", value: auth.sessionToken },
          { label: "Partner company", value: auth.company ?? "Unknown" },
          { label: "Partner email", value: auth.email ?? "Unknown" },
          { label: "Candidate hash", value: parsed.data.candidate_hash },
        ],
      });
      await transporter.sendMail({
        ...mailHeaders(),
        to: "post@arbeidmatch.no",
        subject: "Partner requested full profile",
        text: msg,
        html,
      });
    }

    return NextResponse.json({ success: true, message: "Request received. We'll be in touch shortly." });
  } catch (error) {
    await notifyError({ route: "/api/partner/request-profile", error });
    return NextResponse.json({ error: "Could not process request." }, { status: 500 });
  }
}
