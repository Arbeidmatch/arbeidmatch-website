import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { RequestAccessFlow } from "@/lib/request-access-otp";

export type CreateRequestTokenInput = {
  email: string;
  flow: RequestAccessFlow;
  industry: string | null;
  role: string | null;
  gdprConsent: boolean;
  partnerCompanyId: string | null;
  partnerCompanyName: string | null;
  partnerOrgNumber: string | null;
};

/**
 * Reuses an active unused token for the same email + flow + industry + role when one exists.
 * Safer than invalidating old tokens, which could break an in-progress wizard session.
 */
export async function findOrCreateRequestToken(
  supabase: SupabaseClient,
  input: CreateRequestTokenInput,
): Promise<{ token: string; reused: boolean }> {
  const email = input.email.trim().toLowerCase();
  const nowIso = new Date().toISOString();
  const howDidYouHear = input.flow === "partner" ? "partner" : "website-request";

  let query = supabase
    .from("request_tokens")
    .select("token")
    .eq("email", email)
    .eq("used", false)
    .gt("expires_at", nowIso)
    .eq("gdpr_consent", true)
    .eq("how_did_you_hear", howDidYouHear);

  if (input.industry) query = query.eq("industry", input.industry);
  else query = query.is("industry", null);

  if (input.role) query = query.eq("role", input.role);
  else query = query.is("role", null);

  const { data: existing } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) {
    return { token: String(existing.token), reused: true };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const company =
    input.flow === "partner"
      ? (input.partnerCompanyName?.trim() || "Partner company")
      : "To be completed";

  const row: Record<string, unknown> = {
    token,
    full_name: input.flow === "partner" ? "Partner Contact" : "Employer Request",
    company,
    email,
    phone: input.flow === "partner" ? "N/A" : "000000",
    org_number: input.partnerOrgNumber?.trim() || null,
    job_summary: input.role?.trim() || "General hiring inquiry",
    gdpr_consent: input.gdprConsent,
    how_did_you_hear: howDidYouHear,
    expires_at: expiresAt,
    used: false,
    industry: input.industry,
    role: input.role,
  };

  if (input.partnerCompanyId) {
    row.ats_company_id = input.partnerCompanyId;
  }

  const { error } = await supabase.from("request_tokens").insert(row);
  if (error) throw error;

  return { token, reused: false };
}
