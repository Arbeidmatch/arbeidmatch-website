import { describe, expect, it } from "vitest";
import { canonicalFacetPath, slugify } from "./jobs-facets";

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

describe("canonicalFacetPath", () => {
  it("sends a Norwegian trade word to the English page", () => {
    // Measured live on 3 September 2026: /jobs/electrician answered and
    // /jobs/elektriker was a 404, on a site whose own service pages are called
    // bemanning-bygg-anlegg. A Norwegian searching in Norwegian landed nowhere.
    expect(canonicalFacetPath(["elektriker"])).toBe("/jobs/electrician");
    expect(canonicalFacetPath(["murer"])).toBe("/jobs/bricklayer");
    expect(canonicalFacetPath(["betongarbeider"])).toBe("/jobs/concrete-worker");
    expect(canonicalFacetPath(["bilmekaniker"])).toBe("/jobs/car-mechanic");
  });

  it("reads the Norwegian letters, however the browser encoded them", () => {
    expect(canonicalFacetPath(["tømrer"])).toBe("/jobs/carpenter");
    expect(canonicalFacetPath(["t%C3%B8mrer"])).toBe("/jobs/carpenter");
    // %F8 is a latin-1 ø: a valid escape that is not valid UTF-8. It used to
    // throw out of decodeURIComponent and return 500 rather than a page.
    expect(canonicalFacetPath(["t%F8mrer"])).toBe("/jobs/carpenter");
    expect(canonicalFacetPath(["rørlegger"])).toBe("/jobs/plumber");
    expect(canonicalFacetPath(["sjåfør"])).toBe("/jobs/driver");
  });

  it("sends every plasterboard word to the one English page", () => {
    // "gipser" was the only Norwegian word listed for this trade, and it is
    // the one nobody types. The searches are "regips" and "gipsmontør".
    expect(canonicalFacetPath(["regips"])).toBe("/jobs/plasterer");
    expect(canonicalFacetPath(["gips"])).toBe("/jobs/plasterer");
    expect(canonicalFacetPath(["gipsmontør"])).toBe("/jobs/plasterer");
    expect(canonicalFacetPath(["gipsmontor"])).toBe("/jobs/plasterer");
    expect(canonicalFacetPath(["gipsplater"])).toBe("/jobs/plasterer");
    expect(canonicalFacetPath(["regips", "oslo"])).toBe("/jobs/plasterer/oslo");
  });

  it("carries the town through, because that is the search people run", () => {
    expect(canonicalFacetPath(["elektriker", "stavanger"])).toBe("/jobs/electrician/stavanger");
    expect(canonicalFacetPath(["tømrer", "bergen"])).toBe("/jobs/carpenter/bergen");
  });

  it("says nothing about a word that is not a Norwegian trade", () => {
    // A town, an English slug, or a made-up word is not this function's
    // business: it must not manufacture a redirect target that does not exist.
    expect(canonicalFacetPath(["bergen"])).toBeNull();
    expect(canonicalFacetPath(["electrician"])).toBeNull();
    expect(canonicalFacetPath(["banana"])).toBeNull();
    expect(canonicalFacetPath([])).toBeNull();
    expect(canonicalFacetPath(["a", "b", "c"])).toBeNull();
  });

  it("does not throw on a URL nobody could decode", () => {
    // A malformed escape is a page we do not have, not a crash. /jobs/abc%
    // and /jobs/%%% are both requests a crawler will make sooner or later.
    expect(() => canonicalFacetPath(["abc%"])).not.toThrow();
    expect(() => canonicalFacetPath(["%%%"])).not.toThrow();
    expect(canonicalFacetPath(["%%%"])).toBeNull();
  });
});
