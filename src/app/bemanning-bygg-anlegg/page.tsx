import type { Metadata } from "next";
import BreadcrumbByggAnleggJsonLd from "@/components/seo/BreadcrumbByggAnleggJsonLd";
import BemanningByggAnleggNb from "@/components/seo-pages/BemanningByggAnleggNb";

export const metadata: Metadata = {
  title: "Construction and Site Staffing | ArbeidMatch",
  description:
    "Construction staffing in Norway with qualified EU/EEA workers. Request screened candidates for building and site projects.",
};

export default function BemanningByggAnleggPage() {
  return (
    <>
      <BreadcrumbByggAnleggJsonLd />
      <BemanningByggAnleggNb />
    </>
  );
}
