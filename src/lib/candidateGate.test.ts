import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { candidateRegisterHref, citizenshipAccepted, gateSourceFrom, isAdult, parseCitizenshipRule } from "./candidateGate";

/** ORDER 396: the one entry gate's source, age and citizenship on the site side. */

const q = (s: string) => new URLSearchParams(s);

describe("gateSourceFrom", () => {
  it.each([
    ["source=job:tile-layer", "job:tile-layer"],
    ["source=invite:AbCdEf0123456789xyz", "invite:AbCdEf0123456789xyz"],
    ["ref=AB12cd", "ref:AB12cd"],
    ["bot=0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11", "bot:0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11"],
    ["source=javascript:alert(1)", "site"],
    ["", "site"],
  ])("%s gives %s", (query, source) => {
    expect(gateSourceFrom(q(query))).toBe(source);
  });

  it("falls back to the general advert cookie, never over a door that named itself", () => {
    expect(gateSourceFrom(q(""), "0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11.site")).toBe("ga:0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11.site");
    expect(gateSourceFrom(q("source=job:x"), "0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11.site")).toBe("job:x");
  });
});

describe("the rest of the gate", () => {
  it("takes 18 and older only", () => {
    const today = new Date("2026-11-20T12:00:00Z");
    expect(isAdult("2008-11-20", today)).toBe(true);
    expect(isAdult("2008-11-21", today)).toBe(false);
    expect(isAdult("not-a-date", today)).toBe(false);
  });

  it("asks the work permit question only under rule B", () => {
    expect(citizenshipAccepted("work_permit", "eu_eea_only")).toBe(false);
    expect(citizenshipAccepted("work_permit", "eu_eea_or_work_permit")).toBe(true);
  });

  it("holds his rule B when RecOS says nothing (ORDER 426): a work permit passes, neither-nor does not", () => {
    const rule = parseCitizenshipRule(undefined);
    expect(rule).toBe("eu_eea_or_work_permit");
    expect(parseCitizenshipRule("eu_eea_only")).toBe("eu_eea_only");
    expect(citizenshipAccepted("work_permit", rule)).toBe(true);
    expect(citizenshipAccepted("eu_eea", rule)).toBe(true);
    expect(citizenshipAccepted("other", rule)).toBe(false);
  });

  it("builds the gate's address for the other doors", () => {
    expect(candidateRegisterHref("job:tile-layer")).toBe("/candidate-register?source=job%3Atile-layer");
    expect(candidateRegisterHref("nonsense")).toBe("/candidate-register");
  });
});

describe("every door of the site leads to the gate", () => {
  it("a job's Register and a recruiter's link no longer open the RecOS sign-up page directly", () => {
    const job = readFileSync("src/app/stilling/[slug]/page.tsx", "utf8");
    const invite = readFileSync("src/app/register/[handle]/page.tsx", "utf8");
    expect(job).toContain("candidateRegisterHref(`job:${slug}`)");
    expect(invite).toContain("candidateRegisterHref(`invite:${invitation.token}`)");
    for (const src of [job, invite]) expect(src).not.toContain("/candidate/login/register");
  });

  it("the CV builder sends CVs to RecOS only", () => {
    const push = readFileSync("src/app/api/cv/push-to-ats/route.ts", "utf8");
    expect(push).not.toMatch(/upsertRecmanCandidate|uploadRecmanFile/);
  });
});
