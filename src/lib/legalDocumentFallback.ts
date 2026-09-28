import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { legalSeedMarkdown } from "@/lib/legal-seed-documents-data";

/**
 * When the platform does not hand over a legal document (legal review,
 * 25 September 2026, approved by the owner): never an old local policy.
 *
 * The legal pages render per request (dynamic = "force-dynamic"). They used to
 * be static with a revalidate window, and the Vercel build cannot reach
 * ats.arbeidmatch.no, so every deploy baked the stand-in below into the page
 * and the site showed "temporarily unavailable" until a visitor happened to
 * trigger the first revalidation. Seen by him on 28 September 2026 as a
 * privacy page that "changes by itself".
 *
 * The last good text is now kept by fetchAtsLegalDocument's own data cache:
 * Next.js stores only 200 answers and keeps serving the stale one when a
 * background refresh fails, so a platform hiccup does not replace the
 * published text. Only when the platform is down and nothing was ever cached
 * does the page show the neutral stand-in in legal-seed-documents-data.ts:
 * who we are, that the document is temporarily unavailable, and where to write.
 */
export function resolveLegalDocument(
  fetched: AtsLegalDocumentJson | null,
  slug: string,
  title: string,
): AtsLegalDocumentJson {
  if (fetched) return fetched;
  console.error(`[legal] "${slug}" could not be fetched from the platform; showing the stand-in.`);
  return {
    name: title,
    content_html: "",
    content_md: legalSeedMarkdown(title),
    version: "local-fallback",
    // No date: the stand-in is not a version of the document.
    updated_at: "",
  };
}
