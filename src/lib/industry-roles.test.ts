import { describe, expect, it } from "vitest";
import { roleSearchKeywords } from "./industry-roles";

/**
 * What /api/candidate-count actually does with these words: each one becomes
 * `current_job_title ilike '%token%'`, which is a case-insensitive substring
 * test and nothing cleverer. A token that is not a substring of the title a
 * candidate is registered under does not find them.
 */
function findsTitle(role: string, title: string): boolean {
  const haystack = title.toLowerCase();
  return roleSearchKeywords(role).some((token) => token.trim().length >= 2 && haystack.includes(token.toLowerCase()));
}

describe("roleSearchKeywords", () => {
  it("finds a plasterboard fitter under the name he is registered by", () => {
    // "gipsmonter" was listed and "Gipsmontør" is what is in the ATS: ilike
    // compares the letters, so the o-slash was a miss and every one of these
    // people counted as zero against a client asking for drywallers.
    expect(findsTitle("Drywaller", "Gipsmontør")).toBe(true);
    expect(findsTitle("Drywaller", "Regips")).toBe(true);
    expect(findsTitle("Drywaller", "Regipsmontør / tømrer")).toBe(true);
    expect(findsTitle("Drywaller", "Gipsplater og himling")).toBe(true);
    expect(findsTitle("Drywaller", "Drywall fitter")).toBe(true);
  });

  it("does not answer for somebody in another trade", () => {
    expect(findsTitle("Drywaller", "Bilmekaniker")).toBe(false);
    expect(findsTitle("Drywaller", "Elektriker")).toBe(false);
  });

  it("keeps the role's own name as a search word", () => {
    expect(roleSearchKeywords("Drywaller")[0]).toBe("Drywaller");
    // A role with no synonyms is still searched for by its own name.
    expect(roleSearchKeywords("Not a role")).toEqual(["Not a role"]);
  });
});
