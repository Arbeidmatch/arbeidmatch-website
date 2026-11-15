import type { Metadata } from "next";

import ForBedrifter from "@/components/site/firms/ForBedrifter";

const TITLE = "Arbeidskraft fra EU/EØS til norske bedrifter | ArbeidMatch";
const DESCRIPTION =
  "Forhåndskontrollerte fagfolk fra EU/EØS til bygg og anlegg, logistikk og industri i Norge. Send en bemanningsforespørsel til ArbeidMatch.";

export const metadata: Metadata = {
  alternates: { canonical: "/for-employers", languages: { "nb-NO": "https://www.arbeidmatch.no/for-employers", "x-default": "https://www.arbeidmatch.no/for-employers" } },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: "/for-employers",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch | Rekruttering fra EU/EØS til Norge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

/** For bedrifter, rebuilt from the mockup approved on 15 November 2026 (ORDER 295, stage 2). */
export default function ForEmployersPage() {
  return <ForBedrifter />;
}
