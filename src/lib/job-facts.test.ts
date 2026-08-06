import { describe, it, expect } from "vitest";
import { jobFacts, type PublicJob } from "./jobs-fetch";

/**
 * What a card is allowed to say.
 *
 * He looked at twelve cards on 6 August 2026 and said the obvious thing: the lines
 * repeated. They did, because hiding the rate had left a constant sentence in its
 * place. These assertions are the rule that replaced it - only what differs, never
 * the same fact twice, and nothing at all rather than filler.
 */
const base: PublicJob = {
  id: "1",
  title: "Bricklayer",
  category: "Construction",
  location: "Trondheim",
  country: "Norway",
  hourly_rate_offer: 297,
  salary_fixed: null,
  salary_range_min: null,
  salary_range_max: null,
  salary_mode: null,
  accommodation_provided: false,
  rotation: null,
  shift_type: null,
  required_driver_licenses: null,
  public_applies: null,
  public_slug: "bricklayer-trondheim",
  public_show_company: false,
  external_image_url: null,
  published_at: null,
  created_at: null,
};

const now = new Date("2026-08-06T12:00:00.000Z");

describe("jobFacts", () => {
  it("says nothing when the posting carries nothing that differs", () => {
    expect(jobFacts(base, now)).toEqual([]);
  });

  it("never shows more than three, so a row of cards stays level", () => {
    const job: PublicJob = {
      ...base,
      rotation: "4 weeks on / 2 off",
      accommodation_provided: true,
      shift_type: "night",
      required_driver_licenses: ["B", "C"],
      public_applies: 11,
      published_at: "2026-08-04T00:00:00.000Z",
    };
    const facts = jobFacts(job, now);
    expect(facts).toHaveLength(3);
    // Ordered by what a tradesman decides on: the rotation first, then the roof over
    // his head, then the shift.
    expect(facts[0]).toBe("4 weeks on / 2 off");
    expect(facts[1]).toBe("Help with accommodation");
    expect(facts[2]).toBe("night");
  });

  it("does not say accommodation twice", () => {
    const facts = jobFacts({ ...base, accommodation_provided: true }, now);
    expect(facts.filter((f) => /accommodation/i.test(f))).toHaveLength(1);
  });

  it("keeps a long rotation from breaking the card", () => {
    const facts = jobFacts({ ...base, rotation: "six weeks on and three weeks off, flights paid" }, now);
    expect(facts[0]?.length).toBeLessThanOrEqual(28);
  });

  it("counts applications only once they are evidence", () => {
    expect(jobFacts({ ...base, public_applies: 2 }, now)).toEqual([]);
    expect(jobFacts({ ...base, public_applies: 3 }, now)).toEqual(["3 have applied"]);
  });

  it("calls a posting new for its first week and not after", () => {
    expect(jobFacts({ ...base, published_at: "2026-08-02T00:00:00.000Z" }, now)).toEqual(["New this week"]);
    expect(jobFacts({ ...base, published_at: "2026-07-20T00:00:00.000Z" }, now)).toEqual([]);
  });

  it("ignores an ordinary day shift, which is not a fact worth a chip", () => {
    expect(jobFacts({ ...base, shift_type: "day" }, now)).toEqual([]);
    expect(jobFacts({ ...base, shift_type: "Day" }, now)).toEqual([]);
  });
});
