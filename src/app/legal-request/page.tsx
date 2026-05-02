import type { Metadata } from "next";

import LegalRequestForm from "./LegalRequestForm";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const TITLE = "Legal Request | ArbeidMatch";
const DESCRIPTION = "Submit a GDPR rights request or legal inquiry to ArbeidMatch Norge AS.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const base = nbPageMetadata("/legal-request", TITLE, DESCRIPTION);

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

export default function LegalRequestPage() {
  return <LegalRequestForm />;
}
