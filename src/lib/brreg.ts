import "server-only";

import { normalizeOrgNumber } from "@/lib/orgNumber";

const ENHETER = "https://data.brreg.no/enhetsregisteret/api/enheter";

/** city: the town of the business address, so two firms with the same name can be told apart in a list. */
export type BrregCompany = { name: string; orgNumber: string; city?: string };

type BrregEnhet = { navn?: string; organisasjonsnummer?: string; forretningsadresse?: { poststed?: string } };

function toCompany(item: BrregEnhet): BrregCompany {
  const city = item.forretningsadresse?.poststed?.trim();
  return { name: item.navn || "", orgNumber: item.organisasjonsnummer || "", ...(city ? { city } : {}) };
}

/**
 * One registered unit by its number. "missing" means the register answered and
 * has no such unit; "unreachable" means we could not ask it.
 */
export async function lookupBrregCompany(
  orgNumber: string,
): Promise<{ status: "found"; company: BrregCompany } | { status: "missing" } | { status: "unreachable" }> {
  const digits = normalizeOrgNumber(orgNumber);
  if (!digits) return { status: "missing" };
  try {
    const response = await fetch(`${ENHETER}/${digits}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    // A deleted unit answers 410, an unknown one 404.
    if (response.status === 404 || response.status === 410) return { status: "missing" };
    if (!response.ok) return { status: "unreachable" };
    const company = toCompany((await response.json()) as BrregEnhet);
    return company.orgNumber ? { status: "found", company } : { status: "missing" };
  } catch {
    return { status: "unreachable" };
  }
}

/** Search by name, or by number when the query is nine digits. */
export async function searchBrregCompanies(query: string): Promise<BrregCompany[] | null> {
  const digits = normalizeOrgNumber(query);
  if (digits) {
    const hit = await lookupBrregCompany(digits);
    if (hit.status === "unreachable") return null;
    return hit.status === "found" ? [hit.company] : [];
  }
  const response = await fetch(`${ENHETER}?navn=${encodeURIComponent(query)}&size=8`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { _embedded?: { enheter?: BrregEnhet[] } };
  return data._embedded?.enheter?.map(toCompany) ?? [];
}
