import type { Metadata } from "next";
import Presentation from "@/components/home/Presentation";

const TITLE = "Bemanning og rekruttering i Norge | ArbeidMatch";
const DESCRIPTION =
  "Trenger bedriften fagfolk? ArbeidMatch hjelper med bemanning og rekruttering innen bygg, bil og verksted, industri og elektro. Send en gratis forespørsel.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | Bemanning og rekruttering i Norge",
} as const;

export const metadata: Metadata = {
  // Absolute: the layout's "%s | ArbeidMatch" would print the brand twice.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: "https://www.arbeidmatch.no/",
    languages: { "nb-NO": "https://www.arbeidmatch.no/", "x-default": "https://www.arbeidmatch.no/" },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    url: "https://www.arbeidmatch.no/",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return <Presentation />;
}
