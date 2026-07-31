import { NextRequest } from "next/server";
import { z } from "zod";

import { noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { buildOtpEmail, otpEmailSubject, resolveLang } from "@/lib/cv/emails";
import {
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  clientIp,
  generateOtpCode,
  hashAccessToken,
  hashEmail,
  hashIp,
  hashOtpCode,
  verifyOtpCode,
} from "@/lib/cv/otp";
import { removeObjects } from "@/lib/cv/storage";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    /** Absent means "send me a code". Present means "here is the code, delete it all". */
    code: z.string().trim().regex(/^\d{6}$/).optional(),
    lang: z.enum(["en", "ro"]).optional(),
  })
  .strict();

const GENERIC_ERROR = "This link is no longer valid. Ask for a new one from your CV email.";

/**
 * Erasure. Deleting everything is irreversible, so it takes a fresh code of its own even
 * though the caller already holds a valid my-data link.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 4 * 1024 });
    if (!parsed.ok) return parsed.response;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const nowIso = new Date().toISOString();
    const { data: tokenRow, error: tokenError } = await supabase
      .from("cv_access_tokens")
      .select("candidate_id, expires_at")
      .eq("token_hash", hashAccessToken(parsed.data.token))
      .eq("purpose", "my-data")
      .maybeSingle();
    if (tokenError) throw tokenError;

    if (!tokenRow?.candidate_id || String(tokenRow.expires_at) < nowIso) {
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 403 });
    }

    const candidateId = String(tokenRow.candidate_id);
    const { data: candidate, error: candidateError } = await supabase
      .from("cv_candidates")
      .select("email_normalized, status")
      .eq("id", candidateId)
      .maybeSingle();
    if (candidateError) throw candidateError;

    if (!candidate || candidate.status === "erased") {
      return noStoreJson({ success: true, alreadyErased: true });
    }

    const email = String(candidate.email_normalized);
    const emailHash = hashEmail(email);
    if (!emailHash) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 500 });
    }

    // Step one: no code yet, so send one.
    if (!parsed.data.code) {
      const code = generateOtpCode();
      const codeHash = hashOtpCode(code);
      if (!codeHash) {
        return noStoreJson({ success: false, error: "Service unavailable." }, { status: 500 });
      }

      const { error: insertError } = await supabase.from("cv_otp").insert({
        email_hash: emailHash,
        code_hash: codeHash,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
        ip_hash: hashIp(clientIp(request.headers)),
      });
      if (insertError) throw insertError;

      const transporter = createSmtpTransporter();
      if (!transporter) {
        return noStoreJson({ success: false, error: "Service unavailable." }, { status: 503 });
      }

      const lang = resolveLang(parsed.data.lang);
      await transporter.sendMail({
        from: '"ArbeidMatch" <no-reply@arbeidmatch.no>',
        to: email,
        subject: otpEmailSubject(lang),
        html: buildOtpEmail(code, lang),
      });

      return noStoreJson({ success: true, codeSent: true });
    }

    // Step two: check the code, then erase.
    const { data: otpRow, error: otpError } = await supabase
      .from("cv_otp")
      .select("id, code_hash, attempts")
      .eq("email_hash", emailHash)
      .is("consumed_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (otpError) throw otpError;

    if (!otpRow) {
      return noStoreJson({ success: false, error: "That code is not valid.", code: "invalid" }, { status: 400 });
    }
    if ((otpRow.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await supabase.from("cv_otp").update({ consumed_at: nowIso }).eq("id", otpRow.id);
      return noStoreJson({ success: false, error: "Too many attempts. Ask for a new code.", code: "attempts" }, { status: 429 });
    }
    if (!verifyOtpCode(parsed.data.code, String(otpRow.code_hash))) {
      await supabase.from("cv_otp").update({ attempts: (otpRow.attempts ?? 0) + 1 }).eq("id", otpRow.id);
      return noStoreJson({ success: false, error: "That code is not valid.", code: "invalid" }, { status: 400 });
    }

    await supabase.from("cv_otp").update({ consumed_at: nowIso }).eq("id", otpRow.id);

    const { data: erased, error: eraseError } = await supabase.rpc("cv_erase_candidate", {
      p_candidate_id: candidateId,
    });
    if (eraseError) throw eraseError;

    const paths = Array.isArray(erased)
      ? (erased as Array<{ storage_path?: string | null }>)
          .map((row) => row.storage_path)
          .filter((path): path is string => Boolean(path))
      : [];
    await removeObjects(supabase, paths);

    return noStoreJson({ success: true, erased: true });
  } catch (error) {
    logApiError("cv/delete", error);
    return noStoreJson({ success: false, error: "Could not delete your data." }, { status: 500 });
  }
}
