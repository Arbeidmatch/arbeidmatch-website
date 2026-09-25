import { describe, expect, it } from "vitest";

import { SIGNUP_ABOVE_LIST_BELOW, signupPlacement } from "./jobs-signup-placement";

describe("signupPlacement", () => {
  it("puts the section above a list of fewer than ten jobs", () => {
    for (const n of [0, 1, 2, 9]) expect(signupPlacement(n)).toBe("above");
  });

  it("puts the section after a list of ten or more", () => {
    for (const n of [10, 11, 50, 300]) expect(signupPlacement(n)).toBe("below");
  });

  it("turns at exactly ten", () => {
    expect(SIGNUP_ABOVE_LIST_BELOW).toBe(10);
    expect(signupPlacement(SIGNUP_ABOVE_LIST_BELOW - 1)).toBe("above");
    expect(signupPlacement(SIGNUP_ABOVE_LIST_BELOW)).toBe("below");
  });
});
