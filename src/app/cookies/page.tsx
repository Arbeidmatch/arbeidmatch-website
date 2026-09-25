import type { Metadata } from "next";

import { AtsLegalDocumentPage } from "@/components/legal/AtsLegalDocumentPage";
import { fetchAtsLegalDocument } from "@/lib/atsLegalDocument";
import { resolveLegalDocument } from "@/lib/legalDocumentFallback";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const revalidate = 300;

const TITLE = "Cookie Policy | ArbeidMatch";
const DESCRIPTION = "What arbeidmatch.no stores on your device: essential only, no advertising, no profiling.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const base = nbPageMetadata("/cookies", TITLE, DESCRIPTION);

export const metadata: Metadata = {
  ...base,
  robots: { index: true, follow: true },
  openGraph: { ...base.openGraph, title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
  twitter: { ...base.twitter, title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
};

/**
 * One declaration, two hosts.
 *
 * This page had its own hand-written text for a day, which is how this company
 * ended up with a Flislegger privacy notice that disagrees with the main one.
 * The words and the tables now come from the platform, which is where the
 * cookies themselves are defined: ats-recruitment/src/lib/legal/cookie-declaration.ts,
 * served through the same public legal route this site already uses for the
 * Privacy Notice and the Terms. The two pages cannot drift apart because there
 * is only one text.
 */
export default async function CookiePolicyPage() {
  // Never an old local text: see resolveLegalDocument (legal review, 25 September 2026).
  const doc = resolveLegalDocument(await fetchAtsLegalDocument("cookie-policy"), "cookie-policy", "Cookie Policy");
  return <AtsLegalDocumentPage doc={doc} />;
}
