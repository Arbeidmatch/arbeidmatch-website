import { describe, expect, it } from "vitest";

import { formatOrgNumber, isValidOrgNumber, normalizeOrgNumber } from "./orgNumber";

describe("organisation number", () => {
  it("accepts a real number, with or without spaces", () => {
    expect(isValidOrgNumber("935667089")).toBe(true);
    expect(isValidOrgNumber("935 667 089")).toBe(true);
    expect(normalizeOrgNumber(" 935 667 089 ")).toBe("935667089");
  });

  it("refuses a wrong check digit, the wrong length and letters", () => {
    expect(isValidOrgNumber("935667088")).toBe(false);
    expect(isValidOrgNumber("93566708")).toBe(false);
    expect(isValidOrgNumber("9356670891")).toBe(false);
    expect(isValidOrgNumber("93566708A")).toBe(false);
    expect(isValidOrgNumber("")).toBe(false);
  });

  it("prints in groups of three", () => {
    expect(formatOrgNumber("935667089")).toBe("935 667 089");
  });
});
