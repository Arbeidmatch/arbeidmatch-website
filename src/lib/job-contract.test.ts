import { describe, expect, it } from "vitest";
import { contractLabel, hiringModelLabel } from "./job-contract";

describe("job contract copy", () => {
  it.each([
    ["permanent", "Fast"],
    ["permanent · full-time", "Fast"],
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
