import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { nbPageMetadata } from "@/lib/nbPageMetadata";
import { SEED_TERMS_MD } from "@/lib/legal-seed-documents-data";

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
  const doc = await fetchAtsLegalDocument("tos-platform");
  if (!doc) {
    return (
      <AtsLegalDocumentPage
        doc={{
          name: "Terms of Service",
          content_html: "",
          content_md: SEED_TERMS_MD,
          version: "local-fallback",
          updated_at: "2026-05-04T00:00:00.000Z",
        }}
      />
    );
  }
  return <AtsLegalDocumentPage doc={doc} />;
}
