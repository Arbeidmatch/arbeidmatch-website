import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { LEGAL_REQUEST_WORDS } from "@/lib/legalRequestWords";

const root = path.resolve(__dirname, "..", "..");
const source = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("the legal request form in Norsk and English", () => {
  it("stores one vocabulary: both languages carry the same request types and identity methods", () => {
    const values = (list: readonly { value: string }[]) => list.map((o) => o.value);
    expect(values(LEGAL_REQUEST_WORDS.no.requestTypes)).toEqual(values(LEGAL_REQUEST_WORDS.en.requestTypes));
    expect(values(LEGAL_REQUEST_WORDS.no.identityMethods)).toEqual(values(LEGAL_REQUEST_WORDS.en.identityMethods));
    expect(LEGAL_REQUEST_WORDS.en.requestTypes[0].value).toBe("GDPR Access (Art. 15)");
  });

  it("has a Norwegian word for every English one", () => {
    expect(Object.keys(LEGAL_REQUEST_WORDS.no).sort()).toEqual(Object.keys(LEGAL_REQUEST_WORDS.en).sort());
    expect(LEGAL_REQUEST_WORDS.no.title).not.toBe(LEGAL_REQUEST_WORDS.en.title);
  });

  it("shows no mailbox to the reader, in either language", () => {
    expect(JSON.stringify(LEGAL_REQUEST_WORDS)).not.toMatch(/post@|legal@|support@/);
    expect(source("src/app/legal-request/LegalRequestForm.tsx")).not.toMatch(/post@|legal@/);
  });

  it("reads ?lang on the page and defaults to Norwegian", () => {
    const page = source("src/app/legal-request/page.tsx");
    expect(page).toContain("parseLegalLanguage((await searchParams).lang)");
    expect(page).toContain("LegalLanguageSwitch");
  });
});
