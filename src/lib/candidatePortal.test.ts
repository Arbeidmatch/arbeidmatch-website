import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "./candidatePortal";

/**
 * A candidate who cannot sign in has no way of telling us so, and the last time
 * this broke it broke silently: the correction of 6 August put every login on
 * jobs.arbeidmatch.no, and the front page rewritten on 2 September brought back
 * `ats.arbeidmatch.no/candidate/login` in two places - the top bar and the
 * Create profile door. Both are the back office, where a candidate's password
 * does not exist.
 *
 * So the rule is written down rather than remembered: nothing the visitor can
 * press may address the ATS candidate area directly. If a new door needs one of
 * these, it reads the constant.
 */

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("candidate portal doors", () => {
  it("keeps the login on the board, not in the ATS", () => {
    expect(CANDIDATE_PORTAL_LOGIN_URL).toBe("https://jobs.arbeidmatch.no/login");
  });

  it("sends a candidate without a profile somewhere a profile can be made", () => {
    expect(CANDIDATE_PORTAL_SIGNUP_URL).not.toMatch(/login/);
  });

  it("has no page pointing a candidate at the ATS login", () => {
    const offenders = sourceFiles(SRC).filter((file) => /candidate\/login/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
