import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import AboutStats from "@/components/about/AboutStats";
import AboutMission from "@/components/about/AboutMission";
import AboutCompanyFacts from "@/components/about/AboutCompanyFacts";
import AboutValues from "@/components/about/AboutValues";
import AboutTimeline from "@/components/about/AboutTimeline";
import AboutCta from "@/components/about/AboutCta";
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
      <AboutHero />
      <AboutStats />
      <AboutMission />
      <AboutCompanyFacts />
      <AboutValues />
      <AboutTimeline />
      <AboutCta />
    </>
  );
}
