import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { loadLegalPage, parseLegalLanguage } from "@/lib/legalPageLanguage";
import { legalPageMetadata } from "@/lib/legalPageMetadata";

// Rendered per request: the Vercel build cannot reach the platform (see resolveLegalDocument).
export const dynamic = "force-dynamic";

const PATH = "/cookies";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return legalPageMetadata(PATH, parseLegalLanguage((await searchParams).lang), {
    no: {
      title: "Informasjonskapsler | ArbeidMatch",
      description: "Hva arbeidmatch.no lagrer på enheten din.",
    },
    en: {
      title: "Cookie Policy | ArbeidMatch",
      description: "What arbeidmatch.no stores on your device: essential only, no advertising, no profiling.",
    },
  });
}

/**
 * One declaration, two hosts.
 *
 * This page had its own hand-written text for a day, which is how this company
 * ended up with a Flislegger privacy notice that disagrees with the main one.
 * The words and the tables now come from the platform, which is where the
 * cookies themselves are defined: ats-recruitment/src/lib/legal/cookie-declaration.ts,
 * served through the same public legal route this site already uses for the
 * Privacy Notice and the Terms. The two pages cannot drift apart because there
 * is only one text. The Norwegian declaration is added there when the owner
 * supplies it; until then this page shows the English text under "Norsk versjon
 * kommer".
 */
export default async function CookiePolicyPage({ searchParams }: Props) {
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const page = await loadLegalPage({
    slug: "cookie-policy",
    title: "Cookie Policy",
    requested: parseLegalLanguage((await searchParams).lang),
    fetch: (language) => fetchAtsLegalDocument("cookie-policy", language),
  });
  return <AtsLegalDocumentPage doc={page.doc} language={{ path: PATH, page }} />;
}
