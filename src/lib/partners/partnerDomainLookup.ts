import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_PUBLIC_EMAIL_DOMAINS_BLOCKLIST = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "msn.com",
];

function getPublicEmailDomainsBlocklist(): Set<string> {
  const raw = process.env.PUBLIC_EMAIL_DOMAINS_BLOCKLIST;
  const normalized = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length > 0) {
    return new Set(normalized);
  }

  return new Set(DEFAULT_PUBLIC_EMAIL_DOMAINS_BLOCKLIST);
}

function normalizeDomain(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .split("/")[0]
    .split(":")[0];

  if (normalized.includes("@")) {
    return normalized.split("@").pop() ?? "";
  }

  return normalized;
}

function extractCandidateDomains(raw: string): string[] {
  return raw
    .split(/[,\s;|]+/g)
    .map((item) => normalizeDomain(item))
    .filter(Boolean);
}

type PartnerRow = {
  id: string;
  company_name: string | null;
  domain: string | null;
  email: string | null;
  verification_status: string | null;
};

export async function findActivePartnerByDomain(
  supabase: SupabaseClient,
  normalizedDomain: string,
): Promise<{ id: string; company_name: string | null } | null> {
  const pageSize = 1000;
  const maxPages = 50;
  const maxRows = 50000;
  let lastSeenId: string | null = null;
  let pagesScanned = 0;
  let rowsScanned = 0;

  while (pagesScanned < maxPages && rowsScanned < maxRows) {
    let query = supabase
      .from("partners")
      .select("id, company_name, domain, email, verification_status")
      .eq("active", true)
      .or("verification_status.eq.verified,verification_status.is.null")
      .order("id", { ascending: true })
      .limit(pageSize);

    if (lastSeenId) {
      query = query.gt("id", lastSeenId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    const rows = (data ?? []) as PartnerRow[];
    pagesScanned += 1;
    rowsScanned += rows.length;

    const partner =
      rows.find((row) => {
        const candidates = [
          ...extractCandidateDomains(String(row.domain ?? "")),
          ...extractCandidateDomains(String(row.email ?? "")),
        ];
        return candidates.includes(normalizedDomain);
      }) ?? null;

    if (partner) {
      return { id: partner.id, company_name: partner.company_name };
    }
    if (rows.length === 0 || rows.length < pageSize) {
      return null;
    }

    lastSeenId = rows[rows.length - 1]?.id ?? null;
    if (!lastSeenId) {
      return null;
    }
  }

  return null;
}

/**
 * True when the email domain matches an active partner record (same rules as /api/verify-partner).
 */
export async function isVerifiedPartnerCompanyEmail(
  supabase: SupabaseClient,
  rawEmail: string,
): Promise<boolean> {
  const normalizedInput = rawEmail.trim().toLowerCase();
  const email = normalizedInput.includes("@") ? normalizedInput : `info@${normalizedInput}`;
  const domain = normalizeDomain(email.split("@")[1] ?? "");
  if (!domain) return false;
  if (getPublicEmailDomainsBlocklist().has(domain)) return false;

  const partner = await findActivePartnerByDomain(supabase, domain);
  return partner != null;
}
