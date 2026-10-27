import type { Metadata } from "next";

import { legalLanguageHref, type LegalLanguage } from "@/lib/legalPageLanguage";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const SITE = "https://www.arbeidmatch.no";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

type Text = { title: string; description: string };

/**
 * Metadata of a page offered in Norsk and English: the title and description in
 * the language asked for, a canonical per language, and hreflang no / en that
 * point at the two links of the switch. Norwegian is the default, so its
 * canonical is the bare path.
 */
export function legalPageMetadata(path: string, language: LegalLanguage, text: Record<LegalLanguage, Text>): Metadata {
  const { title, description } = text[language];
  const base = nbPageMetadata(path, title, description);
  return {
    ...base,
    alternates: {
      canonical: language === "no" ? `${SITE}${path}` : `${SITE}${legalLanguageHref(path, "en")}`,
      languages: {
        no: `${SITE}${path}`,
        en: `${SITE}${legalLanguageHref(path, "en")}`,
        "x-default": `${SITE}${path}`,
      },
    },
    robots: { index: true, follow: true },
    openGraph: { ...base.openGraph, locale: language === "no" ? "nb_NO" : "en_GB", title, description, images: [OG_IMAGE] },
    twitter: { ...base.twitter, title, description, images: ["/og-image.png"] },
  };
}
