import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  getRateLimitResult,
  hasHoneypotValue,
  noStoreJson,
  parseJsonBodyWithSchema,
} from "@/lib/apiSecurity";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";

const requestSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120).optional(),
    first_name: z.string().trim().min(1).max(120),
    last_name: z.string().trim().min(1).max(120),
    company: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(6).max(40),
    /** Job role from /request picker (not persisted on request_tokens unless column exists). */
    role: z.string().trim().max(160).optional(),
    industry: z.string().trim().max(120).optional(),
    job_summary: z.string().trim().max(1000).optional().default("General hiring inquiry"),
    org_number: z.string().trim().max(40).optional(),
    gdprConsent: z
      .boolean()
      .refine((val) => val === true, { message: "GDPR consent required" }),
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
  let companySnapshot = "unknown";
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
      first_name,
      last_name,
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
      org_number,
      orgNumber,
    } = parsed.data;
    companySnapshot = company?.trim() || "unknown";
    const resolvedFullName = full_name?.trim() || `${first_name} ${last_name}`.trim();

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("request_tokens").insert({
      token,
      full_name: resolvedFullName,
      company,
      email,
      phone,
      org_number: org_number ?? orgNumber,
      job_summary,
      gdpr_consent: true,
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

    const siteBaseRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.arbeidmatch.no";
    let linkUrl: string;
    try {
      const base = siteBaseRaw.startsWith("http") ? siteBaseRaw : `https://${siteBaseRaw}`;
      const u = new URL(base);
      linkUrl = `${u.origin}/request/${token}`;
    } catch {
      linkUrl = `https://www.arbeidmatch.no/request/${token}`;
    }

    const jobSummaryHtml = escapeHtml(job_summary);
    const linkUrlHtml = escapeHtml(linkUrl);
    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #0D1B2A;">Complete your candidate request</h2>
  <p style="color: #0D1B2A;">Thank you for your interest in ArbeidMatch. Click the button below to complete your request details.</p>
  <p style="color: #0D1B2A;">Selected role: <strong>${jobSummaryHtml}</strong></p>
  <a href="${linkUrl.replace(/"/g, "&quot;")}" style="display: inline-block; background: #C9A84C; color: #0D1B2A; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 24px 0;">Complete your request</a>
  <p style="color: #666; font-size: 14px;">Or copy this link: ${linkUrlHtml}</p>
  <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you did not request this, please ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">ArbeidMatch Norge AS | Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
</div>`;
      try {
        await transporter.sendMail({
          from: '"ArbeidMatch" <no-reply@arbeidmatch.no>',
          to: email,
          subject: "Your candidate request link - ArbeidMatch",
          html,
        });
      } catch (err) {
        console.error("[simple-request] Email send failed:", err);
      }
    }

    return noStoreJson({ success: true, token });
  } catch (error) {
    console.error("[simple-request] POST handler error:", error);
    logApiError("simple-request", error);
    await notifyError({
      route: "/api/simple-request",
      error,
      context: {
        company: companySnapshot,
        timestamp: new Date().toISOString(),
      },
    });
    return noStoreJson({ success: false, error: "Unable to create request token." }, { status: 500 });
  }
}
