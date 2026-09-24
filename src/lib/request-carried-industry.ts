/**
 * The industry and role a visitor picked on /request ("Velg bransje", then
 * "Velg rolle") travel on the request token as request_tokens.industry and
 * request_tokens.role, in the English keys of src/lib/industry-roles.ts. The
 * wizard at /request/[token] has its own, coarser categories and positions;
 * this turns the one into the other so the wizard opens with both answered.
 *
 * THE OWNER, 24 September 2026: "alegerea de bransa trebuie sa fie". The
 * choice used to reach the wizard only for partners; every visitor who made
 * it now finds it there.
 */

/** /request industry key to the wizard's job category. */
export const REQUEST_TO_WIZARD_INDUSTRY: Readonly<Record<string, string>> = {
  Building: "Construction",
  Infrastructure: "Construction",
  Welding: "Welding and Metal",
  Electrical: "Electrical",
  Production: "Industry and Production",
  Logistics: "Logistics",
  Cleaning: "Cleaning",
  Hospitality: "HoReCa",
  Automotive: "Industry and Production",
  Offshore: "Welding and Metal",
  "Fish Industry": "Industry and Production",
};

/**
 * The wizard's position for a /request role inside a wizard category: the
 * listed position it names (exactly, ignoring case, or by one containing the
 * other), else the role itself, which the wizard shows as its own position.
 */
export function wizardPositionFor(
  role: string | null | undefined,
  positions: readonly string[],
): string {
  const wanted = (role ?? "").trim();
  if (!wanted) return "";
  const listed = positions.filter((p) => p !== "Other");
  if (listed.includes(wanted)) return wanted;
  const lower = wanted.toLowerCase();
  const exact = listed.find((p) => p.toLowerCase() === lower);
  if (exact) return exact;
  const partial = listed.find((p) => p.toLowerCase().includes(lower) || lower.includes(p.toLowerCase()));
  if (partial) return partial;
  return wanted;
}

/**
 * Category and position for the wizard from what the token carries. A
 * category the wizard does not offer gives nothing, and no position without
 * a category, so the step asks rather than holding an answer it cannot show.
 */
export function carriedIndustryAndRole(
  rawIndustry: string | null | undefined,
  rawRole: string | null | undefined,
  wizardIndustries: readonly string[],
  positionsByIndustry: Readonly<Record<string, readonly string[]>>,
): { industry: string; workerType: string } {
  const key = (rawIndustry ?? "").trim();
  const mapped = REQUEST_TO_WIZARD_INDUSTRY[key] || key;
  const industry = wizardIndustries.includes(mapped) ? mapped : "";
  if (!industry) return { industry: "", workerType: "" };
  return { industry, workerType: wizardPositionFor(rawRole, positionsByIndustry[industry] ?? []) };
}
