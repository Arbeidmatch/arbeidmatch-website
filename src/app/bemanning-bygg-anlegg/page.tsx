import type { Metadata } from "next";
import BreadcrumbByggAnleggJsonLd from "@/components/seo/BreadcrumbByggAnleggJsonLd";
import BemanningByggAnleggNb from "@/components/seo-pages/BemanningByggAnleggNb";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/bemanning-bygg-anlegg",
  "Bemanning bygg og anlegg – fagarbeidere | ArbeidMatch",
  "Bemanning bygg med utenlandske byggearbeidere og EU arbeidskraft. Rekruttering anlegg og fagarbeidere bygg Norge – ta kontakt for behovsavklaring.",
);

export default function BemanningByggAnleggPage() {
  return (
    <>
      <BreadcrumbByggAnleggJsonLd />
      <BemanningByggAnleggNb />
    </>
  );
}
