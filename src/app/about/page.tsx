import type { Metadata } from "next";
import AboutUnderConstruction from "@/components/about/AboutUnderConstruction";
import AboutJsonLd from "@/components/about/AboutJsonLd";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/about",
  "Om ArbeidMatch | Bemanning og rekruttering fra EU/EEA",
  "ArbeidMatch er et norsk bemanningsbyrå spesialisert på EU/EEA-arbeidere. Vi leverer pre-screene kandidater til norske bedrifter. Basert i Ranheim, Trondheim.",
);

export default function AboutPage() {
  return (
    <>
      <AboutJsonLd />
      <AboutUnderConstruction />
    </>
  );
}
