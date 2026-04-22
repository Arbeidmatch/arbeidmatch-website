import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { candidateProfilePayloadSchema } from "@/lib/candidates/profileSchema";
import { getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { notifyError } from "@/lib/errorNotifier";
import { isRateLimited } from "@/lib/requestProtection";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { logApiError } from "@/lib/secureLogger";

function experienceYearsFromBand(band: z.infer<typeof candidateProfilePayloadSchema>["preferences"]["experienceBand"]): number {
  switch (band) {
    case "0_2":
      return 1;
    case "2_5":
      return 3.5;
    case "5_10":
      return 7;
    case "10_plus":
      return 12;
    default:
      return 3.5;
  }
}

function salaryMinFromHourly(hourly: z.infer<typeof candidateProfilePayloadSchema>["preferences"]["salaryHourly"]): number {
  const hoursPerYear = 37.5 * 52;
  switch (hourly) {
    case "400_500":
      return Math.round(450 * hoursPerYear);
    case "500_600":
      return Math.round(550 * hoursPerYear);
    case "600_plus":
      return Math.round(650 * hoursPerYear);
    default:
      return Math.round(550 * hoursPerYear);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile", 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const json = (await request.json()) as unknown;
    const parsed = candidateProfilePayloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const data = parsed.data;
    const experienceYears = experienceYearsFromBand(data.preferences.experienceBand);
    const salaryMin = salaryMinFromHourly(data.preferences.salaryHourly);

    const row = {
      email: data.email.toLowerCase(),
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      current_country: data.currentCountry,
      city: data.city,
      gdpr_entry_accepted: data.gdprEntryAccepted,
      privacy_policy_version: data.privacyPolicyVersion ?? "2026-04-22",
      video_link: data.videoUrl,
      experiences: data.experiences,
      job_preferences: data.preferences,
      experience_years: experienceYears,
      salary_min: salaryMin,
      hours_pref: data.preferences.hoursPerWeek,
      rotation_pref: data.preferences.rotation,
      housing_pref: data.preferences.housing,
      travel_pref: data.preferences.travel,
      job_type_pref: data.preferences.jobType,
      has_permit: data.preferences.hasPermit,
      permit_categories: data.preferences.permitCategories ?? null,
      share_with_employers: data.shareWithEmployers,
      can_apply: data.shareWithEmployers,
      profile_completed_at: new Date().toISOString(),
      profile_completion_step: 9,
      profile_draft: {},
      profile_token: null as string | null,
      token_expires_at: null as string | null,
      updated_at: new Date().toISOString(),
    };

    const upsert = await supabase.from("candidates").upsert(row, { onConflict: "email" }).select("id").maybeSingle();
    if (upsert.error) {
      logApiError("/api/candidate-profile upsert", upsert.error);
      return NextResponse.json(
        {
          error: "Could not save profile.",
          hint: "Run supabase/candidates.sql in Supabase SQL Editor, then retry.",
        },
        { status: 500 },
      );
    }

    const cid = upsert.data && typeof (upsert.data as { id?: string }).id === "string" ? (upsert.data as { id: string }).id : null;
    void logAuditEvent("candidate_profile_completed", "candidate", cid, "candidate", { email: data.email });

    return NextResponse.json({ success: true, shareWithEmployers: data.shareWithEmployers });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile", error });
    logApiError("/api/candidate-profile", error);
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile-get", 30, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const email = (request.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const res = await supabase
      .from("candidates")
      .select("email,share_with_employers,can_apply,profile_completed_at,profile_completion_step,first_name")
      .eq("email", email)
      .maybeSingle();

    if (res.error) {
      logApiError("/api/candidate-profile get", res.error);
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile: res.data });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile", error });
    return NextResponse.json({ profile: null }, { status: 200 });
  }
}
