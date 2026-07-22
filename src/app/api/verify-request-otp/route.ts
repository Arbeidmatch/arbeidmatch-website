import { NextRequest } from "next/server";
import { z } from "zod";

import { getRateLimitResult, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import {
  isValidRequestEmail,
  normalizeRequestEmail,
  OTP_MAX_ATTEMPTS,
  requestAccessRedirectUrl,
  verifyOtpCode,
} from "@/lib/request-access-otp";
import { findOrCreateRequestToken } from "@/lib/request-token-from-otp";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const verifySchema = z
  .object({
    email: z.string().trim().email().max(200),
    otp: z.string().trim().regex(/^\d{6}$/),
    flow: z.enum(["partner", "new_company"]),
    verificationId: z.string().uuid().optional(),
  })
  .strict();

type OtpRow = {
  id: number;
  verification_id: string;
  email: string;
  otp_hash: string;
  flow_type: "partner" | "new_company";
  attempt_count: number;
  consumed_at: string | null;
  request_token: string | null;
  expires_at: string;
  partner_company_id: string | null;
  partner_company_name: string | null;
  partner_org_number: string | null;
  industry: string | null;
  role: string | null;
  gdpr_consent: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "verify-request-otp", 20, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJsonBodyWithSchema(request, verifySchema, { maxBytes: 4 * 1024 });
    if (!parsed.ok) return parsed.response;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 500 });
    }

    const email = normalizeRequestEmail(parsed.data.email);
    const flow = parsed.data.flow;
    if (!isValidRequestEmail(email)) {
      return noStoreJson({ success: false, error: "Valid email is required." }, { status: 400 });
    }

    let query = supabase
      .from("request_access_otps")
      .select("*")
      .eq("email", email)
      .eq("flow_type", flow)
      .order("created_at", { ascending: false })
      .limit(1);

    if (parsed.data.verificationId) {
      query = supabase
        .from("request_access_otps")
        .select("*")
        .eq("verification_id", parsed.data.verificationId)
        .eq("email", email)
        .eq("flow_type", flow)
        .limit(1);
    }

    const { data: rowData, error: rowError } = await query.maybeSingle();
    if (rowError) throw rowError;

    const row = rowData as OtpRow | null;
    if (!row) {
      return noStoreJson(
        { success: false, error: "No active verification code. Request a new one.", code: "not_found" },
        { status: 400 },
      );
    }

    if (row.consumed_at && row.request_token) {
      const redirectUrl = requestAccessRedirectUrl(String(row.request_token));
      return noStoreJson({
        success: true,
        token: row.request_token,
        redirectUrl,
      });
    }

    if (row.consumed_at) {
      return noStoreJson(
        { success: false, error: "This code was already used. Request a new one.", code: "consumed" },
        { status: 400 },
      );
    }

    if (new Date(row.expires_at) < new Date()) {
      return noStoreJson(
        { success: false, error: "This code has expired. Request a new one.", code: "expired" },
        { status: 400 },
      );
    }

    if (row.attempt_count >= OTP_MAX_ATTEMPTS) {
      return noStoreJson(
        {
          success: false,
          error: "Too many incorrect attempts. Request a new verification code.",
          code: "too_many_attempts",
        },
        { status: 429 },
      );
    }

    const otpValid = verifyOtpCode(parsed.data.otp, row.otp_hash);
    if (!otpValid) {
      const nextAttempts = row.attempt_count + 1;
      await supabase
        .from("request_access_otps")
        .update({ attempt_count: nextAttempts })
        .eq("id", row.id);

      const remaining = Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts);
      return noStoreJson(
        {
          success: false,
          error:
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Too many incorrect attempts. Request a new verification code.",
          code: remaining > 0 ? "invalid_otp" : "too_many_attempts",
        },
        { status: remaining > 0 ? 400 : 429 },
      );
    }

    const { token } = await findOrCreateRequestToken(supabase, {
      email,
      flow,
      industry: row.industry,
      role: row.role,
      gdprConsent: row.gdpr_consent === true,
      partnerCompanyId: row.partner_company_id,
      partnerCompanyName: row.partner_company_name,
      partnerOrgNumber: row.partner_org_number,
    });

    const consumedAt = new Date().toISOString();
    const { error: consumeError } = await supabase
      .from("request_access_otps")
      .update({
        consumed_at: consumedAt,
        request_token: token,
      })
      .eq("id", row.id)
      .is("consumed_at", null);

    if (consumeError) throw consumeError;

    const redirectUrl = requestAccessRedirectUrl(token);
    return noStoreJson({
      success: true,
      token,
      redirectUrl,
    });
  } catch (error) {
    logApiError("verify-request-otp", error);
    await notifyError({ route: "/api/verify-request-otp", error });
    return noStoreJson({ success: false, error: "Could not verify code." }, { status: 500 });
  }
}
