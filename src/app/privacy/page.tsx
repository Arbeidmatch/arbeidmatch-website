import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { loadLegalPage, parseLegalLanguage } from "@/lib/legalPageLanguage";
import { legalPageMetadata } from "@/lib/legalPageMetadata";

// Rendered per request: the Vercel build cannot reach the platform (see resolveLegalDocument).
export const dynamic = "force-dynamic";

const PATH = "/privacy";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return legalPageMetadata(PATH, parseLegalLanguage((await searchParams).lang), {
    no: {
      title: "Personvernerklæring | ArbeidMatch",
      description: "Personvernerklæringen til ArbeidMatch Norge AS.",
    },
    en: {
      title: "Privacy Policy | ArbeidMatch",
      description: "How ArbeidMatch Norge AS collects, processes, and protects personal data under GDPR and Norwegian law.",
    },
  });
}

export default async function PrivacyPage({ searchParams }: Props) {
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const page = await loadLegalPage({
    slug: "privacy-notice",
    title: "Privacy Notice",
    requested: parseLegalLanguage((await searchParams).lang),
    fetch: (language) => fetchAtsLegalDocument("privacy-notice", language),
  });
  return <AtsLegalDocumentPage doc={page.doc} language={{ path: PATH, page }} />;
}
