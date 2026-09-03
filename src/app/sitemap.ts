import type { MetadataRoute } from "next";

import { PREMIUM_ARTICLE_SLUGS } from "@/lib/premium/articleSlugs";
import { facetPath, listFacets } from "@/lib/jobs-facets";

const SITE = "https://www.arbeidmatch.no";

/** lastmod for homepage + primary commercial URLs (task spec: “today”) */
const primaryLastMod = new Date("2026-04-19T12:00:00.000Z");
const stableLastMod = new Date("2026-01-15T12:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /**
   * The job pages, from the live board.
   *
   * Not a hand-written list: the set changes every time a posting opens or
   * closes, and a sitemap naming a page that has since 404'd is worse than one
   * that names fewer. `listFacets` only returns combinations that currently
   * hold adverts, which is the same list the routes are generated from.
   *
   * Never fatal. A sitemap that cannot reach the ATS still has to answer, with
   * everything else in it, rather than 500 and take the whole file out of use.
   */
  const jobPages = await listFacets()
    .then((facets) =>
      facets.map((facet) => ({
        url: `${SITE}${facetPath(facet)}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    )
    .catch(() => []);

  return [
    {
      url: `${SITE}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...jobPages,
    {
      url: `${SITE}/`,
      lastModified: primaryLastMod,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Service / conversion pages (0.9, monthly)
    ...[
      "/for-employers",
      "/for-candidates",
      "/for-staffing-agencies",
      "/recruiter-network",
      "/partners",
      "/bemanning-bygg-anlegg",
      "/bemanning-logistikk",
      "/bemanning-industri",
      "/bemanning-renhold",
      "/bemanning-horeca",
    ].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["/about", "/contact", "/outside-eu-eea"].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Location landing pages (0.8, monthly)
    ...[
      "/bemanningsbyrå-trondheim",
      "/bemanningsbyrå-bergen",
      "/bemanningsbyrå-stavanger",
      "/bemanningsbyrå-kristiansand",
    ].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE}/welding-specialists`,
      lastModified: new Date("2026-04-19"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE}/electricians-norway`,
      lastModified: new Date("2026-04-19"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE}/blog`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE}/blog/ansette-utenlandske-arbeidere-lovlig`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly",
      priority: 0.68,
    },
    {
      url: `${SITE}/premium`,
      lastModified: primaryLastMod,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    ...PREMIUM_ARTICLE_SLUGS.map((slug) => ({
      url: `${SITE}/premium/article/${slug}`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${SITE}/privacy`,
      lastModified: stableLastMod,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE}/terms`,
      lastModified: stableLastMod,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE}/dpa`,
      lastModified: stableLastMod,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
