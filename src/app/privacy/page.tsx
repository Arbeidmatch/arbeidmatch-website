import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { nbPageMetadata } from "@/lib/nbPageMetadata";
import { resolveLegalDocument } from "@/lib/legalDocumentFallback";

export const revalidate = 60;

const TITLE = "Privacy Policy | ArbeidMatch";
const DESCRIPTION =
  "How ArbeidMatch Norge AS collects, processes, and protects personal data under GDPR and Norwegian law.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const base = nbPageMetadata("/privacy", TITLE, DESCRIPTION);

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

export default async function PrivacyPage() {
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const doc = resolveLegalDocument(await fetchAtsLegalDocument("privacy-notice"), "privacy-notice", "Privacy Notice");
  return <AtsLegalDocumentPage doc={doc} />;
}
