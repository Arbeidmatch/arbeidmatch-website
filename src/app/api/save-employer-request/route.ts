import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing" }, { status: 500 });
    }

    const payload = (await request.json()) as Record<string, string>;
    const { error } = await supabase.from("employer_requests").insert({
      token_id: payload.token,
      company: payload.company,
      org_number: payload.orgNumber,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone,
      job_summary: payload.job_summary,
      hiring_type: payload.hiringType,
      category: payload.category,
      position: payload.position,
      position_other: payload.positionOther,
      number_of_positions: payload.numberOfPositions ? Number(payload.numberOfPositions) : null,
      qualification: payload.qualification,
      experience: payload.experience ? Number(payload.experience) : null,
      norwegian_level: payload.norwegianLevel,
      driver_license: payload.driverLicense,
      d_number: payload.dNumber,
      requirements: payload.requirements,
      contract_type: payload.contractType,
      paslag_percent: payload.paslagPercent ? Number(payload.paslagPercent) : null,
      salary: payload.salary,
      full_time: payload.fullTime,
      hours: payload.hours,
      accommodation_cost: payload.accommodationCost,
      rotation: payload.rotation,
      overtime: payload.overtime,
      travel: payload.travel,
      accommodation: payload.accommodation,
      equipment: payload.equipment,
      tools: payload.tools,
      city: payload.city,
      start_date: payload.startDate,
      how_did_you_hear: payload.howDidYouHear,
      social_media_platform: payload.socialMediaPlatform,
      how_did_you_hear_other: payload.howDidYouHearOther || payload.socialMediaOther,
      referral_company_name: payload.referralCompanyName,
      referral_org_number: payload.referralOrgNumber,
      referral_email: payload.referralEmail,
      subscribe: payload.subscribe,
      notes: payload.notes,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
