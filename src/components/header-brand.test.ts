import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The old Navbar, HomeNavigation, MobileDrawerContent and BrandMark gave way to the site header (ORDER 295).
const HEADER_FILES = ["src/components/site/SiteHeader.tsx"];

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("site header brand", () => {
  it("uses the transparent A emblem in the header", () => {
    expect(source("src/components/site/SiteHeader.tsx")).toContain("/brand/arbeidmatch-a-emblem.png");
  });

  it("does not put Norge back in the navigation brand", () => {
    const navSource = HEADER_FILES.map(source).join("\n");
    expect(navSource).toContain("ArbeidMatch");
    expect(navSource).toContain("BETA");
    expect(navSource).not.toContain("ArbeidMatch Norge");
    expect(navSource).not.toContain(">Norge<");
  });
});
