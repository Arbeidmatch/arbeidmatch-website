import type { Metadata } from "next";

import { LegalDocumentPage, LegalDocumentUnavailable } from "@/components/legal/LegalDocumentPage";
import { getLegalDocument } from "@/lib/legal-documents";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const revalidate = 300;

const TITLE = "Data Processing Agreement | ArbeidMatch";
const DESCRIPTION =
  "Standard data processing terms for partners and clients of ArbeidMatch under GDPR.";

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
  const doc = await getLegalDocument("dpa");
  if (!doc) return <LegalDocumentUnavailable />;
  return <LegalDocumentPage doc={doc} />;
}
