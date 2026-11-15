import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANDIDATE_TABS, hasOwnShell, hidesFooter, isCandidatePath, pageAction, siteLang } from "./siteNav";

const SITE_DIR = join(process.cwd(), "src", "components", "site");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

describe("the shared shell (ORDER 295)", () => {
  it("speaks the page's language", () => {
    expect(siteLang("/")).toBe("no");
    expect(siteLang("/for-employers")).toBe("no");
    expect(siteLang("/prosjekter")).toBe("no");
    expect(siteLang("/for-candidates")).toBe("en");
    expect(siteLang("/jobs")).toBe("en");
  });

  it("puts the candidate tab row on candidate pages only", () => {
    expect(isCandidatePath("/for-candidates")).toBe(true);
    expect(isCandidatePath("/jobs")).toBe(true);
    expect(isCandidatePath("/stilling/murer-trondheim")).toBe(true);
    expect(isCandidatePath("/for-employers")).toBe(false);
    expect(isCandidatePath("/")).toBe(false);
    expect(CANDIDATE_TABS.map((t) => t.label)).toEqual(["Overview", "Open jobs", "Life in Norway", "Questions", "Support"]);
  });

  it("gives each page at most one header action, and the front page none", () => {
    expect(pageAction("/")).toBeNull();
    expect(pageAction("/for-employers")).toMatchObject({ label: "Be om kandidater", href: "/request", rask: true });
    expect(pageAction("/prosjekter")).toMatchObject({ label: "Be om invitasjon", href: "#tilgang" });
    expect(pageAction("/for-candidates")).toMatchObject({ href: "/jobs" });
  });

  it("leaves the shells of their own alone and keeps the footer off the signed-in screens", () => {
    expect(hasOwnShell("/flislegger")).toBe(true);
    expect(hasOwnShell("/min-side/123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(hidesFooter("/cv")).toBe(true);
    expect(hidesFooter("/prosjekter/abc")).toBe(true);
    expect(hidesFooter("/prosjekter")).toBe(false);
    expect(hidesFooter("/for-employers")).toBe(false);
    expect(hidesFooter("/jobs")).toBe(false);
  });
});

describe("every sheet that collects anything about a person links the privacy notice", () => {
  // The row kinds themselves (rows.tsx) are building blocks, not sheets.
  const sheetFiles = files(join(SITE_DIR, "sheet")).filter((f) => !/rows.tsx$|SheetFrame|SheetHost/.test(f));
  // Split into one block per exported sheet component.
  const sheets = sheetFiles.flatMap((file) =>
    readFileSync(file, "utf8")
      .split(/\nexport function /)
      .slice(1)
      .map((body) => ({ name: body.slice(0, body.indexOf("(")), body })),
  );

  it("finds the sheets", () => {
    expect(sheets.map((s) => s.name)).toEqual(expect.arrayContaining(["LoginSheet", "MenuSheet", "CookiesSheet", "NotifySheet"]));
  });

  for (const sheet of sheets) {
    const collects = /<InputRow|<AreaRow|<input|<textarea/.test(sheet.body);
    if (!collects) continue;
    it(`${sheet.name} has the privacy switch and a link to /privacy`, () => {
      expect(sheet.body).toMatch(/<PrivacySwitch/);
      expect(sheet.body).toMatch(/SITE_PATHS\.privacy|href="\/privacy"/);
    });
  }

  it("the privacy switch's words are a link to /privacy in a new tab", () => {
    const rows = readFileSync(join(SITE_DIR, "sheet", "rows.tsx"), "utf8");
    const block = rows.slice(rows.indexOf("export function PrivacySwitch"));
    expect(block).toMatch(/href=\{SITE_PATHS\.privacy\} target="_blank"/);
    expect(block).toMatch(/personvernerklæringen/);
    expect(block).toMatch(/privacy notice/);
  });
});

describe("no public shell component gives an e-mail address for questions", () => {
  it("contains no written e-mail address", () => {
    for (const file of files(SITE_DIR)) {
      const text = readFileSync(file, "utf8").replace(/placeholder="[^"]*"/g, "");
      expect(text, file).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/);
      expect(text, file).not.toMatch(/mailto:/);
    }
  });
});
