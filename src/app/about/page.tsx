import type { Metadata } from "next";

import AboutJsonLd from "@/components/about/AboutJsonLd";
import About from "@/components/site/about/About";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const URL = "https://www.arbeidmatch.no/about";
const base = nbPageMetadata(
  "/about",
  "About ArbeidMatch | EU/EEA workforce for Norway",
  "ArbeidMatch connects qualified EU/EEA workers with Norwegian employers in construction, logistics, industry and more. Based in Trondheim.",
);

export const metadata: Metadata = { ...base, alternates: { canonical: URL, languages: { en: URL, "x-default": URL } } };

/** About in the approved design (ORDER 295, stage 6). */
export default function AboutPage() {
  return (
    <>
      <AboutJsonLd />
      <About />
    </>
  );
}
