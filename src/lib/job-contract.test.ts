import { describe, expect, it } from "vitest";
import { applyNextStep, contractLabel, hiringModelLabel } from "./job-contract";

describe("job contract copy", () => {
  it.each([
    // REPAIR R46, 4 October 2026: this answered the Norwegian word "Fast" in
    // the English facts panel. The Norwegian wording belongs in the Norsk block.
    ["permanent", "Permanent"],
    ["permanent · full-time", "Permanent"],
    ["fast", "Permanent"],
    ["temporary", "Temporary"],
    ["contract · full-time", "Temporary"],
    ["substitute", "Vikariat"],
    ["seasonal", "Seasonal"],
  ])("formats %s", (value, expected) => expect(contractLabel(value)).toBe(expected));

  it("keeps contract type separate from who employs", () => {
    expect(hiringModelLabel("staffing")).toBe("ArbeidMatch employs you directly (Bemanning)");
    expect(hiringModelLabel("recruitment")).toBe("The client employs you; ArbeidMatch recruits (Recruitment)");
  });
});

describe("what happens after Apply", () => {
  it("tells a bemanning applicant that ArbeidMatch is the employer", () => {
    const said = applyNextStep("staffing");
    expect(said).toContain("ArbeidMatch is your employer");
    // The recruitment promise must not reach a bemanning advert: no client picks here.
    expect(said).not.toContain("If selected");
  });

  it("keeps the client's decision in the sentence for a recruitment advert", () => {
    expect(applyNextStep("recruitment")).toBe(
      "We review your application with the client. If selected, we contact you to arrange an interview.",
    );
  });

  it("promises neither when the ATS has not said which it is", () => {
    const said = applyNextStep(null);
    expect(said).not.toContain("client");
    expect(said).not.toContain("employer");
    expect(said).toContain("next step");
  });
});
