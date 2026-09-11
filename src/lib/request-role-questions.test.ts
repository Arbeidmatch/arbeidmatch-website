import { describe, expect, it } from "vitest";
import {
  ALL_ROLE_DETAIL_LABELS,
  ALL_TRADE_QUESTIONS,
  buildRoleDetails,
  collectLanguageTradeInvalid,
  collectServiceInvalid,
  EMPTY_ROLE_ANSWERS,
  getTradeQuestions,
  normalizeRoleAnswers,
  ROLE_QUESTION_INDUSTRIES,
  roleDetailsRequirementsBlock,
  staffingProjectName,
  TRADE_QUESTIONS,
} from "./request-role-questions";
import { RECRUITMENT_SAMPLE, STAFFING_SAMPLE } from "./request-role-questions.fixtures";

/**
 * Labels of the office letter the ATS intake already reads, and its section
 * headings. Its parser finds a label anywhere it follows whitespace, so a new
 * label containing one of these as a word would be read as that field.
 */
const EXISTING_LETTER_WORDS = [
  "Company",
  "Org.nr",
  "Email",
  "Full name",
  "Phone",
  "Category",
  "Position",
  "Contract type",
  "Qualification",
  "Candidates needed",
  "Certifications",
  "Urgency",
  "Salary period",
  "Salary",
  "Overtime",
  "Accommodation",
  "Transport",
  "Rotation",
  "Start date",
  "City",
  "Region",
  "Requirements",
  "Location",
  "Additional notes",
];

describe("trade questions", () => {
  it("has a set for every category the wizard offers", () => {
    for (const industry of ROLE_QUESTION_INDUSTRIES) {
      expect(TRADE_QUESTIONS[industry].questions.length, industry).toBeGreaterThan(0);
    }
  });

  it("keeps every set short: at most four questions, at most one required", () => {
    for (const set of Object.values(TRADE_QUESTIONS)) {
      for (const list of [set.questions, ...Object.values(set.byPosition ?? {})]) {
        expect(list.length).toBeLessThanOrEqual(4);
        expect(list.filter((q) => q.required).length).toBeLessThanOrEqual(1);
        expect(new Set(list.map((q) => q.id)).size).toBe(list.length);
      }
    }
  });

  it("gives every choice question its options", () => {
    for (const q of ALL_TRADE_QUESTIONS) {
      if (q.kind === "single" || q.kind === "multi") expect(q.options?.length, q.id).toBeGreaterThan(1);
    }
  });

  it("uses one meaning per id", () => {
    const byId = new Map<string, string>();
    for (const set of Object.values(TRADE_QUESTIONS)) {
      for (const list of [set.questions, ...Object.values(set.byPosition ?? {})]) {
        for (const q of list) {
          const seen = byId.get(q.id);
          if (seen) expect(seen, q.id).toBe(q.summaryLabel);
          byId.set(q.id, q.summaryLabel);
        }
      }
    }
  });

  it("asks a position its own questions where it has them", () => {
    expect(getTradeQuestions("Logistics", "Truck driver").map((q) => q.id)).toEqual(["ysk", "adr", "forklift"]);
    expect(getTradeQuestions("Logistics", "Warehouse worker").map((q) => q.id)).toEqual([
      "forklift",
      "truck_types",
      "warehouse_system",
    ]);
    expect(getTradeQuestions("Logistics", "Logistics coordinator")).toEqual([]);
    expect(getTradeQuestions("Welding and Metal", "CNC operator").map((q) => q.id)).toEqual(["fagbrev", "tech_drawings"]);
    expect(getTradeQuestions("Welding and Metal", "Some custom welder").map((q) => q.id)).toEqual([
      "welding_methods",
      "welding_cert",
      "materials",
    ]);
    expect(getTradeQuestions("Unknown", "Anything")).toEqual([]);
  });
});

describe("labels the ATS reads", () => {
  it("never contain a label of the existing letter as a word", () => {
    for (const label of ALL_ROLE_DETAIL_LABELS) {
      for (const word of EXISTING_LETTER_WORDS) {
        const re = new RegExp(`(^|\\s)${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|:|$)`, "i");
        expect(re.test(label), `"${label}" contains "${word}"`).toBe(false);
      }
    }
  });

  it("are unique, have no colon and no long dashes", () => {
    expect(new Set(ALL_ROLE_DETAIL_LABELS).size).toBe(ALL_ROLE_DETAIL_LABELS.length);
    for (const label of ALL_ROLE_DETAIL_LABELS) {
      expect(label).not.toMatch(/:/);
      expect(label).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`));
    }
  });

  it("cover every row buildRoleDetails can produce", () => {
    const labels = new Set(ALL_ROLE_DETAIL_LABELS);
    for (const [service, sample] of [
      ["staffing", STAFFING_SAMPLE],
      ["recruitment", RECRUITMENT_SAMPLE],
    ] as const) {
      for (const industry of ROLE_QUESTION_INDUSTRIES) {
        const trade: Record<string, string | string[]> = {};
        for (const q of ALL_TRADE_QUESTIONS) trade[q.id] = q.kind === "multi" ? [q.options![0]!] : q.kind === "text" ? "x" : "Yes";
        for (const row of buildRoleDetails({ service, industry, position: "", answers: { ...sample, trade } })) {
          expect(labels.has(row.label), row.label).toBe(true);
        }
      }
    }
  });
});

describe("validation", () => {
  it("requires the languages, and a reason when Norwegian must be good", () => {
    const empty = collectLanguageTradeInvalid("recruitment", "Cleaning", "Cleaner", EMPTY_ROLE_ANSWERS);
    expect([...empty].sort()).toEqual(["englishLevel", "norwegianLevel"]);
    const fluent = { ...EMPTY_ROLE_ANSWERS, norwegianLevel: "Fluent", englishLevel: "Basic" };
    expect([...collectLanguageTradeInvalid("staffing", "Cleaning", "Cleaner", fluent)]).toEqual(["norwegianReason"]);
    expect(
      collectLanguageTradeInvalid("staffing", "Cleaning", "Cleaner", { ...fluent, norwegianReason: "Customer contact" }).size,
    ).toBe(0);
  });

  it("requires the one required trade question and nothing optional", () => {
    const langs = { ...EMPTY_ROLE_ANSWERS, norwegianLevel: "Basic", englishLevel: "Basic" };
    expect([...collectLanguageTradeInvalid("staffing", "Electrical", "Electrician", langs)]).toEqual(["trade.dsb"]);
    expect(collectLanguageTradeInvalid("staffing", "Logistics", "Truck driver", langs).size).toBe(0);
  });

  it("asks nothing of a service this wizard no longer runs", () => {
    expect(collectLanguageTradeInvalid("advertising", "Electrical", "Electrician", EMPTY_ROLE_ANSWERS).size).toBe(0);
    expect(collectServiceInvalid("advertising", EMPTY_ROLE_ANSWERS).size).toBe(0);
  });

  it("requires the staffing assignment, with the shift pattern optional", () => {
    expect([...collectServiceInvalid("staffing", EMPTY_ROLE_ANSWERS)].sort()).toEqual(
      [
        "approverName",
        "approverPhone",
        "hoursPerWeek",
        "periodFrom",
        "periodTo",
        "ppeProvided",
        "worksiteCity",
        "worksitePostcode",
        "worksiteStreet",
      ].sort(),
    );
    expect(collectServiceInvalid("staffing", { ...STAFFING_SAMPLE, staffing: { ...STAFFING_SAMPLE.staffing, shiftPattern: [] } }).size).toBe(0);
  });

  it("needs an end date after the start unless the period is open-ended", () => {
    const s = { ...STAFFING_SAMPLE.staffing, periodOpenEnded: false, periodTo: "2026-10-01" };
    expect([...collectServiceInvalid("staffing", { ...STAFFING_SAMPLE, staffing: s })]).toEqual(["periodTo"]);
    expect(collectServiceInvalid("staffing", { ...STAFFING_SAMPLE, staffing: { ...s, periodTo: "2026-12-18" } }).size).toBe(0);
  });

  it("rejects hours outside 1 to 80 and a postcode that is not four digits", () => {
    const bad = { ...STAFFING_SAMPLE.staffing, hoursPerWeek: "120", worksitePostcode: "155" };
    expect([...collectServiceInvalid("staffing", { ...STAFFING_SAMPLE, staffing: bad })].sort()).toEqual(["hoursPerWeek", "worksitePostcode"]);
  });

  it("requires probation and interview rounds for recruitment, nothing else", () => {
    expect([...collectServiceInvalid("recruitment", EMPTY_ROLE_ANSWERS)].sort()).toEqual(["interviewRounds", "probation"]);
    expect(
      collectServiceInvalid("recruitment", {
        ...EMPTY_ROLE_ANSWERS,
        recruitment: { probation: "None", interviewer: "", interviewRounds: "1", hireBy: "" },
      }).size,
    ).toBe(0);
  });
});

describe("the Role details lines", () => {
  it("reads a staffing request in a fixed order", () => {
    const rows = buildRoleDetails({ service: "staffing", industry: "Electrical", position: "Electrician", answers: STAFFING_SAMPLE });
    expect(roleDetailsRequirementsBlock(rows)).toBe(
      [
        "Role details",
        "Norwegian at work: Good spoken",
        "Why Norwegian is needed: Safety briefings on site are in Norwegian",
        "English at work: Basic",
        "DSB authorisation required: Yes",
        "Type of electrical work: Installation, Service",
        "Worksite address: Storgata 12, 0155 Oslo",
        "Staffing project: Storgata 12 - Oslo - Bemanning",
        "Assignment period: From 2026-10-05, open-ended",
        "Hours per week: 37.5",
        "Shift pattern: Day, Night",
        "Hours approved on site by: Site Manager, +47 900 00 000",
        "Protective equipment provided by the client: Yes",
      ].join("\n"),
    );
  });

  it("reads a recruitment request, leaving out what was not asked or not answered", () => {
    const rows = buildRoleDetails({ service: "recruitment", industry: "Welding and Metal", position: "TIG welder", answers: RECRUITMENT_SAMPLE });
    expect(roleDetailsRequirementsBlock(rows)).toBe(
      [
        "Role details",
        "Norwegian at work: Not needed",
        "English at work: Good spoken",
        "Welding methods: MIG/MAG, TIG",
        "Welding certificate required: Yes",
        "Probation period: 6 months",
        "Interviewed by: Production manager",
        "Interview rounds: 2",
        "Hire needed by: 2026-11-02",
      ].join("\n"),
    );
  });

  it("says it in Romanian for Slack, with the trade's own words kept", () => {
    const rows = buildRoleDetails(
      { service: "staffing", industry: "Electrical", position: "Electrician", answers: STAFFING_SAMPLE },
      "ro",
    );
    expect(rows.slice(0, 4)).toEqual([
      { label: "Norvegiană la lucru", value: "Vorbește bine" },
      { label: "De ce e nevoie de norvegiană", value: "Safety briefings on site are in Norwegian" },
      { label: "Engleză la lucru", value: "De bază" },
      { label: "Autorizație DSB necesară", value: "Da" },
    ]);
    expect(rows.find((r) => r.label === "Perioada")?.value).toBe("De la 2026-10-05, pe durată nedeterminată");
  });

  it("ignores answers of another trade, another service, and anything unknown", () => {
    const answers = normalizeRoleAnswers({
      ...RECRUITMENT_SAMPLE,
      trade: { ...RECRUITMENT_SAMPLE.trade, dsb: "Yes", welding_methods: ["TIG", "Plasma"], nonsense: "x" },
      staffing: { ...STAFFING_SAMPLE.staffing },
      englishLevel: "Perfect",
    });
    expect(answers.trade).toEqual({ dsb: "Yes", welding_methods: ["TIG"], welding_cert: "Yes" });
    expect(answers.englishLevel).toBe("");
    const labels = buildRoleDetails({ service: "recruitment", industry: "Welding and Metal", position: "Welder", answers }).map((r) => r.label);
    expect(labels).not.toContain("DSB authorisation required");
    expect(labels).not.toContain("Worksite address");
  });

  it("prints nothing for job advertising or a missing service", () => {
    expect(buildRoleDetails({ service: "advertising", industry: "Electrical", position: "", answers: STAFFING_SAMPLE })).toEqual([]);
    expect(buildRoleDetails({ service: "", industry: "Electrical", position: "", answers: STAFFING_SAMPLE })).toEqual([]);
    expect(roleDetailsRequirementsBlock([])).toBe("");
  });

  it("does not trust the shape of what was posted", () => {
    expect(() => normalizeRoleAnswers(null)).not.toThrow();
    expect(() => normalizeRoleAnswers("x")).not.toThrow();
    expect(normalizeRoleAnswers({ staffing: { periodFrom: "2026-02-30", hoursPerWeek: 40 } }).staffing.periodFrom).toBe("");
  });

  it("names the staffing project from street and city", () => {
    expect(staffingProjectName("Storgata 12", "Oslo")).toBe("Storgata 12 - Oslo - Bemanning");
    expect(staffingProjectName("", "Oslo")).toBe("");
  });
});
