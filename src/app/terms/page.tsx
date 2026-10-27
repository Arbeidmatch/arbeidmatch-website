import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { loadLegalPage, parseLegalLanguage } from "@/lib/legalPageLanguage";
import { legalPageMetadata } from "@/lib/legalPageMetadata";

// Rendered per request: the Vercel build cannot reach the platform (see resolveLegalDocument).
export const dynamic = "force-dynamic";

const PATH = "/terms";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return legalPageMetadata(PATH, parseLegalLanguage((await searchParams).lang), {
    no: {
      title: "Vilkår | ArbeidMatch",
      description: "Vilkårene til ArbeidMatch Norge AS for bruk av arbeidmatch.no.",
    },
    en: {
      title: "Terms of Service | ArbeidMatch",
      description: "Terms of service for ArbeidMatch Norge AS, governing use of arbeidmatch.no.",
    },
  });
}

export default async function TermsPage({ searchParams }: Props) {
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const page = await loadLegalPage({
    slug: "tos-platform",
    title: "Terms of Service",
    requested: parseLegalLanguage((await searchParams).lang),
    fetch: (language) => fetchAtsLegalDocument("tos-platform", language),
  });
  return <AtsLegalDocumentPage doc={page.doc} language={{ path: PATH, page }} />;
}
