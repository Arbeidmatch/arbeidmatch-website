import "server-only";

const ATS_PUBLIC_BASE_URL =
  process.env.ATS_PUBLIC_BASE_URL?.trim() ||
  process.env.ATS_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_ATS_URL?.trim() ||
  "https://ats.arbeidmatch.no";

export type PartnerVerifyResult =
  | { found: false }
  | {
      found: true;
      company: {
        id: string;
        name: string;
        org_number: string | null;
      };
    };

export async function fetchPartnerVerifyByEmail(email: string): Promise<PartnerVerifyResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return { found: false };

  try {
    const url = `${ATS_PUBLIC_BASE_URL.replace(/\/$/, "")}/api/public/partner-verify?email=${encodeURIComponent(normalized)}`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { found: false };
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) return { found: false };
    const row = data as {
      found?: boolean;
      company?: { id?: string; name?: string; org_number?: string | null };
    };

    if (!res.ok || !row.found || !row.company?.id) return { found: false };

    return {
      found: true,
      company: {
        id: String(row.company.id),
        name: String(row.company.name ?? "").trim() || "Company",
        org_number: row.company.org_number ? String(row.company.org_number).trim() : null,
      },
    };
  } catch {
    return { found: false };
  }
}
