import type { Metadata } from "next";
import BreadcrumbByggAnleggJsonLd from "@/components/seo/BreadcrumbByggAnleggJsonLd";
import BemanningByggAnleggNb from "@/components/seo-pages/BemanningByggAnleggNb";

const TITLE = "Bemanning bygg og anlegg | ArbeidMatch";
const DESCRIPTION =
  "Bemanning til bygg og anlegg i Norge med kvalifiserte arbeidstakere fra EU/EØS. Be om kontrollerte kandidater til bygge- og anleggsprosjekter.";

export const metadata: Metadata = {
  alternates: { canonical: "/bemanning-bygg-anlegg" },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: "/bemanning-bygg-anlegg",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch | Rekruttering fra EU/EØS til Norge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function BemanningByggAnleggPage() {
  return (
    <>
      <BreadcrumbByggAnleggJsonLd />
      <BemanningByggAnleggNb />
    </>
  );
}
