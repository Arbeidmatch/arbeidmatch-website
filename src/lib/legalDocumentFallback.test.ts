import { describe, expect, it } from "vitest";

import { TODAY_NUMBERS } from "@/test/numbers";
import { LEGAL_CONTACT_EMAIL, SEED_PRIVACY_MD, SEED_TERMS_MD, legalSeedMarkdown } from "./legal-seed-documents-data";
import { resolveLegalDocument } from "./legalDocumentFallback";

/** Legal review, 25 September 2026: an unreachable platform never publishes an old local text. */
describe("legal document fallback", () => {
  const published = {
    name: "Privacy Notice",
    content_html: "<p>Published.</p>",
    content_md: "",
    version: 7,
    updated_at: "2026-09-20T10:00:00Z",
  };

  it("uses the published document whenever the platform answers", () => {
    expect(resolveLegalDocument(published, "privacy-notice", "Privacy Notice")).toBe(published);
  });

  it("falls back only to the neutral stand-in, never to an old policy", () => {
    const standIn = resolveLegalDocument(null, "tos-platform", "Terms of Service");
    expect(standIn.version).toBe("local-fallback");
    expect(standIn.updated_at).toBe("");
    expect(standIn.content_html).toBe("");
    expect(standIn.content_md).toBe(legalSeedMarkdown("Terms of Service"));
  });

  it("keeps the stand-in free of policy: identity, unavailable, and where to write", () => {
    // ORDER 302: the org number is RecOS's; the constants are built before any number is read.
    expect(legalSeedMarkdown("Cookie Policy", TODAY_NUMBERS)).toMatch(/ArbeidMatch Norge AS, organisation number 935 667 089 MVA/);
    for (const md of [SEED_PRIVACY_MD, SEED_TERMS_MD, legalSeedMarkdown("Cookie Policy", TODAY_NUMBERS)]) {
      expect(md).toMatch(/^# .+\n\nArbeidMatch Norge AS, /);
      expect(md).toMatch(/temporarily unavailable/);
      expect(md).toContain(LEGAL_CONTACT_EMAIL);
      expect(md).not.toMatch(/Last updated|retain|retention|permanent|Supabase|Vercel|Google|Stripe|legal@|support@/i);
      expect(md.length).toBeLessThan(400);
    }
  });
});
