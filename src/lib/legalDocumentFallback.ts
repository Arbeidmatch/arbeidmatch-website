import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { legalSeedMarkdown } from "@/lib/legal-seed-documents-data";

/**
 * When the platform does not hand over a legal document (legal review,
 * 25 September 2026, approved by the owner).
 *
 * At request or revalidation time the page throws. The legal pages are static
 * with a revalidate window, and Next.js keeps serving the last successfully
 * generated page when a revalidation throws, so a platform hiccup can never
 * replace the published text with anything else.
 *
 * Only while the site is being built, when there is no earlier page to keep,
 * does the page fall back, and then only to the neutral stand-in in
 * legal-seed-documents-data.ts: who we are, that the document is temporarily
 * unavailable, and where to write. Never an old policy. The dev server may use
 * it too, so a local page without the platform still opens.
 */

export class LegalDocumentUnavailableError extends Error {
  constructor(slug: string) {
    super(`Legal document "${slug}" could not be fetched; keeping the last published page.`);
    this.name = "LegalDocumentUnavailableError";
  }
}

type Env = { NEXT_PHASE?: string; NODE_ENV?: string };

export function legalFallbackAllowed(env: Env = process.env): boolean {
  return env.NEXT_PHASE === "phase-production-build" || env.NODE_ENV !== "production";
}

export function resolveLegalDocument(
  fetched: AtsLegalDocumentJson | null,
  slug: string,
  title: string,
  env: Env = process.env,
): AtsLegalDocumentJson {
  if (fetched) return fetched;
  if (!legalFallbackAllowed(env)) throw new LegalDocumentUnavailableError(slug);
  return {
    name: title,
    content_html: "",
    content_md: legalSeedMarkdown(title),
    version: "local-fallback",
    // No date: the stand-in is not a version of the document.
    updated_at: "",
  };
}
