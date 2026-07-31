import { NextRequest } from "next/server";
import { z } from "zod";

import { noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { CONSENT_TEXT_SHA256, getPolicyVersion } from "@/lib/cv/consent";
import { buildCvEmail, cvEmailSubject, resolveLang } from "@/lib/cv/emails";
import { siteOrigin } from "@/lib/cv/org";
import {
  DOWNLOAD_TOKEN_TTL_MS,
  MY_DATA_TOKEN_TTL_MS,
  OTP_MAX_ATTEMPTS,
  clientIp,
  createAccessToken,
  hashEmail,
  hashIp,
  normalizeEmail,
  verifyOtpCode,
} from "@/lib/cv/otp";
import { renderCoverLetterPdf, renderCvPdf } from "@/lib/cv/pdf";
import { cvDocumentSchema } from "@/lib/cv/schema";
import { sha256Hex, storagePath, uploadPdf } from "@/lib/cv/storage";
import { queueHandoff } from "@/lib/cv/handoff";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z
  .object({
    email: z.string().trim().email().max(200),
    code: z.string().trim().regex(/^\d{6}$/),
    cvDocument: cvDocumentSchema,
    consentMarketing: z.boolean().optional(),
    lang: z.enum(["en", "ro"]).optional(),
  })
  .strict();

/** One message for every failure mode, so nothing here confirms an email exists. */
const GENERIC_ERROR = "That code is not valid. Please check it and try again.";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 256 * 1024 });
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const supabase = getSupabaseAdminClient();
    const emailHash = hashEmail(body.email);
    if (!supabase || !emailHash) {
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const { data: otpRow, error: otpError } = await supabase
      .from("cv_otp")
      .select("id, code_hash, attempts, expires_at")
      .eq("email_hash", emailHash)
      .is("consumed_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (otpError) throw otpError;

    if (!otpRow) {
      return noStoreJson({ success: false, error: GENERIC_ERROR, code: "invalid" }, { status: 400 });
    }

    if ((otpRow.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await supabase.from("cv_otp").update({ consumed_at: nowIso }).eq("id", otpRow.id);
      return noStoreJson(
        { success: false, error: "Too many attempts. Ask for a new code.", code: "attempts" },
        { status: 429 },
      );
    }

    if (!verifyOtpCode(body.code, String(otpRow.code_hash))) {
      await supabase
        .from("cv_otp")
        .update({ attempts: (otpRow.attempts ?? 0) + 1 })
        .eq("id", otpRow.id);
      return noStoreJson({ success: false, error: GENERIC_ERROR, code: "invalid" }, { status: 400 });
    }

    // Verified. From this point personal data may be written.
    const doc = body.cvDocument;
    const email = normalizeEmail(body.email);
    const otpVerifiedAt = new Date().toISOString();

    const { data: candidate, error: candidateError } = await supabase
      .from("cv_candidates")
      .upsert(
        {
          email_normalized: email,
          first_name: doc.personal.firstName,
          last_name: doc.personal.lastName,
          phone: doc.personal.phone,
          city: doc.personal.city,
          country: doc.personal.country,
          headline: doc.personal.headline,
          status: "active",
          source: "cv-generator",
          marketing_opt_in: body.consentMarketing === true,
          updated_at: otpVerifiedAt,
        },
        { onConflict: "email_normalized" },
      )
      .select("id")
      .maybeSingle();
    if (candidateError) throw candidateError;
    if (!candidate?.id) throw new Error("candidate_upsert_returned_no_row");

    const candidateId = String(candidate.id);

    const { error: consentError } = await supabase.from("cv_consents").insert({
      candidate_id: candidateId,
      candidate_email_hash: emailHash,
      consent_privacy: true,
      consent_work_profile: true,
      consent_marketing: body.consentMarketing === true,
      policy_version: getPolicyVersion(),
      policy_text_sha256: CONSENT_TEXT_SHA256,
      otp_verified_at: otpVerifiedAt,
      ip_hash: hashIp(clientIp(request.headers)),
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    if (consentError) throw consentError;

    await supabase.from("cv_otp").update({ consumed_at: otpVerifiedAt }).eq("id", otpRow.id);

    const cv = await renderCvPdf(doc);
    const coverLetter = await renderCoverLetterPdf(doc);

    const { data: cvDocRow, error: cvDocError } = await supabase
      .from("cv_documents")
      .insert({
        candidate_id: candidateId,
        kind: "cv",
        template_id: doc.templateId,
        payload: doc,
        pdf_sha256: sha256Hex(cv.bytes),
      })
      .select("id")
      .maybeSingle();
    if (cvDocError) throw cvDocError;
    if (!cvDocRow?.id) throw new Error("cv_document_insert_returned_no_row");

    const cvDocumentId = String(cvDocRow.id);
    const cvPath = storagePath(candidateId, cvDocumentId, cv.fileName);
    const upload = await uploadPdf(supabase, cvPath, cv.bytes);
    if (!upload.ok) throw new Error(`cv_upload_failed: ${upload.error}`);

    await supabase.from("cv_documents").update({ storage_path: cvPath }).eq("id", cvDocumentId);

    let coverLetterPath: string | null = null;
    if (coverLetter) {
      const { data: letterRow, error: letterError } = await supabase
        .from("cv_documents")
        .insert({
          candidate_id: candidateId,
          kind: "cover_letter",
          template_id: doc.templateId,
          payload: doc,
          pdf_sha256: sha256Hex(coverLetter.bytes),
        })
        .select("id")
        .maybeSingle();
      if (letterError) throw letterError;

      if (letterRow?.id) {
        coverLetterPath = storagePath(candidateId, String(letterRow.id), coverLetter.fileName);
        const letterUpload = await uploadPdf(supabase, coverLetterPath, coverLetter.bytes);
        if (letterUpload.ok) {
          await supabase
            .from("cv_documents")
            .update({ storage_path: coverLetterPath })
            .eq("id", letterRow.id);
        }
      }
    }

    const download = createAccessToken();
    const myData = createAccessToken();
    const { error: tokenError } = await supabase.from("cv_access_tokens").insert([
      {
        candidate_id: candidateId,
        token_hash: download.tokenHash,
        purpose: "download",
        expires_at: new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS).toISOString(),
      },
      {
        candidate_id: candidateId,
        token_hash: myData.tokenHash,
        purpose: "my-data",
        expires_at: new Date(Date.now() + MY_DATA_TOKEN_TTL_MS).toISOString(),
      },
    ]);
    if (tokenError) throw tokenError;

    const lang = resolveLang(body.lang);
    const myDataUrl = `${siteOrigin()}/cv/my-data?token=${encodeURIComponent(myData.token)}`;
    const transporter = createSmtpTransporter();
    if (transporter) {
      const attachments = [{ filename: cv.fileName, content: Buffer.from(cv.bytes) }];
      if (coverLetter) {
        attachments.push({ filename: coverLetter.fileName, content: Buffer.from(coverLetter.bytes) });
      }
      try {
        await transporter.sendMail({
          from: '"ArbeidMatch" <no-reply@arbeidmatch.no>',
          to: email,
          subject: cvEmailSubject(lang),
          html: buildCvEmail(myDataUrl, lang),
          attachments,
        });
      } catch (mailError) {
        // The download still works, so a mail failure must not fail the request.
        logApiError("cv/consent/verify/mail", mailError);
      }
    }

    await queueHandoff({ documentId: cvDocumentId });

    return noStoreJson({
      success: true,
      downloadToken: download.token,
      hasCoverLetter: Boolean(coverLetterPath),
      expiresInSeconds: Math.floor(DOWNLOAD_TOKEN_TTL_MS / 1000),
    });
  } catch (error) {
    logApiError("cv/consent/verify", error);
    return noStoreJson(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
