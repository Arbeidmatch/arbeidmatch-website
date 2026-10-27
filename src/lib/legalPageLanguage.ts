import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { resolveLegalDocument } from "@/lib/legalDocumentFallback";

/**
 * The language a public legal page (/privacy, /terms, /cookies) is read in.
 *
 * ?lang=no or ?lang=en, a plain link and no script. The site is Norwegian first,
 * so no query means Norwegian. The platform holds one row per language and the
 * Norwegian rows are written by the owner, not by an agent: until one exists the
 * page shows the English text under a "Norsk versjon kommer" line. Never a 404
 * and never an old local text standing in for the missing one.
 */

export type LegalLanguage = "no" | "en";

export const LEGAL_LANGUAGES: readonly LegalLanguage[] = ["no", "en"];

export const LEGAL_LANGUAGE_LABEL: Record<LegalLanguage, string> = { no: "Norsk", en: "English" };

export function parseLegalLanguage(raw: string | string[] | null | undefined): LegalLanguage {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  return value === "en" ? "en" : "no";
}

export type LegalPage = {
  doc: AtsLegalDocumentJson;
  requested: LegalLanguage;
  /** The language of the text on the page. */
  shown: LegalLanguage;
  /** Norwegian was asked for and the platform has no Norwegian text yet. */
  norwegianPending: boolean;
};

export async function loadLegalPage(args: {
  slug: string;
  title: string;
  requested: LegalLanguage;
  fetch: (language: LegalLanguage) => Promise<AtsLegalDocumentJson | null>;
}): Promise<LegalPage> {
  const { slug, title, requested } = args;
  const wanted = await args.fetch(requested);
  if (wanted) return { doc: wanted, requested, shown: requested, norwegianPending: false };

  // Asked for Norwegian, there is none: the English text, and a line saying so.
  // If English cannot be had either, the neutral stand-in (resolveLegalDocument).
  const english = requested === "no" ? await args.fetch("en") : null;
  if (english) return { doc: english, requested, shown: "en", norwegianPending: true };
  return { doc: resolveLegalDocument(null, slug, title), requested, shown: "en", norwegianPending: requested === "no" };
}

export function legalLanguageHref(path: string, language: LegalLanguage): string {
  return `${path}?lang=${language}`;
}
