import { NextRequest } from "next/server";
import { z } from "zod";

import { hasHoneypotValue, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { CONSENT_TEXT_SHA256, getPolicyVersion } from "@/lib/cv/consent";
import { buildOtpEmail, otpEmailSubject, resolveLang } from "@/lib/cv/emails";
import {
  OTP_EXPIRY_MS,
  OTP_MAX_SENDS_PER_EMAIL_PER_HOUR,
  OTP_MAX_SENDS_PER_IP_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  clientIp,
  generateOtpCode,
  hashEmail,
  hashIp,
  hashOtpCode,
  normalizeEmail,
} from "@/lib/cv/otp";
import { verifyCaptcha } from "@/lib/cv/captcha";
import { sendCvEmail } from "@/lib/cv/mailer";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    email: z.string().trim().email().max(200),
    consentPrivacy: z.boolean(),
    consentWorkProfile: z.boolean(),
    policyVersion: z.string().trim().max(40),
    policyTextSha256: z.string().trim().length(64),
    lang: z.enum(["en", "ro"]).optional(),
    captchaToken: z.string().max(4096).optional(),
    website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

/** Deliberately vague, so this endpoint never reveals whether an email exists. */
const GENERIC_ERROR = "Could not send the code. Please try again.";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 8 * 1024 });
    if (!parsed.ok) return parsed.response;
    if (hasHoneypotValue(parsed.data)) return noStoreJson({ success: true });

    const body = parsed.data;

    if (!body.consentPrivacy || !body.consentWorkProfile) {
      return noStoreJson(
        { success: false, error: "Both consents are required.", code: "consent_required" },
        { status: 400 },
      );
    }

    // The wording the user saw must be the wording we have on record.
    if (body.policyTextSha256 !== CONSENT_TEXT_SHA256 || body.policyVersion !== getPolicyVersion()) {
      return noStoreJson(
        { success: false, error: "The consent text has changed. Please reload the page.", code: "policy_mismatch" },
        { status: 409 },
      );
    }

    const captcha = await verifyCaptcha(body.captchaToken ?? null, clientIp(request.headers));
    if (!captcha.ok) {
      return noStoreJson({ success: false, error: GENERIC_ERROR, code: "captcha" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const emailHash = hashEmail(body.email);
    if (!supabase || !emailHash) {
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 500 });
    }

    const ipHash = hashIp(clientIp(request.headers));
    const nowIso = new Date().toISOString();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Limits live in the table, not in memory, because memory does not survive a lambda.
    const { count: emailSends, error: emailCountError } = await supabase
      .from("cv_otp")
      .select("id", { count: "exact", head: true })
      .eq("email_hash", emailHash)
      .gte("created_at", hourAgo);
    if (emailCountError) throw emailCountError;

    if ((emailSends ?? 0) >= OTP_MAX_SENDS_PER_EMAIL_PER_HOUR) {
      return noStoreJson(
        { success: false, error: "Too many codes requested. Try again in about an hour.", code: "send_limit" },
        { status: 429 },
      );
    }

    if (ipHash) {
      const { count: ipSends, error: ipCountError } = await supabase
        .from("cv_otp")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", hourAgo);
      if (ipCountError) throw ipCountError;

      if ((ipSends ?? 0) >= OTP_MAX_SENDS_PER_IP_PER_HOUR) {
        return noStoreJson(
          { success: false, error: "Too many codes requested. Try again in about an hour.", code: "send_limit" },
          { status: 429 },
        );
      }
    }

    const { data: latest, error: latestError } = await supabase
      .from("cv_otp")
      .select("created_at")
      .eq("email_hash", emailHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw latestError;

    if (latest?.created_at) {
      const elapsed = Date.now() - new Date(String(latest.created_at)).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000));
        return noStoreJson(
          { success: false, error: `Wait ${retryAfterSeconds}s before asking for a new code.`, code: "cooldown", retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
        );
      }
    }

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    if (!codeHash) {
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 500 });
    }

    // Any earlier live code for this email stops working the moment a new one is sent.
    const { error: invalidateError } = await supabase
      .from("cv_otp")
      .update({ consumed_at: nowIso })
      .eq("email_hash", emailHash)
      .is("consumed_at", null)
      .gt("expires_at", nowIso);
    if (invalidateError) throw invalidateError;

    const { data: inserted, error: insertError } = await supabase
      .from("cv_otp")
      .insert({
        email_hash: emailHash,
        code_hash: codeHash,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
        ip_hash: ipHash,
      })
      .select("id")
      .maybeSingle();
    if (insertError) throw insertError;

    const lang = resolveLang(body.lang);
    const sent = await sendCvEmail({
      to: normalizeEmail(body.email),
      subject: otpEmailSubject(lang),
      html: buildOtpEmail(code, lang),
    });

    if (!sent.ok) {
      // Never leave a code nobody can receive.
      logApiError("cv/consent/start/mail", new Error(sent.error ?? "send_failed"));
      if (inserted?.id) await supabase.from("cv_otp").delete().eq("id", inserted.id);
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 502 });
    }

    return noStoreJson({ success: true, expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000) });
  } catch (error) {
    logApiError("cv/consent/start", error);
    return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
