import { describe, expect, it } from "vitest";

import { REQUEST_INDUSTRY_ROLE_GROUPS } from "./industry-roles";
import { carriedIndustryAndRole, REQUEST_TO_WIZARD_INDUSTRY, wizardPositionFor } from "./request-carried-industry";
import { ROLE_QUESTION_INDUSTRIES } from "./request-role-questions";

const WIZARD_INDUSTRIES = [...ROLE_QUESTION_INDUSTRIES];
const POSITIONS: Record<string, string[]> = {
  Construction: ["Carpenter", "Construction worker", "Other"],
  "Welding and Metal": ["MIG/MAG welder", "Other"],
};

describe("the industry and role chosen on /request, in the wizard", () => {
  it("maps every /request industry to a category the wizard offers", () => {
    for (const { industry } of REQUEST_INDUSTRY_ROLE_GROUPS) {
      expect(WIZARD_INDUSTRIES).toContain(REQUEST_TO_WIZARD_INDUSTRY[industry]);
    }
  });

  it("opens with the category and the listed position", () => {
    expect(carriedIndustryAndRole("Building", "Carpenter", WIZARD_INDUSTRIES, POSITIONS)).toEqual({
      industry: "Construction",
      workerType: "Carpenter",
    });
  });

  it("keeps the role as its own position when the category does not list it", () => {
    expect(carriedIndustryAndRole("Welding", "Welder TIG", WIZARD_INDUSTRIES, POSITIONS)).toEqual({
      industry: "Welding and Metal",
      workerType: "Welder TIG",
    });
  });

  it("gives nothing for an industry the wizard does not know, or no industry", () => {
    expect(carriedIndustryAndRole("Space", "Astronaut", WIZARD_INDUSTRIES, POSITIONS)).toEqual({ industry: "", workerType: "" });
    expect(carriedIndustryAndRole(null, "Carpenter", WIZARD_INDUSTRIES, POSITIONS)).toEqual({ industry: "", workerType: "" });
  });

  it("gives the category alone when no role came", () => {
    expect(carriedIndustryAndRole("Building", null, WIZARD_INDUSTRIES, POSITIONS)).toEqual({ industry: "Construction", workerType: "" });
  });

  it("matches a listed position ignoring case", () => {
    expect(wizardPositionFor("carpenter", POSITIONS.Construction)).toBe("Carpenter");
    expect(wizardPositionFor("", POSITIONS.Construction)).toBe("");
  });
});
