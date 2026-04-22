import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { generateEmployerJobContent } from "@/lib/employer-flow/generateEmployerJob";
import { createEmployerJobDraftAfterRequest } from "@/lib/employer-flow/employerJobsRepository";
import { getRateLimitResult, hasHoneypotValue, noStoreJson } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";

const requestSchema = z
  .object({
    token: z.string().uuid(),
    company: z.string().trim().min(2).max(160),
    orgNumber: z.string().trim().max(40).optional().or(z.literal("")),
    email: z.string().trim().email().max(200),
    full_name: z.string().trim().min(2).max(120),
    phonePrefix: z.string().trim().max(8).optional().or(z.literal("")),
    phoneNumber: z.string().trim().max(40).optional().or(z.literal("")),
    phone: z.string().trim().min(6).max(40),
    job_summary: z.string().trim().max(1000).optional().or(z.literal("")),
    hiringType: z.string().trim().min(1).max(180),
    category: z.string().trim().min(1).max(120),
    position: z.string().trim().min(1).max(120),
    positionOther: z.string().trim().max(120).optional().or(z.literal("")),
    numberOfPositions: z.string().trim().max(10).optional().or(z.literal("")),
    qualification: z.string().trim().min(1).max(120),
    certifications: z.string().trim().max(1000).optional().or(z.literal("")),
    certificationsOther: z.string().trim().max(120).optional().or(z.literal("")),
    experience: z.string().trim().max(10).optional().or(z.literal("")),
    norwegianLevel: z.string().trim().max(80).optional().or(z.literal("")),
    englishLevel: z.string().trim().max(80).optional().or(z.literal("")),
    driverLicense: z.string().trim().max(80).optional().or(z.literal("")),
    driverLicenseOther: z.string().trim().max(80).optional().or(z.literal("")),
    dNumber: z.string().trim().max(160).optional().or(z.literal("")),
    dNumberOther: z.string().trim().max(120).optional().or(z.literal("")),
    requirements: z.string().trim().max(2000).optional().or(z.literal("")),
    contractType: z.string().trim().max(120).optional().or(z.literal("")),
    salaryPeriod: z.string().trim().max(80).optional().or(z.literal("")),
    salaryMode: z.string().trim().max(80).optional().or(z.literal("")),
    salary: z.string().trim().max(120).optional().or(z.literal("")),
    salaryAmount: z.string().trim().max(40).optional().or(z.literal("")),
    salaryFrom: z.string().trim().max(40).optional().or(z.literal("")),
    salaryTo: z.string().trim().max(40).optional().or(z.literal("")),
    hoursUnit: z.string().trim().max(60).optional().or(z.literal("")),
    hoursAmount: z.string().trim().max(10).optional().or(z.literal("")),
    overtime: z.union([z.boolean(), z.string().trim().max(60), z.literal(""), z.null()]).optional(),
    maxOvertimeHours: z.string().trim().max(10).optional().or(z.literal("")),
    hasRotation: z.string().trim().max(20).optional().or(z.literal("")),
    rotationWeeksOn: z.string().trim().max(20).optional().or(z.literal("")),
    rotationWeeksOff: z.string().trim().max(20).optional().or(z.literal("")),
    internationalTravel: z.string().trim().max(120).optional().or(z.literal("")),
    localTravel: z.string().trim().max(120).optional().or(z.literal("")),
    localTravelOther: z.string().trim().max(120).optional().or(z.literal("")),
    accommodation: z.string().trim().max(120).optional().or(z.literal("")),
    accommodationCost: z.string().trim().max(80).optional().or(z.literal("")),
    accommodationOther: z.string().trim().max(160).optional().or(z.literal("")),
    equipment: z.string().trim().max(160).optional().or(z.literal("")),
    equipmentOther: z.string().trim().max(160).optional().or(z.literal("")),
    tools: z.string().trim().max(160).optional().or(z.literal("")),
    toolsOther: z.string().trim().max(160).optional().or(z.literal("")),
    city: z.string().trim().min(1).max(120),
    startDate: z.string().trim().max(80).optional().or(z.literal("")),
    startDateOther: z.string().trim().max(80).optional().or(z.literal("")),
    howDidYouHear: z.string().trim().max(120).optional().or(z.literal("")),
    socialMediaPlatform: z.string().trim().max(120).optional().or(z.literal("")),
    socialMediaOther: z.string().trim().max(120).optional().or(z.literal("")),
    howDidYouHearOther: z.string().trim().max(160).optional().or(z.literal("")),
    referralCompanyName: z.string().trim().max(160).optional().or(z.literal("")),
    referralOrgNumber: z.string().trim().max(40).optional().or(z.literal("")),
    referralEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
    subscribe: z.string().trim().max(80).optional().or(z.literal("")),
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

function parseNumeric(value?: string) {
  if (!value || !value.trim()) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

const toBool = (val: unknown): boolean | null => {
  if (val === true || val === false) return val;
  if (typeof val !== "string") return null;

  const normalized = val.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return null;
};

const hasNonEmptyString = (val: unknown): val is string =>
  typeof val === "string" && val.trim().length > 0;

export async function POST(request: NextRequest) {
  let companySnapshot = "unknown";
  let normalizedBooleanFields: string[] = [];
  try {
    const rate = getRateLimitResult(request, "save-employer-request", 8, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return noStoreJson(
        { success: false, error: "Content-Type must be application/json." },
        { status: 415 },
      );
    }

    const maxBytes = 64 * 1024;
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        return noStoreJson({ success: false, error: "Payload too large." }, { status: 413 });
      }
    }

    const rawText = await request.text();
    if (Buffer.byteLength(rawText, "utf8") > maxBytes) {
      return noStoreJson({ success: false, error: "Payload too large." }, { status: 413 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      return noStoreJson({ success: false, error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(parsedJson);
    if (!parsed.success) {
      await notifyError({
        route: "/api/save-employer-request",
        error: new Error(JSON.stringify(parsed.error.flatten())),
      });
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (hasHoneypotValue(parsed.data)) {
      return noStoreJson({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson(
        { success: false, error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const payload = parsed.data;
    companySnapshot = payload.company?.trim() || "unknown";
    normalizedBooleanFields = [];
    const parsedHasRotation = toBool(payload.hasRotation);
    if (hasNonEmptyString(payload.hasRotation) && parsedHasRotation === null) {
      normalizedBooleanFields.push("hasRotation");
    }

    const parsedSubscribe = toBool(payload.subscribe);
    if (hasNonEmptyString(payload.subscribe) && parsedSubscribe === null) {
      normalizedBooleanFields.push("subscribe");
    }

    const parsedOvertime = toBool(payload.overtime);
    if (hasNonEmptyString(payload.overtime) && parsedOvertime === null) {
      normalizedBooleanFields.push("overtime");
    }

    const parsedInternationalTravel = toBool(payload.internationalTravel);
    if (hasNonEmptyString(payload.internationalTravel) && parsedInternationalTravel === null) {
      normalizedBooleanFields.push("internationalTravel");
    }

    const parsedAccommodation = toBool(payload.accommodation);
    if (hasNonEmptyString(payload.accommodation) && parsedAccommodation === null) {
      normalizedBooleanFields.push("accommodation");
    }

    const { data: insertedRequest, error } = await supabase.from("employer_requests").insert({
      token_id:                      payload.token,
      company:                       payload.company,
      org_number:                    payload.orgNumber,
      email:                         payload.email,
      full_name:                     payload.full_name,
      phone:                         payload.phone,
      job_summary:                   payload.job_summary || "General hiring inquiry",
      hiring_type:                   payload.hiringType,
      category:                      payload.category,
      position:                      payload.position,
      position_other:                payload.positionOther || null,
      number_of_positions:           parseNumeric(payload.numberOfPositions),
      qualification:                 payload.qualification,
      certifications:                payload.certifications,
      certifications_other:          payload.certificationsOther || null,
      experience:                    parseNumeric(payload.experience),
      norwegian_level:               payload.norwegianLevel,
      english_level:                 payload.englishLevel,
      driver_license:                payload.driverLicense,
      driver_license_other:          payload.driverLicenseOther || null,
      d_number:                      payload.dNumber,
      d_number_other:                payload.dNumberOther || null,
      requirements:                  payload.requirements || null,
      contract_type:                 payload.contractType,
      // Legacy fields retained as nullable to avoid breaking existing downstream consumers.
      paslag_percent:                null,
      salary:                        payload.salary,
      full_time:                     toBool(null),
      hours_unit:                    payload.hoursUnit,
      hours_amount:                  parseNumeric(payload.hoursAmount),
      overtime:                      parsedOvertime,
      max_overtime_hours:            parseNumeric(payload.maxOvertimeHours),
      has_rotation:                  parsedHasRotation,
      rotation_weeks_on:             parseNumeric(payload.rotationWeeksOn),
      rotation_weeks_off:            parseNumeric(payload.rotationWeeksOff),
      accommodation_cost:            payload.accommodationCost,
      international_travel:          parsedInternationalTravel,
      international_travel_coverage: toBool(null),
      local_travel:                  payload.localTravel,
      local_travel_other:            payload.localTravelOther || null,
      accommodation:                 parsedAccommodation,
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
      subscribe:                     parsedSubscribe,
      notes:                         payload.notes || null,
    })
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (insertedRequest?.id) {
      try {
        const generated = generateEmployerJobContent({
          company: payload.company,
          category: payload.category,
          position: payload.position,
          positionOther: payload.positionOther,
          qualification: payload.qualification,
          experience: payload.experience ?? "",
          hiringType: payload.hiringType,
          certifications: payload.certifications,
          requirements: payload.requirements,
          norwegianLevel: payload.norwegianLevel,
          englishLevel: payload.englishLevel,
          driverLicense: payload.driverLicense,
          contractType: payload.contractType,
          salaryFrom: payload.salaryFrom,
          salaryTo: payload.salaryTo,
          salary: payload.salary,
          salaryAmount: payload.salaryAmount,
          hoursUnit: payload.hoursUnit,
          hoursAmount: payload.hoursAmount,
          hasRotation: payload.hasRotation,
          rotationWeeksOn: payload.rotationWeeksOn,
          rotationWeeksOff: payload.rotationWeeksOff,
          internationalTravel: payload.internationalTravel,
          localTravel: payload.localTravel,
          accommodation: payload.accommodation || "",
          accommodationCost: payload.accommodationCost,
          city: payload.city,
          startDate: payload.startDate,
          job_summary: payload.job_summary || undefined,
          equipment: payload.equipment,
          tools: payload.tools,
          numberOfPositions: payload.numberOfPositions,
          email: payload.email,
        });
        await createEmployerJobDraftAfterRequest({
          employerRequestId: insertedRequest.id,
          generated,
        });
      } catch (flowError) {
        await notifyError({
          route: "/api/save-employer-request employer job draft",
          error: flowError,
          context: { employerRequestId: insertedRequest.id },
        });
      }
    }

    return noStoreJson({ success: true });
  } catch (error) {
    logApiError("save-employer-request", error, {
      normalized_boolean_fields_count: normalizedBooleanFields.length,
    });
    await notifyError({
      route: "/api/save-employer-request",
      error,
      context: {
        company: companySnapshot,
        timestamp: new Date().toISOString(),
        normalizedBooleanFields,
      },
    });
    return noStoreJson({ success: false, error: "Could not save employer request." }, { status: 500 });
  }
}
