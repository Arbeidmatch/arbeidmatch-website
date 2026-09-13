import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const HEADER_FILES = [
  "src/components/BrandMark.tsx",
  "src/components/Navbar.tsx",
  "src/components/home/HomeNavigation.tsx",
  "src/components/MobileDrawerContent.tsx",
];

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("site header brand", () => {
  it("uses the same transparent A emblem in every header", () => {
    expect(source("src/components/BrandMark.tsx")).toContain("/brand/arbeidmatch-a-emblem.png");
    expect(source("src/components/Navbar.tsx")).toContain(`<BrandMark href="/" logoSize={34} />`);
    expect(source("src/components/home/HomeNavigation.tsx")).toContain(`<BrandMark href={no ? "/no" : "/"} logoSize={34} />`);
    expect(source("src/components/MobileDrawerContent.tsx")).toContain(`<BrandMark href="/" logoSize={36}`);
  });

  it("does not put Norge back in the navigation brand", () => {
    const navSource = HEADER_FILES.map(source).join("\n");
    expect(navSource).toContain("ArbeidMatch");
    expect(navSource).toContain("BETA");
    expect(navSource).not.toContain("ArbeidMatch Norge");
    expect(navSource).not.toContain(">Norge<");
  });
});
