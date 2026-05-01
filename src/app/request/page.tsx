import type { Metadata } from "next";
import { Suspense } from "react";

import RequestPageClient from "./RequestPageClient";

const TITLE = "Request Candidates | ArbeidMatch";
const DESCRIPTION =
  "Submit your staffing request and get pre-screened EU/EEA candidates for your Norwegian business.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RequestPage() {
  return (
    <Suspense fallback={null}>
      <RequestPageClient />
    </Suspense>
  );
}
