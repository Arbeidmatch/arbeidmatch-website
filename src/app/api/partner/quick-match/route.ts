import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { notifyError } from "@/lib/errorNotifier";
import { computeCompatibilityScore, initials, makeCandidateHash, skillsPreview, validatePartnerSessionOrToken } from "@/lib/partnerSearch";
import {
  alertIdFromCategory,
  campaignUpsellMessage,
  delayMsForTier,
  getAlertSlotState,
  MAX_ALERT_SLOTS,
  resolvePartnerTier,
} from "@/lib/partnerMonetization";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  session_token: z.string().trim().min(1),
  job_category: z.string().trim().optional().default("Construction & Civil"),
  experience_min: z.number().min(0).max(50).default(0),
  driving_license_required: z.boolean().optional().default(false),
  languages: z.array(z.string().trim()).optional().default(["english"]),
});

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
    const delayMs = delayMsForTier(tier);
    const unlockCutoff = new Date(Date.now() - delayMs);
    const alertId = alertIdFromCategory(parsed.data.job_category);
    const slotState = await getAlertSlotState(supabase, alertId, auth.email ?? "");
    const priorityBypass = tier === "growth_scale";

    const candidateRes = await supabase
      .from("candidates")
      .select("id,first_name,last_name,job_type_pref,experience_years,english_level,has_permit,profile_score,certifications,experiences,available,deleted_at,gdpr_consent,created_at")
      .gte("profile_score", 60)
      .eq("available", true)
      .is("deleted_at", null)
      .eq("gdpr_consent", true)
      .order("profile_score", { ascending: false })
      .limit(1000);
    if (candidateRes.error) {
      return NextResponse.json({ error: "Could not compute matches." }, { status: 500 });
    }

    const matches = (candidateRes.data ?? [])
      .filter((candidate) => {
        if (!candidate.created_at) return false;
        const createdAt = new Date(candidate.created_at);
        return createdAt.getTime() <= unlockCutoff.getTime();
      })
      .map((candidate) => {
        const compatibilityScore = computeCompatibilityScore({
          candidate,
          jobCategory: parsed.data.job_category,
          experienceMin: parsed.data.experience_min,
          drivingLicenseRequired: parsed.data.driving_license_required,
          languages: parsed.data.languages,
        });
        const candidate_hash = makeCandidateHash(auth.sessionToken, candidate.id);
        return {
          candidate_hash,
          initials: initials(candidate.first_name, candidate.last_name),
          category: candidate.job_type_pref || "General",
          experience_years: Number(candidate.experience_years ?? 0),
          compatibility_score: compatibilityScore,
          skills_preview: skillsPreview(candidate),
        };
      })
      .filter((row) => row.compatibility_score >= 80)
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 10);

    await supabase.from("partner_searches").insert({
      session_token: auth.sessionToken,
      search_type: "quick_match",
      criteria: {
        job_category: parsed.data.job_category,
        experience_min: parsed.data.experience_min,
        driving_license_required: parsed.data.driving_license_required,
        languages: parsed.data.languages,
      },
      results_count: matches.length,
    });

    if (matches.length > 0) {
      await supabase.from("candidate_presentations").insert(
        matches.map((row) => ({
          partner_session_token: auth.sessionToken,
          candidate_hash: row.candidate_hash,
          job_category: parsed.data.job_category,
          compatibility_score: row.compatibility_score,
          requested_full_profile: false,
        })),
      );
    }

    const fullMessage = slotState.isFull && !priorityBypass ? "This alert is full. Upgrade to Growth for priority access." : null;

    return NextResponse.json({
      candidates: matches,
      monetization: {
        tier,
        delay_hours: Math.round(delayMs / (60 * 60 * 1000)),
        unlocks_after: unlockCutoff.toISOString(),
        alert_id: alertId,
        slots_used: slotState.slotsUsed,
        slots_max: MAX_ALERT_SLOTS,
        alert_full: slotState.isFull && !priorityBypass,
        full_message: fullMessage,
        campaign_message: campaignUpsellMessage(),
      },
    });
  } catch (error) {
    await notifyError({ route: "/api/partner/quick-match", error });
    return NextResponse.json({ error: "Could not compute matches." }, { status: 500 });
  }
}
