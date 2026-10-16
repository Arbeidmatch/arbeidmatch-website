import type { Metadata } from "next";

import { langForPath } from "@/lib/pageLang";

const SITE = "https://www.arbeidmatch.no";

/** The share picture a page without its own gets (16 October 2026: nine pages had none). */
export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const OG_LOCALE = { nb: "nb_NO", en: "en_GB", ro: "ro_RO", pl: "pl_PL" } as const;

function canonicalPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE}${p}`;
}

/**
 * Page SEO bundle: canonical, Open Graph, Twitter.
 * Use `title.absolute` so layout title template does not append "| ArbeidMatch" twice.
 */
export function nbPageMetadata(path: string, titleAbsolute: string, description: string): Metadata {
  const canonical = canonicalPath(path);
  return {
    title: { absolute: titleAbsolute },
    description,
    // No language alternates (his decision, 16 October 2026): they pointed every
    // page at the /en, /ro and /pl front pages, which are not translations of
    // it, and /en is noindex. Add them per page when a real translation exists.
    alternates: { canonical },
    openGraph: {
      title: titleAbsolute,
      description,
      // The language the page is written in: an English page said nb_NO.
      locale: OG_LOCALE[langForPath(path)],
      siteName: "ArbeidMatch",
      type: "website",
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: titleAbsolute,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}
