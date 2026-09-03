import { describe, expect, it } from "vitest";
import { slugify } from "./jobs-facets";

describe("slugify", () => {
  it("keeps the Norwegian letters readable", () => {
    // A plain normalise pass deletes ø entirely, because ø is a letter in its
    // own right and not o with a mark on it. "Strommen" is findable; "strmmen"
    // is a 404 that looks like a typo.
    expect(slugify("Strømmen")).toBe("strommen");
    expect(slugify("Ålesund")).toBe("alesund");
    expect(slugify("Tromsø")).toBe("tromso");
    expect(slugify("Møre og Romsdal")).toBe("more-og-romsdal");
  });

  it("makes one slug out of a trade name", () => {
    expect(slugify("Car mechanic")).toBe("car-mechanic");
    expect(slugify("Concrete worker")).toBe("concrete-worker");
    expect(slugify("Building and civil works")).toBe("building-and-civil-works");
  });

  it("leaves nothing dangling at either end", () => {
    expect(slugify("  Bergen  ")).toBe("bergen");
    expect(slugify("Bergen & Haugesund")).toBe("bergen-haugesund");
  });
});
