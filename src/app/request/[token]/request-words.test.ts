import { describe, expect, it } from "vitest";

import {
  ALL_ROLE_DETAIL_LABELS,
  ALL_TRADE_QUESTIONS,
  INTERVIEW_ROUND_OPTIONS,
  LANGUAGE_LEVELS,
  PROBATION_OPTIONS,
  ROLE_QUESTION_INDUSTRIES,
  SHIFT_PATTERNS,
  YES_NO,
} from "@/lib/request-role-questions";

import {
  fill,
  OPTION_NB,
  optionLabel,
  positionLabel,
  REQUEST_WORDS,
  requestLangFrom,
  ROLE_DETAIL_LABEL_NB,
  roleDetailRowLabel,
  SKILL_NB,
  TRADE_QUESTION_NB,
} from "./request-words";

// Built from code points: the repository rejects the characters themselves in source files.
const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);

function allNorwegianValues(): string[] {
  return [
    ...Object.values(REQUEST_WORDS.no),
    ...Object.values(OPTION_NB),
    ...Object.values(SKILL_NB),
    ...Object.values(ROLE_DETAIL_LABEL_NB),
    ...Object.values(TRADE_QUESTION_NB).flatMap((q) => [q.label, q.help ?? "", q.placeholder ?? ""]),
  ];
}

describe("request wizard words", () => {
  it("has the same keys in English and Norwegian", () => {
    expect(Object.keys(REQUEST_WORDS.no).sort()).toEqual(Object.keys(REQUEST_WORDS.en).sort());
  });

  it("leaves no Norwegian word empty", () => {
    for (const [key, value] of Object.entries(REQUEST_WORDS.no)) expect(value.trim(), key).not.toBe("");
  });

  it("has no en or em dash in any Norwegian text", () => {
    for (const value of allNorwegianValues()) {
      expect(value.includes(EN_DASH), value).toBe(false);
      expect(value.includes(EM_DASH), value).toBe(false);
    }
  });

  it("keeps the English words the site's visitors have always read", () => {
    expect(REQUEST_WORDS.en.fieldRequired).toBe("This field is required");
    expect(REQUEST_WORDS.en.continue).toBe("Continue →");
    expect(fill(REQUEST_WORDS.en.stepOf, { n: 2, total: 6 })).toBe("Step 2 of 6");
  });

  it("translates every option the wizard shows from the shared question lists", () => {
    const shown = [
      ...ROLE_QUESTION_INDUSTRIES,
      ...YES_NO,
      ...LANGUAGE_LEVELS,
      ...SHIFT_PATTERNS,
      ...PROBATION_OPTIONS,
      ...ALL_TRADE_QUESTIONS.flatMap((q) => q.options ?? []),
    ];
    for (const value of shown) expect(OPTION_NB[value], value).toBeTruthy();
    // Interview rounds are numbers and read the same in both languages.
    for (const value of INTERVIEW_ROUND_OPTIONS) expect(optionLabel("no", value)).toBe(value);
  });

  it("has Norwegian for every trade question and every role detail label", () => {
    for (const q of ALL_TRADE_QUESTIONS) expect(TRADE_QUESTION_NB[q.id]?.label, q.id).toBeTruthy();
    for (const label of ALL_ROLE_DETAIL_LABELS) expect(ROLE_DETAIL_LABEL_NB[label], label).toBeTruthy();
  });

  it("changes only the label, never the value, and leaves English untouched", () => {
    expect(optionLabel("en", "Immediate")).toBe("Immediate");
    expect(optionLabel("no", "Immediate")).toBe("Snarest");
    expect(positionLabel("en", "Carpenter")).toBe("Carpenter");
    expect(positionLabel("no", "Carpenter")).toBe("Tømrer");
    expect(positionLabel("no", "Other")).toBe("Annet");
    // Something the client typed himself stays as he wrote it.
    expect(optionLabel("no", "Takrenner i kobber")).toBe("Takrenner i kobber");
  });

  it("reads the role detail rows back in Norwegian without touching what was typed", () => {
    expect(roleDetailRowLabel("no", { label: "Shift pattern", value: "Day, Night" })).toEqual({
      label: "Skiftordning",
      value: "Dag, Natt",
    });
    expect(roleDetailRowLabel("no", { label: "Assignment period", value: "2026-10-01 to 2026-12-31" })).toEqual({
      label: "Oppdragsperiode",
      value: "2026-10-01 til 2026-12-31",
    });
    expect(roleDetailRowLabel("no", { label: "Interviewed by", value: "None of us" })).toEqual({
      label: "Intervjues av",
      value: "None of us",
    });
    const row = { label: "Shift pattern", value: "Day" };
    expect(roleDetailRowLabel("en", row)).toBe(row);
  });
});

describe("requestLangFrom", () => {
  const deck = "0f8c2b1e-3d4a-4b5c-8d9e-0a1b2c3d4e5f";

  it("is Norwegian for a client who came from a presentation", () => {
    expect(requestLangFrom({ presentationTicket: true, source: null, deck: null })).toBe("no");
    expect(requestLangFrom({ presentationTicket: false, source: null, deck })).toBe("no");
    expect(requestLangFrom({ presentationTicket: false, source: "presentation", deck: null })).toBe("no");
  });

  it("stays English for everyone who came from the site", () => {
    expect(requestLangFrom({ presentationTicket: false, source: null, deck: null })).toBe("en");
    expect(requestLangFrom({ presentationTicket: false, source: "site", deck: "not-a-uuid" })).toBe("en");
  });
});
