import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EMPTY_ANSWERS } from "@/components/rask-foresporsel/data";

import { companyKind } from "./companyKind";
import { requestProblem, rolesLine, SHEET_TRADES, totalPeople } from "./RequestSheet";

describe("the request sheet's company row (ORDER 295, stage 2)", () => {
  it("an industry code in division 78 is a staffing agency", () => {
    expect(companyKind({ industryCode: "78.200" })).toBe("agency");
    expect(companyKind({ industryCode: "78.100" })).toBe("agency");
    expect(companyKind({ industryCode: "78" })).toBe("agency");
  });

  it("any other code is a firm hiring for its own operations", () => {
    expect(companyKind({ industryCode: "41.200" })).toBe("own");
    expect(companyKind({ industryCode: "07.800" })).toBe("own");
    expect(companyKind({ industryCode: "" })).toBe("own");
    expect(companyKind({})).toBe("own");
  });

  it("a firm not found in the register leaves the choice to the visitor", () => {
    expect(companyKind(null)).toBe("manual");
    expect(companyKind(undefined)).toBe("manual");
  });

  it("the not-found choice is shown only in the register search's sub-panel", () => {
    const src = readFileSync(join(process.cwd(), "src", "components", "site", "sheet", "RequestSheet.tsx"), "utf8");
    expect(src).toMatch(/notFound \? \(\s*<Group label="Ingen treff/);
    expect(src).toMatch(/label="Utenlandsk firma"/);
  });
});

describe("the request sheet's roles and order", () => {
  const base = { ...EMPTY_ANSWERS, answerMode: "rolle" as const, roleCounts: {} as Record<string, number>, fullName: "" };

  it("lists health care last", () => {
    expect(SHEET_TRADES.at(-1)?.key).toBe("helse");
    expect(SHEET_TRADES.map((t) => t.key)).toContain("annet");
  });

  it("counts every role, the typed one included", () => {
    const a = { ...base, trade: "bygg" as const, roles: ["Murer", "Tømrer"], otherRoleChosen: true, otherRole: "Glassmester", roleCounts: { Murer: 2, Tømrer: 1, Glassmester: 3 } };
    expect(totalPeople(a)).toBe(6);
    expect(rolesLine(a)).toBe("2 murer, 1 tømrer, 3 glassmester");
  });

  it("a role without a number counts as one person", () => {
    const a = { ...base, trade: "industri" as const, roles: ["CNC-operatør"] };
    expect(totalPeople(a)).toBe(1);
    expect(rolesLine(a)).toBe("1 CNC-operatør");
  });

  it("asks for the company first, then each row in the order it stands", () => {
    expect(requestProblem(base, null)).toMatch(/Brønnøysundregistrene/);
    const withFirm = { ...base, company: { name: "Test AS", orgNumber: "123456789" } };
    expect(requestProblem(withFirm, null)).toBe("Velg bransje.");
    expect(requestProblem({ ...withFirm, trade: "bygg" }, null)).toBe("Legg til minst én rolle.");
  });
});

describe("the request sheet asks who is asking (ORDER 296)", () => {
  const ready = {
    ...EMPTY_ANSWERS,
    answerMode: "rolle" as const,
    roleCounts: { Murer: 2 } as Record<string, number>,
    fullName: "",
    company: { name: "Test AS", orgNumber: "123456789" },
    trade: "bygg" as const,
    roles: ["Murer"],
    when: "Så snart som mulig",
    county: "Trøndelag",
    town: "Trondheim",
    equalTreatment: true,
    payFrom: "260",
    email: "test@test.invalid",
    privacyAccepted: true,
    termsAccepted: true,
  };

  it("refuses to send without a name", () => {
    expect(requestProblem(ready, 250)).toBe("Skriv inn navnet ditt.");
    expect(requestProblem({ ...ready, fullName: " A " }, 250)).toBe("Skriv inn navnet ditt.");
  });

  it("sends once the name is there", () => {
    expect(requestProblem({ ...ready, fullName: "Test Person" }, 250)).toBeNull();
  });

  it("puts the name in the request it saves, and the row in the Kontakt group", () => {
    const src = readFileSync(join(process.cwd(), "src", "components", "site", "sheet", "RequestSheet.tsx"), "utf8");
    expect(src).toMatch(/full_name: a\.fullName\.trim\(\)/);
    expect(src).toMatch(/<Group label="Kontakt">\s*<InputRow\s+id="am-req-name"/);
  });
});
