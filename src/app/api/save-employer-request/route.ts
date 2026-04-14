import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as Record<string, string>;

    const { error } = await supabase.from("employer_requests").insert({
      token_id:                      payload.token,
      company:                       payload.company,
      org_number:                    payload.orgNumber,
      email:                         payload.email,
      full_name:                     payload.full_name,
      phone:                         payload.phone,
      job_summary:                   payload.job_summary,
      hiring_type:                   payload.hiringType,
      category:                      payload.category,
      position:                      payload.position,
      position_other:                payload.positionOther || null,
      number_of_positions:           payload.numberOfPositions ? Number(payload.numberOfPositions) : null,
      qualification:                 payload.qualification,
      certifications:                payload.certifications,
      certifications_other:          payload.certificationsOther || null,
      experience:                    payload.experience ? Number(payload.experience) : null,
      norwegian_level:               payload.norwegianLevel,
      english_level:                 payload.englishLevel,
      driver_license:                payload.driverLicense,
      driver_license_other:          payload.driverLicenseOther || null,
      d_number:                      payload.dNumber,
      d_number_other:                payload.dNumberOther || null,
      requirements:                  payload.requirements || null,
      contract_type:                 payload.contractType,
      paslag_percent:                payload.paslagPercent ? Number(payload.paslagPercent) : null,
      salary:                        payload.salary,
      full_time:                     payload.fullTime,
      hours_unit:                    payload.hoursUnit,
      hours_amount:                  payload.hoursAmount ? Number(payload.hoursAmount) : null,
      overtime:                      payload.overtime,
      max_overtime_hours:            payload.maxOvertimeHours ? Number(payload.maxOvertimeHours) : null,
      has_rotation:                  payload.hasRotation,
      rotation_weeks_on:             payload.rotationWeeksOn ? Number(payload.rotationWeeksOn) : null,
      rotation_weeks_off:            payload.rotationWeeksOff ? Number(payload.rotationWeeksOff) : null,
      accommodation_cost:            payload.accommodationCost,
      international_travel:          payload.internationalTravel,
      international_travel_coverage: payload.internationalTravelCoverage || null,
      local_travel:                  payload.localTravel,
      local_travel_other:            payload.localTravelOther || null,
      accommodation:                 payload.accommodation,
      accommodation_other:           payload.accommodationOther || null,
      equipment:                     payload.equipment,
      equipment_other:               payload.equipmentOther || null,
      tools:                         payload.tools,
      tools_other:                   payload.toolsOther || null,
      city:                          payload.city,
      start_date:                    payload.startDate === "Other" ? payload.startDateOther : payload.startDate,
      how_did_you_hear:              payload.howDidYouHear,
      social_media_platform:         payload.socialMediaPlatform || null,
      social_media_other:            payload.socialMediaOther || null,
      how_did_you_hear_other:        payload.howDidYouHearOther || null,
      referral_company_name:         payload.referralCompanyName || null,
      referral_org_number:           payload.referralOrgNumber || null,
      referral_email:                payload.referralEmail || null,
      subscribe:                     payload.subscribe,
      notes:                         payload.notes || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("save-employer-request error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
