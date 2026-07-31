import { NextRequest } from "next/server";

import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { hashAccessToken } from "@/lib/cv/otp";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "This link is no longer valid. Ask for a new one from your CV email.";

/**
 * Everything we hold about the person behind the magic link. Reached only with a signed
 * `my-data` token, which is valid 24 hours and is not consumed by reading, so the page
 * can be refreshed.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 400 });

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from("cv_access_tokens")
      .select("candidate_id, expires_at")
      .eq("token_hash", hashAccessToken(token))
      .eq("purpose", "my-data")
      .maybeSingle();
    if (tokenError) throw tokenError;

    if (!tokenRow?.candidate_id || String(tokenRow.expires_at) < new Date().toISOString()) {
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 403 });
    }

    const { data: candidate, error: candidateError } = await supabase
      .from("cv_candidates")
      .select("id, email_normalized, first_name, last_name, phone, city, country, headline, status, source, marketing_opt_in, created_at, updated_at")
      .eq("id", tokenRow.candidate_id)
      .maybeSingle();
    if (candidateError) throw candidateError;

    if (!candidate || candidate.status === "erased") {
      return noStoreJson({ success: false, error: GENERIC_ERROR }, { status: 404 });
    }

    const { data: documents, error: documentsError } = await supabase
      .from("cv_documents")
      .select("id, kind, template_id, payload, created_at, ats_pushed_at, recman_pushed_at")
      .eq("candidate_id", tokenRow.candidate_id)
      .order("created_at", { ascending: false });
    if (documentsError) throw documentsError;

    const { data: consents, error: consentsError } = await supabase
      .from("cv_consents")
      .select("consent_privacy, consent_work_profile, consent_marketing, policy_version, otp_verified_at, created_at")
      .eq("candidate_id", tokenRow.candidate_id)
      .order("created_at", { ascending: false });
    if (consentsError) throw consentsError;

    return noStoreJson({
      success: true,
      profile: candidate,
      documents: documents ?? [],
      consents: consents ?? [],
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    logApiError("cv/my-data", error);
    return noStoreJson({ success: false, error: "Could not load your data." }, { status: 500 });
  }
}
