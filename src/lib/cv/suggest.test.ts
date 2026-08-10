import { describe, expect, it } from "vitest";
import { SAMPLE_CV } from "@/lib/cv/fixtures/sample-cv";
import { findTrade, fixTypos, suggestBullet, suggestSkill, suggestSummary } from "@/lib/cv/suggest";
import type { CvDocument } from "@/lib/cv/schema";

const base: CvDocument = SAMPLE_CV;

describe("trade detection", () => {
  it("finds the trade from the headline", () => {
    expect(findTrade("Tiler / Flislegger")?.id).toBe("tiler");
    expect(findTrade("Sudor")?.id).toBe("welder");
    expect(findTrade("Warehouse operative, forklift")?.id).toBe("forklift-warehouse");
  });

  it("returns null for a trade the library does not cover", () => {
    expect(findTrade("Actuary")).toBeNull();
  });
});

describe("summary suggestions", () => {
  it("leads with the job title and the years of experience", () => {
    const doc = { ...base, summary: "i am tiler with 9 years experience. hard working and fast learner." };
    const suggestion = suggestSummary(doc);

    expect(suggestion).not.toBeNull();
    expect(suggestion?.text.startsWith("Tiler with ")).toBe(true);
    expect(suggestion?.text).not.toMatch(/hard working|fast learner/i);
    expect(suggestion?.text.length).toBeLessThanOrEqual(800);
  });

  it("explains what it changed", () => {
    const doc = { ...base, summary: "i am a tiler, team player" };
    const suggestion = suggestSummary(doc);
    expect(suggestion?.notes.length).toBeGreaterThan(0);
  });
});

describe("spelling", () => {
  it("fixes the misspellings and the words cut short", () => {
    const result = fixTypos("I am a carpender with 20 yeas experie on constructin sites");
    expect(result.text).toBe("I am a carpenter with 20 years experience on construction sites");
    expect(result.fixed.length).toBe(4);
  });

  it("leaves correct words and real words that start a longer one alone", () => {
    expect(fixTypos("Certificate for machine and scaffold work").fixed).toEqual([]);
  });

  it("keeps the capital letter that was typed", () => {
    expect(fixTypos("Experiance in Constuction").text).toBe("Experience in Construction");
  });

  it("corrects the summary and says which words it changed", () => {
    const doc = { ...base, summary: "I am a carpender with 20 yeas experie" };
    const suggestion = suggestSummary(doc);

    expect(suggestion?.text).not.toMatch(/yeas|experie\b|carpender/);
    expect(suggestion?.text).toMatch(/experience/i);
    expect(suggestion?.notes.join(" ")).toMatch(/Corrected spelling/i);
  });

  it("drops the first person the field help asks candidates to avoid", () => {
    const doc = { ...base, summary: "I am a carpenter and i have 20 years experience" };
    expect(suggestSummary(doc)?.text).not.toMatch(/\bI\b/);
  });

  it("finds the trade in the summary when the headline does not name it", () => {
    const doc = {
      ...base,
      personal: { ...base.personal, headline: "Test example" },
      experience: [],
      summary: "I am a carpender with 20 yeas experie",
    };
    const suggestion = suggestSummary(doc);
    expect(suggestion?.text.length).toBeGreaterThan(60);
    expect(suggestion?.text).toMatch(/formwork|framing|drawings/i);
  });
});

describe("bullet suggestions", () => {
  it("turns a weak opener into an action verb", () => {
    const suggestion = suggestBullet("responsible for tiling bathrooms", base);
    expect(suggestion?.text).toBe("Tiling bathrooms.");
    expect(suggestion?.notes.join(" ")).toMatch(/action verb/i);
  });

  it("rewrites a gerund into the past tense", () => {
    const suggestion = suggestBullet("installing floor tiles in 40 apartments", base);
    expect(suggestion?.text).toBe("Installed floor tiles in 40 apartments.");
  });

  it("capitalises the personal pronoun and closes the sentence", () => {
    const suggestion = suggestBullet("i cleaned the site every evening", base);
    expect(suggestion?.text).toMatch(/^I cleaned/);
    expect(suggestion?.text.endsWith(".")).toBe(true);
  });

  it("asks for a number when the bullet has none", () => {
    const suggestion = suggestBullet("Installed tiles in bathrooms", base);
    expect(suggestion?.notes.join(" ")).toMatch(/Add a number/i);
  });

  it("offers a model bullet when the field is empty", () => {
    const doc: CvDocument = {
      ...base,
      experience: [{ ...base.experience[0], bullets: ["", ""] }],
    };
    const suggestion = suggestBullet("", doc, 0);
    expect(suggestion?.text.length).toBeGreaterThan(20);
  });

  it("never exceeds the bullet length limit", () => {
    const long = `responsible for ${"tiling bathrooms and corridors ".repeat(20)}`;
    const suggestion = suggestBullet(long, base);
    expect((suggestion?.text.length ?? 0) <= 220).toBe(true);
  });
});

describe("skill normalisation", () => {
  it("maps what candidates type to what employers search for", () => {
    expect(suggestSkill("tiles")?.text).toBe("Wall and floor tiling");
    expect(suggestSkill("hms")?.text).toBe("HSE card (HMS-kort)");
    expect(suggestSkill("forklift")?.text).toBe("Forklift operation (truckforerbevis)");
    expect(suggestSkill("welding mig")?.text).toBe("MIG welding");
  });

  it("leaves an already correct skill alone", () => {
    expect(suggestSkill("Wall and floor tiling")).toBeNull();
  });
});
