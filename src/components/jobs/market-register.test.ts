import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { gateSourceFrom } from "@/lib/candidateGate";

/**
 * ORDER 514, rule 14b (board 7): a visitor who fits registers in the same
 * window. The window draws the one entry gate with the job as its source, so
 * RecOS saves the request for that job with the profile (rule 20).
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("register in the same window on a market job", () => {
  const client = read("src/components/jobs/MarketJobClient.tsx");

  it("never sends the visitor away to the register page", () => {
    expect(client).not.toContain("/candidate-register");
  });

  it("draws the one entry gate inside the window with the job as the source", () => {
    expect(client).toContain('import { CreateProfile } from "@/components/candidate-login/CandidateLoginScreen"');
    expect(client).toMatch(/<CreateProfile lang="en" params=\{new URLSearchParams\(\{ job: id \}\)\}[^\n]*embedded \/>/);
    expect(gateSourceFrom(new URLSearchParams({ job: "M-12" }))).toBe("job:M-12");
  });

  it("opens it from Recommend me and Register free, never before the check", () => {
    expect(client.match(/setRegistering\(true\)/g)?.length).toBe(2);
    expect(client).toMatch(/verdict\?\.state === "fits"[\s\S]*?setRegistering\(true\)[\s\S]*?Recommend me/);
  });

  it("keeps the gate's own page laid out as before", () => {
    const screen = read("src/components/candidate-login/CandidateLoginScreen.tsx");
    expect(screen).toContain("embedded ? styles.embed : styles.contents");
    expect(read("src/components/candidate-login/CandidateLogin.module.css")).toMatch(/\.contents \{\s*display: contents;/);
  });
});
