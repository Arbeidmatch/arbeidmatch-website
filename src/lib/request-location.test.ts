import { describe, expect, it } from "vitest";

import { addTypedLocation, listedPlace, normalizePlaceName, PLACE_MAX_LENGTH } from "@/lib/request-location";

const LIST = ["Oslo", "Bergen", "Harstad"];

describe("normalizePlaceName", () => {
  it("keeps any Norwegian place as typed, trimmed", () => {
    expect(normalizePlaceName("  Myre ")).toBe("Myre");
    expect(normalizePlaceName("Øksnes")).toBe("Øksnes");
    expect(normalizePlaceName("Mo  i   Rana")).toBe("Mo i Rana");
  });

  it("refuses markup and input without a letter", () => {
    expect(normalizePlaceName("<b>Myre</b>")).toBe("");
    expect(normalizePlaceName("1234")).toBe("");
    expect(normalizePlaceName("   ")).toBe("");
    expect(normalizePlaceName(null)).toBe("");
  });

  it("cuts an over-long name", () => {
    expect(normalizePlaceName("A".repeat(200))).toHaveLength(PLACE_MAX_LENGTH);
  });
});

describe("addTypedLocation", () => {
  it("adds a place that is not on the list", () => {
    expect(addTypedLocation([], "Myre", LIST)).toEqual(["Myre"]);
    expect(addTypedLocation(["Oslo"], " Myre ", LIST)).toEqual(["Oslo", "Myre"]);
  });

  it("uses the list's spelling for a listed town", () => {
    expect(addTypedLocation([], "harstad", LIST)).toEqual(["Harstad"]);
    expect(listedPlace("BERGEN", LIST)).toBe("Bergen");
  });

  it("never adds the same place twice or unusable input", () => {
    expect(addTypedLocation(["Myre"], "myre", LIST)).toEqual(["Myre"]);
    expect(addTypedLocation(["Oslo"], "<script>", LIST)).toEqual(["Oslo"]);
  });
});
