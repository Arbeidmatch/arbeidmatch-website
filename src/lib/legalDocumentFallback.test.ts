import { describe, expect, it } from "vitest";

import { LEGAL_CONTACT_EMAIL, SEED_PRIVACY_MD, SEED_TERMS_MD, legalSeedMarkdown } from "./legal-seed-documents-data";
import { LegalDocumentUnavailableError, legalFallbackAllowed, resolveLegalDocument } from "./legalDocumentFallback";

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
    expect(resolveLegalDocument(published, "privacy-notice", "Privacy Notice", { NODE_ENV: "production" })).toBe(published);
  });

  it("throws at request or revalidation time, so the last good page stays up", () => {
    expect(() => resolveLegalDocument(null, "privacy-notice", "Privacy Notice", { NODE_ENV: "production" })).toThrow(
      LegalDocumentUnavailableError,
    );
    expect(legalFallbackAllowed({ NODE_ENV: "production", NEXT_PHASE: "phase-production-server" })).toBe(false);
  });

  it("uses the neutral stand-in only during a build, or on the dev server", () => {
    const built = resolveLegalDocument(null, "tos-platform", "Terms of Service", {
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
    });
    expect(built.version).toBe("local-fallback");
    expect(built.updated_at).toBe("");
    expect(built.content_md).toBe(legalSeedMarkdown("Terms of Service"));
    expect(legalFallbackAllowed({ NODE_ENV: "development" })).toBe(true);
  });

  it("keeps the stand-in free of policy: identity, unavailable, and where to write", () => {
    for (const md of [SEED_PRIVACY_MD, SEED_TERMS_MD, legalSeedMarkdown("Cookie Policy")]) {
      expect(md).toMatch(/ArbeidMatch Norge AS, organisation number 935 667 089 MVA/);
      expect(md).toMatch(/temporarily unavailable/);
      expect(md).toContain(LEGAL_CONTACT_EMAIL);
      expect(md).not.toMatch(/Last updated|retain|retention|permanent|Supabase|Vercel|Google|Stripe|legal@|support@/i);
      expect(md.length).toBeLessThan(400);
    }
  });
});
