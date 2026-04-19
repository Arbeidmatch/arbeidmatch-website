import type { Metadata } from "next";

const SITE = "https://www.arbeidmatch.no";

function canonicalPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE}${p}`;
}

/**
 * Norwegian page SEO bundle: canonical, hreflang stubs (en/ro/pl roots), Open Graph, Twitter.
 * Use `title.absolute` so layout title template does not append "| ArbeidMatch" twice.
 */
export function nbPageMetadata(path: string, titleAbsolute: string, description: string): Metadata {
  const canonical = canonicalPath(path);
  return {
    title: { absolute: titleAbsolute },
    description,
    alternates: {
      canonical,
      languages: {
        nb: canonical,
        en: `${SITE}/en`,
        ro: `${SITE}/ro`,
        pl: `${SITE}/pl`,
      },
    },
    openGraph: {
      title: titleAbsolute,
      description,
      locale: "nb_NO",
      siteName: "ArbeidMatch",
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: titleAbsolute,
      description,
    },
  };
}
