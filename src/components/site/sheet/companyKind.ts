/**
 * What kind of firm asks for people, as the register says (ORDER 295, the
 * owner, 15 November 2026: "firma cand face o cerere sa fie verificata in
 * brreg ... ca poate alege gresit"). A main industry code in division 78
 * (employment activities) is a staffing agency; any other code is a firm
 * hiring for its own operations. Only when the firm is not in the register
 * does the visitor choose by hand.
 */

export type CompanyKind = "agency" | "own" | "manual";

export function companyKind(company: { industryCode?: string | null } | null | undefined): CompanyKind {
  if (!company) return "manual";
  const code = String(company.industryCode ?? "").trim();
  return /^78(\.|$)/.test(code) ? "agency" : "own";
}

export const COMPANY_KIND_LABEL_NB: Record<Exclude<CompanyKind, "manual">, string> = {
  agency: "Bemanningsforetak",
  own: "Egen drift",
};
