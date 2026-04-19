import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  getRateLimitResult,
  hasHoneypotValue,
  noStoreJson,
  parseJsonBodyWithSchema,
} from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";

const requestSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    first_name: z.string().trim().max(120).optional(),
    last_name: z.string().trim().max(120).optional(),
    company: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(6).max(40),
    contactRole: z.string().trim().max(160).optional(),
    job_summary: z.string().trim().max(1000).optional(),
    requestedLocation: z.string().trim().max(120).optional(),
    partnershipStatus: z.string().trim().max(40).optional(),
    howDidYouHear: z.string().trim().max(120).optional(),
    socialMediaPlatform: z.string().trim().max(120).optional(),
    socialMediaOther: z.string().trim().max(120).optional(),
    howDidYouHearOther: z.string().trim().max(240).optional(),
    referralCompanyName: z.string().trim().max(160).optional(),
    referralOrgNumber: z.string().trim().max(40).optional(),
    referralEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
    orgNumber: z.string().trim().max(40).optional(),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "simple-request", 8, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJsonBodyWithSchema(request, requestSchema, { maxBytes: 16 * 1024 });
    if (!parsed.ok) return parsed.response;

    if (hasHoneypotValue(parsed.data)) {
      return noStoreJson({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson(
        {
          success: false,
          error: "Supabase configuration missing.",
        },
        { status: 500 },
      );
    }

    const {
      full_name,
      company,
      email,
      phone,
      job_summary,
      howDidYouHear,
      socialMediaPlatform,
      socialMediaOther,
      howDidYouHearOther,
      referralCompanyName,
      referralOrgNumber,
      referralEmail,
      orgNumber,
    } = parsed.data;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("request_tokens").insert({
      token,
      full_name,
      company,
      email,
      phone,
      org_number: orgNumber,
      job_summary: job_summary?.trim() || "General hiring inquiry",
      how_did_you_hear: howDidYouHear,
      social_media_platform: socialMediaPlatform,
      how_did_you_hear_other: howDidYouHearOther || socialMediaOther,
      referral_company_name: referralCompanyName,
      referral_org_number: referralOrgNumber,
      referral_email: referralEmail,
      expires_at: expiresAt,
      used: false,
    });

    if (error) {
      throw error;
    }

    return noStoreJson({ success: true, token });
  } catch (error) {
    logApiError("simple-request", error);
    return noStoreJson({ success: false, error: "Unable to create request token." }, { status: 500 });
  }
}
