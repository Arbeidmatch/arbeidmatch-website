import { NextRequest } from "next/server";
import { z } from "zod";

import {
  getRateLimitResult,
  hasHoneypotValue,
  noStoreJson,
  parseJsonBodyWithSchema,
} from "@/lib/apiSecurity";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { fetchPartnerVerifyByEmail } from "@/lib/partner-verify-fetch";
import {
  buildOtpEmailHtml,
  generateOtpCode,
  hashOtpCode,
  isValidRequestEmail,
  normalizeRequestEmail,
  OTP_EXPIRY_MS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  type RequestAccessFlow,
} from "@/lib/request-access-otp";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    email: z.string().trim().email().max(200),
    flow: z.enum(["partner", "new_company"]),
    industry: z.string().trim().max(120).optional(),
    role: z.string().trim().max(160).optional(),
    gdprConsent: z.boolean().optional(),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

async function countRecentSends(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  email: string,
  flow: RequestAccessFlow,
): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("request_access_otps")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("flow_type", flow)
    .gte("created_at", since);

  if (error) throw error;
  return count ?? 0;
}

async function getLatestSendAt(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  email: string,
  flow: RequestAccessFlow,
): Promise<Date | null> {
  const { data, error } = await supabase
    .from("request_access_otps")
    .select("created_at")
    .eq("email", email)
    .eq("flow_type", flow)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.created_at) return null;
  const parsed = new Date(String(data.created_at));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "request-otp", 12, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJsonBodyWithSchema(request, requestSchema, { maxBytes: 8 * 1024 });
    if (!parsed.ok) return parsed.response;
    if (hasHoneypotValue(parsed.data)) {
      return noStoreJson({ success: true });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 500 });
    }

    const email = normalizeRequestEmail(parsed.data.email);
    if (!isValidRequestEmail(email)) {
      return noStoreJson({ success: false, error: "Valid email is required." }, { status: 400 });
    }

    const flow = parsed.data.flow;
    const industry = parsed.data.industry?.trim() || null;
    const role = parsed.data.role?.trim() || null;

    if (flow === "new_company" && parsed.data.gdprConsent !== true) {
      return noStoreJson(
        { success: false, error: "Privacy consent is required.", code: "gdpr_required" },
        { status: 400 },
      );
    }

    let partnerCompanyId: string | null = null;
    let partnerCompanyName: string | null = null;
    let partnerOrgNumber: string | null = null;

    if (flow === "partner") {
      const partner = await fetchPartnerVerifyByEmail(email);
      if (!partner.found) {
        return noStoreJson(
          { success: false, error: "Email not recognized as a partner.", code: "partner_not_found" },
          { status: 403 },
        );
      }
      partnerCompanyId = partner.company.id;
      partnerCompanyName = partner.company.name;
      partnerOrgNumber = partner.company.org_number;
    }

    const sendsLastHour = await countRecentSends(supabase, email, flow);
    if (sendsLastHour >= OTP_MAX_SENDS_PER_HOUR) {
      return noStoreJson(
        {
          success: false,
          error: "Too many verification codes sent. Please try again in about an hour.",
          code: "send_limit",
        },
        { status: 429 },
      );
    }

    const latestSendAt = await getLatestSendAt(supabase, email, flow);
    if (latestSendAt) {
      const elapsedMs = Date.now() - latestSendAt.getTime();
      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000));
        return noStoreJson(
          {
            success: false,
            error: `Please wait ${retryAfterSeconds}s before requesting a new code.`,
            code: "cooldown",
            retryAfterSeconds,
          },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
        );
      }
    }

    const otpCode = generateOtpCode();
    const otpHash = hashOtpCode(otpCode);
    if (!otpHash) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
    const verificationId = crypto.randomUUID();

    const { error: invalidateError } = await supabase
      .from("request_access_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", email)
      .eq("flow_type", flow)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString());

    if (invalidateError) throw invalidateError;

    const { error: insertError } = await supabase.from("request_access_otps").insert({
      verification_id: verificationId,
      email,
      otp_hash: otpHash,
      flow_type: flow,
      attempt_count: 0,
      expires_at: expiresAt,
      partner_company_id: partnerCompanyId,
      partner_company_name: partnerCompanyName,
      partner_org_number: partnerOrgNumber,
      industry,
      role,
      gdpr_consent: flow === "new_company" ? true : true,
    });

    if (insertError) throw insertError;

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return noStoreJson({ success: false, error: "Email service unavailable." }, { status: 503 });
    }

    try {
      await transporter.sendMail({
        from: '"ArbeidMatch" <no-reply@arbeidmatch.no>',
        to: email,
        subject: "Your ArbeidMatch verification code",
        html: buildOtpEmailHtml(otpCode),
      });
    } catch (mailError) {
      logApiError("request-otp/mail", mailError);
      await supabase.from("request_access_otps").delete().eq("verification_id", verificationId);
      return noStoreJson(
        { success: false, error: "Could not send verification code. Please try again." },
        { status: 502 },
      );
    }

    return noStoreJson({
      success: true,
      verificationId,
      message: "Verification code sent.",
    });
  } catch (error) {
    logApiError("request-otp", error);
    await notifyError({ route: "/api/request-otp", error });
    return noStoreJson({ success: false, error: "Could not send verification code." }, { status: 500 });
  }
}
