import { NextResponse } from "next/server";
import { z } from "zod";
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
      .select("company, email, full_name, phone, job_summary, org_number, gdpr_consent, how_did_you_hear, industry, role, ats_company_id")
      .eq("token", token)
      .single();

    if (error || !data) {
      return noStoreJson({ success: false, error: "Token not found" }, { status: 404 });
    }

    // Detect partner or owner status
    const email = (data.email || "").trim().toLowerCase();
    const domain = email.split("@")[1]?.toLowerCase() || "";
    const isOwner = domain === "arbeidmatch.no";
    let isPartner = data.how_did_you_hear === "partner" || Boolean(data.ats_company_id);
    let partnerCompanyName = isPartner ? (data.company || "") : "";

    // If not already flagged as partner, check partners table by domain
    if (!isPartner && !isOwner && domain) {
      const { data: partner } = await supabase
        .from("partners")
        .select("company_name")
        .eq("domain", domain)
        .eq("active", true)
        .maybeSingle();
      if (partner) {
        isPartner = true;
        partnerCompanyName = partner.company_name || "";
      }
    }

    return noStoreJson({
      success: true,
      data: {
        ...data,
        isPartner,
        isOwner,
        partnerCompanyName,
      },
    });
  } catch (error) {
    logApiError("token-data", error);
    await notifyError({ route: "/api/token-data/[token]", error });
    return noStoreJson({ success: false, error: "Could not fetch token data." }, { status: 500 });
  }
}
