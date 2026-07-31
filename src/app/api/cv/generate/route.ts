import { NextRequest } from "next/server";
import { z } from "zod";

import { noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { hashAccessToken } from "@/lib/cv/otp";
import { renderCombinedPdf } from "@/lib/cv/pdf";
import { cvDocumentSchema } from "@/lib/cv/schema";
import { downloadPdf } from "@/lib/cv/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    kind: z.enum(["cv", "cover_letter", "combined"]).default("cv"),
  })
  .strict();

/**
 * Exchanges a single use download token for the PDF. The token is consumed on the first
 * successful download, so a leaked link is worth nothing afterwards.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 4 * 1024 });
    if (!parsed.ok) return parsed.response;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const tokenHash = hashAccessToken(parsed.data.token);
    const nowIso = new Date().toISOString();

    const { data: tokenRow, error: tokenError } = await supabase
      .from("cv_access_tokens")
      .select("id, candidate_id, expires_at, consumed_at")
      .eq("token_hash", tokenHash)
      .eq("purpose", "download")
      .maybeSingle();
    if (tokenError) throw tokenError;

    if (!tokenRow || tokenRow.consumed_at || String(tokenRow.expires_at) < nowIso) {
      return noStoreJson(
        { success: false, error: "This download link has expired. Please verify again.", code: "expired" },
        { status: 403 },
      );
    }

    const { data: documents, error: documentsError } = await supabase
      .from("cv_documents")
      .select("id, kind, payload, storage_path")
      .eq("candidate_id", tokenRow.candidate_id)
      .order("created_at", { ascending: false });
    if (documentsError) throw documentsError;

    const wanted = parsed.data.kind === "combined" ? "cv" : parsed.data.kind;
    const record = documents?.find((row) => row.kind === wanted);
    if (!record) {
      return noStoreJson({ success: false, error: "Nothing to download." }, { status: 404 });
    }

    let bytes: Uint8Array | null = null;
    let fileName = "ArbeidMatch_CV.pdf";

    if (parsed.data.kind === "combined") {
      const doc = cvDocumentSchema.parse(record.payload);
      const combined = await renderCombinedPdf(doc);
      bytes = combined.bytes;
      fileName = combined.fileName;
    } else if (record.storage_path) {
      bytes = await downloadPdf(supabase, String(record.storage_path));
      fileName = String(record.storage_path).split("/").pop() ?? fileName;
    }

    if (!bytes) {
      return noStoreJson({ success: false, error: "Nothing to download." }, { status: 404 });
    }

    await supabase.from("cv_access_tokens").update({ consumed_at: nowIso }).eq("id", tokenRow.id);

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    });
  } catch (error) {
    logApiError("cv/generate", error);
    return noStoreJson({ success: false, error: "Could not build the PDF." }, { status: 500 });
  }
}
