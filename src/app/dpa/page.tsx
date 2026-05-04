import type { Metadata } from "next";

import { AtsLegalDocumentFallback, AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
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
  const doc = await fetchAtsLegalDocument("dpa-recruiter");
  if (!doc) return <AtsLegalDocumentFallback />;
  return <AtsLegalDocumentPage doc={doc} />;
}
