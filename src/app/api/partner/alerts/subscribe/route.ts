import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { notifyError } from "@/lib/errorNotifier";
import { resolvePartnerTier } from "@/lib/partnerMonetization";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  partner_email: z.string().trim().email(),
  job_category: z.string().trim().min(2).max(120),
  frequency: z.enum(["instant", "daily", "weekly"]).optional().default("instant"),
  min_candidates: z.number().int().min(1).max(20).optional().default(3),
  accept_paid_alert: z.boolean().optional().default(false),
});

const FREE_ACTIVE_ALERT_LIMIT = 2;
const PAY_PER_ALERT_MONTHLY_NOK = 50;

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const payload = parsed.data;
    const partnerEmail = payload.partner_email.toLowerCase();
    const tier = await resolvePartnerTier(supabase, partnerEmail);

    const { count: activeAlertsCount } = await supabase
      .from("role_alerts")
      .select("id", { count: "exact", head: true })
      .eq("partner_email", partnerEmail)
      .eq("alert_status", "active");

    const activeCount = Number(activeAlertsCount ?? 0);
    const exceedsFreeLimit = tier !== "growth_scale" && activeCount >= FREE_ACTIVE_ALERT_LIMIT;

    if (exceedsFreeLimit && !payload.accept_paid_alert) {
      return NextResponse.json(
        {
          success: false,
          pricing_required: true,
          message: "Free plan includes up to 2 active alerts. Confirm pay-per-alert to continue.",
          pay_per_alert_monthly_nok: PAY_PER_ALERT_MONTHLY_NOK,
          active_alerts: activeCount,
          included_free_alerts: FREE_ACTIVE_ALERT_LIMIT,
        },
        { status: 402 },
      );
    }

    const upsert = await supabase
      .from("role_alerts")
      .upsert(
        {
          partner_email: partnerEmail,
          job_category: payload.job_category,
          alert_status: "active",
          notification_frequency: payload.frequency,
          min_candidates: payload.min_candidates,
        },
        { onConflict: "partner_email,job_category" },
      )
      .select("id")
      .maybeSingle();

    if (upsert.error || !upsert.data?.id) {
      return NextResponse.json({ error: upsert.error?.message || "Could not create role alert." }, { status: 500 });
    }

    if (exceedsFreeLimit && payload.accept_paid_alert) {
      await logAuditEvent("partner_pay_per_alert_opt_in", "partner", null, "system", {
        partner_email: partnerEmail,
        job_category: payload.job_category,
        monthly_price_nok: PAY_PER_ALERT_MONTHLY_NOK,
      });
    }

    return NextResponse.json({
      success: true,
      subscription_id: upsert.data.id,
      pricing: {
        tier,
        free_active_alert_limit: FREE_ACTIVE_ALERT_LIMIT,
        pay_per_alert_monthly_nok: PAY_PER_ALERT_MONTHLY_NOK,
        active_alerts: activeCount + 1,
        billing_mode: tier === "growth_scale" ? "included_growth_scale" : exceedsFreeLimit ? "pay_per_alert" : "free",
      },
    });
  } catch (error) {
    await notifyError({ route: "/api/partner/alerts/subscribe", error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected subscribe error." },
      { status: 500 },
    );
  }
}
