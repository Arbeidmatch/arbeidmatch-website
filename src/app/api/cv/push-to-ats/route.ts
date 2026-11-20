import { NextRequest } from "next/server";
import { z } from "zod";

import { noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { notifySlack } from "@/lib/slackNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { MAX_PUSH_ATTEMPTS, backoffMs, pushToAtsEnabled, verifyHandoffSignature } from "@/lib/cv/handoff";
import { cvDocumentSchema } from "@/lib/cv/schema";
import { signedUrl } from "@/lib/cv/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({ documentId: z.string().uuid() }).strict();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T extends { ok: boolean; skipped?: boolean; error?: string }>(
  operation: () => Promise<T>,
): Promise<T> {
  let last = await operation();
  for (let attempt = 1; attempt < MAX_PUSH_ATTEMPTS && !last.ok && !last.skipped; attempt += 1) {
    await sleep(backoffMs(attempt));
    last = await operation();
  }
  return last;
}

async function pushToOwnAts(payload: unknown, pdfUrl: string | null): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const url = process.env.ATS_INGEST_URL?.trim();
  const key = process.env.ATS_API_KEY?.trim();
  if (!url || !key) return { ok: false, skipped: true, error: "ats_ingest_not_configured" };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ source: "cv-generator", cvDocument: payload, pdfUrl }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, error: `ats_${response.status}` };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "ats_failed" };
  }
}

/**
 * Internal only. Called by the consent verify route behind the CV_PUSH_TO_ATS flag and
 * authenticated with an HMAC over the document id. Idempotent: a document already in
 * RecOS is a no-op.
 *
 * ORDER 396, 20 November 2026: a CV goes to RecOS and nowhere else. The second push, to
 * the external system, is gone; it sent people's CVs outside our own.
 */
export async function POST(request: NextRequest) {
  try {
    if (!pushToAtsEnabled()) {
      return noStoreJson({ success: true, skipped: "flag_off" });
    }

    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 2 * 1024 });
    if (!parsed.ok) return parsed.response;

    const documentId = parsed.data.documentId;
    if (!verifyHandoffSignature(documentId, request.headers.get("x-cv-signature"))) {
      return noStoreJson({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { data: record, error: recordError } = await supabase
      .from("cv_documents")
      .select("id, payload, storage_path, ats_pushed_at, recman_pushed_at, push_attempts")
      .eq("id", documentId)
      .maybeSingle();
    if (recordError) throw recordError;

    if (!record) {
      return noStoreJson({ success: false, error: "Not found." }, { status: 404 });
    }
    if (record.ats_pushed_at) {
      return noStoreJson({ success: true, skipped: "already_pushed" });
    }

    const doc = cvDocumentSchema.parse(record.payload);
    const path = record.storage_path ? String(record.storage_path) : null;
    const pdfUrl = path ? await signedUrl(supabase, path) : null;

    const errors: string[] = [];

    let atsPushedAt = record.ats_pushed_at as string | null;
    if (!atsPushedAt) {
      const result = await withRetry(() => pushToOwnAts(doc, pdfUrl));
      if (result.ok) atsPushedAt = new Date().toISOString();
      else if (result.error) errors.push(result.error);
    }

    await supabase
      .from("cv_documents")
      .update({
        ats_pushed_at: atsPushedAt,
        push_attempts: (record.push_attempts ?? 0) + 1,
        push_last_error: errors.length > 0 ? errors.join("; ").slice(0, 500) : null,
      })
      .eq("id", documentId);

    if (errors.length > 0) {
      // No personal data in this message, only the internal document id.
      await notifySlack("errors", {
        title: "CV-ul nu a ajuns complet în ATS",
        fields: {
          Document: documentId,
          Erori: errors.join("; ").slice(0, 300),
          ATS: atsPushedAt ? "trimis" : "în așteptare",
        },
      });
    }

    return noStoreJson({
      success: errors.length === 0,
      atsPushed: Boolean(atsPushedAt),
    });
  } catch (error) {
    logApiError("cv/push-to-ats", error);
    return noStoreJson({ success: false, error: "Push failed." }, { status: 500 });
  }
}
