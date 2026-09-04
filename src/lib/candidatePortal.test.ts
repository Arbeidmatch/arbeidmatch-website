import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "./candidatePortal";

/**
 * A candidate who cannot sign in has no way of telling us so, and this one broke
 * twice in one direction and once in the other:
 *
 * - From 6 August this constant read `jobs.arbeidmatch.no/login`. That host is the
 *   external board the ATS mirrors, not a system of ours, so the navbar, the mobile
 *   drawer, /employees and the candidate account panel all sent people to a
 *   stranger's login page.
 * - The front page written on 2 September used the right destination by hand,
 *   and on 4 September it was "corrected" onto the wrong constant, which took the
 *   last working door away.
 *
 * So the destination is asserted here rather than remembered, and the rule is that
 * every visible login reads the constant instead of writing a host of its own.
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
  it("points the login at the ATS candidate portal", () => {
    expect(CANDIDATE_PORTAL_LOGIN_URL).toBe("https://ats.arbeidmatch.no/candidate/login");
  });

  it("never points a candidate at the external board's login", () => {
    expect(CANDIDATE_PORTAL_LOGIN_URL).not.toMatch(/jobs\.arbeidmatch\.no/);
  });

  it("never points a candidate at the staff login", () => {
    // ats.arbeidmatch.no/login is our own staff door, with 2FA behind it.
    expect(CANDIDATE_PORTAL_LOGIN_URL).not.toMatch(/^https:\/\/ats\.arbeidmatch\.no\/login\b/);
  });

  it("sends a candidate without a profile somewhere a profile can be made", () => {
    expect(CANDIDATE_PORTAL_SIGNUP_URL).not.toMatch(/login/);
  });

  it("has no page writing a login host of its own", () => {
    const offenders = sourceFiles(SRC).filter((file) => {
      const text = readFileSync(file, "utf8");
      if (file.endsWith(join("lib", "candidatePortal.ts"))) return false;
      return /(jobs|ats)\.arbeidmatch\.no\/(candidate\/)?login/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
