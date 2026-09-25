import { describe, expect, it } from "vitest";

import { dedupeLegalHtmlLead, dedupeLegalMarkdownLead, isSameLegalTitle } from "./legalDocumentLead";
import { SEED_PRIVACY_MD, SEED_TERMS_MD } from "./legal-seed-documents-data";

/** One title and one date on a legal page (the owner, 25 September 2026). */
describe("legal document lead", () => {
  it("treats a heading as the page title case-insensitively, and when one contains the other", () => {
    expect(isSameLegalTitle("Privacy Notice", "privacy notice ")).toBe(true);
    expect(isSameLegalTitle("Terms of Service", "Platform Terms of Service")).toBe(true);
    expect(isSameLegalTitle("DATA PROCESSING AGREEMENT", "Data Processing Agreement - Recruiter Partner")).toBe(true);
    expect(isSameLegalTitle("1. Who we are", "Privacy Notice")).toBe(false);
  });

  it("drops the stand-in's own title, and the stand-in carries no date", () => {
    const lead = dedupeLegalMarkdownLead(SEED_PRIVACY_MD, "Privacy Notice");
    expect(lead.lastUpdatedFromContent).toBeNull();
    expect(lead.body.startsWith("ArbeidMatch Norge AS")).toBe(true);
    expect(lead.body).not.toMatch(/^# Privacy Notice/m);
    const terms = dedupeLegalMarkdownLead(SEED_TERMS_MD, "Terms of Service");
    expect(terms.lastUpdatedFromContent).toBeNull();
    expect(terms.body).toMatch(/temporarily unavailable/);
  });

  it("keeps a first heading that is not the title", () => {
    const md = "# Something else\n\nText.";
    expect(dedupeLegalMarkdownLead(md, "Privacy Notice")).toEqual({ body: md, lastUpdatedFromContent: null });
  });

  it("drops a repeated <h1> inside <article>, keeping the wrapper", () => {
    const lead = dedupeLegalHtmlLead("<article>\n<h1>Privacy Notice</h1>\n<p>Effective date.</p></article>", "Privacy Notice");
    expect(lead.body).toBe("<article><p>Effective date.</p></article>");
  });

  it("drops a repeated <h1> behind a <header> and empty paragraphs", () => {
    const html = '<article class="x"><header><h1 style="a">DATA PROCESSING AGREEMENT</h1><p>Between:</p></header></article>';
    const lead = dedupeLegalHtmlLead(html, "Data Processing Agreement - Recruiter Partner");
    expect(lead.body).toBe('<article class="x"><header><p>Between:</p></header></article>');
    const tos = dedupeLegalHtmlLead("<h1>Terms of Service</h1><p></p><p></p><h2>1. About</h2>", "Platform Terms of Service");
    expect(tos.body).toBe("<h2>1. About</h2>");
  });

  it("drops a leading Last updated paragraph and returns its date", () => {
    const lead = dedupeLegalHtmlLead("<h1>Cookie Policy</h1><p><em>Last updated: 23 September 2026</em></p><p>Body.</p>", "Cookie Policy");
    expect(lead).toEqual({ body: "<p>Body.</p>", lastUpdatedFromContent: "23 September 2026" });
  });

  it("leaves a document without a title or date alone", () => {
    const html = "<p>Signing in needs cookies.</p><h1>Cookie Policy</h1>";
    expect(dedupeLegalHtmlLead(html, "Cookie Policy")).toEqual({ body: html, lastUpdatedFromContent: null });
  });
});
