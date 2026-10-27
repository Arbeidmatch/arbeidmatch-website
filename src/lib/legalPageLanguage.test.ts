import { describe, expect, it, vi } from "vitest";

import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { legalLanguageHref, loadLegalPage, parseLegalLanguage } from "@/lib/legalPageLanguage";

const doc = (name: string): AtsLegalDocumentJson => ({ name, content_html: "<p>x</p>", content_md: "", version: 1, updated_at: "" });

describe("legal page language", () => {
  it("is Norwegian unless English is asked for", () => {
    expect(parseLegalLanguage(undefined)).toBe("no");
    expect(parseLegalLanguage("de")).toBe("no");
    expect(parseLegalLanguage("en")).toBe("en");
    expect(parseLegalLanguage(["EN"])).toBe("en");
    expect(legalLanguageHref("/privacy", "en")).toBe("/privacy?lang=en");
  });

  it("shows the Norwegian text when the platform has it", async () => {
    const fetch = vi.fn(async (l: "no" | "en") => doc(l));
    const page = await loadLegalPage({ slug: "privacy-notice", title: "Privacy Notice", requested: "no", fetch });
    expect(page).toMatchObject({ shown: "no", norwegianPending: false });
    expect(page.doc.name).toBe("no");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows English under a pending note, not a 404 and not an old text, when Norwegian is missing", async () => {
    const fetch = vi.fn(async (l: "no" | "en") => (l === "en" ? doc("en") : null));
    const page = await loadLegalPage({ slug: "privacy-notice", title: "Privacy Notice", requested: "no", fetch });
    expect(page).toMatchObject({ shown: "en", norwegianPending: true });
    expect(page.doc.name).toBe("en");
  });

  it("asks for English once and does not borrow Norwegian for it", async () => {
    const fetch = vi.fn(async (l: "no" | "en") => (l === "no" ? doc("no") : null));
    const page = await loadLegalPage({ slug: "tos-platform", title: "Terms of Service", requested: "en", fetch });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(page.shown).toBe("en");
    expect(page.norwegianPending).toBe(false);
    expect(page.doc.version).toBe("local-fallback");
  });

  it("falls back to the neutral stand-in only when nothing at all can be fetched", async () => {
    const page = await loadLegalPage({ slug: "cookie-policy", title: "Cookie Policy", requested: "no", fetch: async () => null });
    expect(page.doc.version).toBe("local-fallback");
    expect(page.norwegianPending).toBe(true);
  });
});
