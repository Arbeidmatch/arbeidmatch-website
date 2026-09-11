import { describe, expect, it } from "vitest";
import { roleDetailsEmailSection, roleDetailsFromRequest, stripRoleDetailsBlock } from "./request-role-details-email";
import { roleDetailsRequirementsBlock } from "./request-role-questions";
import { RECRUITMENT_SAMPLE, STAFFING_SAMPLE } from "./request-role-questions.fixtures";

/** The letter's HTML as the ATS intake flattens it: cells and paragraphs become lines. */
function flatten(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|tr|td|th|li|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

describe("the Role details section of the office letter", () => {
  it("prints one label and one value per answer, under its own heading", () => {
    const { en } = roleDetailsFromRequest({
      service: "recruitment",
      industry: "Welding and Metal",
      position: "TIG welder",
      answers: RECRUITMENT_SAMPLE,
    });
    expect(flatten(roleDetailsEmailSection(en))).toBe(
      [
        "Role details",
        "Norwegian at work",
        "Not needed",
        "English at work",
        "Good spoken",
        "Welding methods",
        "MIG/MAG, TIG",
        "Welding certificate required",
        "Yes",
        "Probation period",
        "6 months",
        "Interviewed by",
        "Production manager",
        "Interview rounds",
        "2",
        "Hire needed by",
        "2026-11-02",
      ].join("\n"),
    );
  });

  it("is empty when there is nothing to say", () => {
    expect(roleDetailsEmailSection([])).toBe("");
    const { en, ro } = roleDetailsFromRequest({ service: "advertising", industry: "", position: "", answers: {} });
    expect(en).toEqual([]);
    expect(ro).toEqual([]);
  });

  it("escapes what the client typed", () => {
    const { en } = roleDetailsFromRequest({
      service: "recruitment",
      industry: "Cleaning",
      position: "Cleaner",
      answers: { ...RECRUITMENT_SAMPLE, recruitment: { ...RECRUITMENT_SAMPLE.recruitment, interviewer: "<b>Bygg & Co</b>" } },
    });
    const html = roleDetailsEmailSection(en);
    expect(html).toContain("&lt;b&gt;Bygg &amp; Co&lt;/b&gt;");
    expect(html).not.toContain("<b>Bygg");
  });

  it("builds its rows from the raw answers, not from labels a request could send", () => {
    const { en } = roleDetailsFromRequest({
      service: "staffing",
      industry: "Electrical",
      position: "Electrician",
      answers: { ...STAFFING_SAMPLE, Company: "Evil AS", trade: { ...STAFFING_SAMPLE.trade, "Company: Evil": "Yes" } },
    });
    expect(en.map((r) => r.label)).not.toContain("Company");
    expect(en.some((r) => r.label.includes("Evil") || r.value.includes("Evil"))).toBe(false);
  });
});

describe("stripRoleDetailsBlock", () => {
  it("takes the block out of the requirements for Slack and keeps the rest", () => {
    const input = { service: "staffing", industry: "Electrical", position: "Electrician", answers: STAFFING_SAMPLE };
    const { en } = roleDetailsFromRequest(input);
    const requirements = [
      "Work Tasks",
      "- Pull cable",
      "",
      "Requirements",
      "- Qualification: 3 to 5 years",
      "",
      roleDetailsRequirementsBlock(en),
      "",
      "Rotation schedule: No rotation / Standard schedule",
    ].join("\n");
    expect(stripRoleDetailsBlock(requirements, en)).toBe(
      [
        "Work Tasks",
        "- Pull cable",
        "",
        "Requirements",
        "- Qualification: 3 to 5 years",
        "",
        "Rotation schedule: No rotation / Standard schedule",
      ].join("\n"),
    );
  });

  it("leaves the text alone when there are no rows", () => {
    expect(stripRoleDetailsBlock("Work Tasks\n- x", [])).toBe("Work Tasks\n- x");
  });
});
