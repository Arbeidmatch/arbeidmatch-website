import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { resolveLegalDocument } from "@/lib/legalDocumentFallback";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const revalidate = 300;

const TITLE = "Data Processing Agreement | ArbeidMatch";
const DESCRIPTION = "Data processing terms for ArbeidMatch Norge AS and recruitment partners.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const base = nbPageMetadata("/dpa", TITLE, DESCRIPTION);

export const metadata: Metadata = {
  ...base,
  robots: { index: true, follow: true },
  openGraph: {
    ...base.openGraph,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    ...base.twitter,
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default async function DpaPage() {
  // "dpa-recruiter" from 4 May 2026 until 23 September 2026. The row has always
  // been called "dpa-recruiter-partner", so this page served nothing but
  // "Document not currently available" for the whole of that time.
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const doc = resolveLegalDocument(await fetchAtsLegalDocument("dpa-recruiter-partner"), "dpa-recruiter-partner", "Data Processing Agreement");
  return <AtsLegalDocumentPage doc={doc} />;
}
