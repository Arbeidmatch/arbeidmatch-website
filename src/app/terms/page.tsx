import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { nbPageMetadata } from "@/lib/nbPageMetadata";
import { resolveLegalDocument } from "@/lib/legalDocumentFallback";

export const revalidate = 60;

const TITLE = "Terms of Service | ArbeidMatch";
const DESCRIPTION = "Terms of service for ArbeidMatch Norge AS, governing use of arbeidmatch.no.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const base = nbPageMetadata("/terms", TITLE, DESCRIPTION);

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

export default async function TermsPage() {
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const doc = resolveLegalDocument(await fetchAtsLegalDocument("tos-platform"), "tos-platform", "Terms of Service");
  return <AtsLegalDocumentPage doc={doc} />;
}
