import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { legalRequestPrefill } from "@/lib/legalRequestPrefill";
import { LEGAL_REQUEST_WORDS } from "@/lib/legalRequestWords";
import { fillPublicDpaText } from "@/lib/publicDpaFill";
import { LEGAL_HUB_ENTRIES, SITE_POLICIES, STAFFING_REGISTER_URL } from "@/lib/sitePolicies";

const root = path.resolve(__dirname, "..", "..");
const source = (rel: string) => readFileSync(path.join(root, rel), "utf8");
const policies = Object.values(SITE_POLICIES);
const allText = JSON.stringify(SITE_POLICIES);

describe("the public policies written on the site (ORDER 424)", () => {
  it("each has a route, a version, a date and both languages with the same sections", () => {
    for (const p of policies) {
      expect(existsSync(path.join(root, "src/app", p.path, "page.tsx"))).toBe(true);
      expect(p.version).toBeGreaterThanOrEqual(1);
      expect(p.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.text.no.sections.length).toBe(p.text.en.sections.length);
      expect(p.text.no.title).not.toBe(p.text.en.title);
    }
  });

  it("names no supplier, tool, mailbox or person, and carries no long dash", () => {
    expect(allText).not.toMatch(/openai|anthropic|claude|gpt|gemini|recman|supabase|vercel|google|meta platforms/i);
    expect(allText).not.toMatch(/post@|legal@|support@/);
    expect(allText).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`));
  });

  it("claims no certification, audit or annual account", () => {
    expect(allText).not.toMatch(/revidert arbeidsgiver|sertifisert|certified|ISO \d/i);
    expect(SITE_POLICIES.transparencyAct.text.no.sections[0].blocks.join(" ")).toContain("frivillig");
  });

  it("links only to pages that exist on the site", () => {
    const internal = [...allText.matchAll(/\]\((\/[^)?#\s]*)/g)].map((m) => m[1]);
    expect(internal.length).toBeGreaterThan(0);
    for (const href of internal) {
      expect(existsSync(path.join(root, "src/app", href, "page.tsx")), href).toBe(true);
    }
  });

  it("the hub lists every policy, and the footer links the hub and the register", () => {
    const hrefs = LEGAL_HUB_ENTRIES.map((e) => e.href);
    for (const p of policies) expect(hrefs).toContain(p.path);
    for (const old of ["/privacy", "/terms", "/cookies", "/dpa"]) expect(hrefs).toContain(old);
    const footer = source("src/components/site/SiteFooter.tsx");
    expect(footer).toContain("SITE_PATHS.legal");
    expect(footer).toContain("href={STAFFING_REGISTER_URL}");
    expect(STAFFING_REGISTER_URL).toMatch(/^https:\/\/www\.arbeidstilsynet\.no\/.*935667089$/);
  });

  it("every kind a policy opens the form on is a request type of the form", () => {
    const types = LEGAL_REQUEST_WORDS.en.requestTypes.map((t) => t.value);
    for (const kind of ["complaint", "transparency", "ai", "whistleblowing"]) {
      expect(allText + source("src/app/legal/page.tsx")).toContain(kind);
      const prefill = legalRequestPrefill({ kind });
      expect(prefill.requestType && types.includes(prefill.requestType), kind).toBe(true);
    }
  });

  it("the sitemap lists the hub and the policies", () => {
    const sitemap = source("src/app/sitemap.ts");
    expect(sitemap).toContain("/legal");
    expect(sitemap).toContain("SITE_POLICIES");
  });
});

describe("the public DPA", () => {
  it("fills our own details from the register and shows the partner's fields as labels", () => {
    const out = fillPublicDpaText(
      "Processor: ArbeidMatch Norge AS, org. nr. {{PROCESSOR_ORG_NUMBER}}, {{PROCESSOR_REGISTERED_ADDRESS}}. Controller: {{PARTNER_COMPANY_LEGAL_NAME}}",
    );
    expect(out).toContain("org. nr. 935 667 089, Sverre Svendsens veg 38, 7056 Ranheim, Norway");
    expect(out).toContain("[partner company legal name]");
    expect(out).not.toMatch(/\{\{/);
  });
});
