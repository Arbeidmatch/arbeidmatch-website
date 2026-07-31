import { NextRequest } from "next/server";
import { z } from "zod";

import { noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Counts abandonment of the consent step. The body carries a random session id and
 * nothing else: no email, no form values, nothing that identifies a person.
 */
const bodySchema = z
  .object({
    sessionId: z.string().trim().min(8).max(64),
    step: z.string().trim().max(40).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 2 * 1024 });
    if (!parsed.ok) return parsed.response;

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from("cv_consent_declines").insert({
        session_id: parsed.data.sessionId,
        step: parsed.data.step ?? null,
      });
    }

    return noStoreJson({ success: true });
  } catch (error) {
    logApiError("cv/consent/decline", error);
    // Declining must always succeed from the user's point of view.
    return noStoreJson({ success: true });
  }
}
