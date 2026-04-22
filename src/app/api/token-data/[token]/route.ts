import { NextResponse } from "next/server";
import { z } from "zod";
import { isVerifiedPartnerCompanyEmail } from "@/lib/partners/partnerDomainLookup";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = getSupabaseAdminClient();
  const { token } = await params;
  const validToken = z.string().uuid().safeParse(token).success;

  if (!supabase || !validToken) {
    return noStoreJson({ success: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("request_tokens")
      .select("company, email, full_name, phone, job_summary, org_number, gdpr_consent")
      .eq("token", token)
      .single();

    if (error || !data) {
      return noStoreJson({ success: false, error: "Token not found" }, { status: 404 });
    }

    let verified_partner = false;
    try {
      const email = typeof data.email === "string" ? data.email : "";
      if (email) {
        verified_partner = await isVerifiedPartnerCompanyEmail(supabase, email);
      }
    } catch (lookupError) {
      if (
        typeof lookupError === "object" &&
        lookupError !== null &&
        "code" in lookupError &&
        (lookupError as { code?: string }).code === "42P01"
      ) {
        verified_partner = false;
      } else {
        throw lookupError;
      }
    }

    return noStoreJson({ success: true, data: { ...data, verified_partner } });
  } catch (error) {
    logApiError("token-data", error);
    await notifyError({ route: "/api/token-data/[token]", error });
    return noStoreJson({ success: false, error: "Could not fetch token data." }, { status: 500 });
  }
}
