import type { MetadataRoute } from "next";

import { PREMIUM_ARTICLE_SLUGS } from "@/lib/premium/articleSlugs";

const SITE = "https://www.arbeidmatch.no";

/** lastmod for homepage + primary commercial URLs (task spec: today) */
const primaryLastMod = new Date("2026-04-19T12:00:00.000Z");
const stableLastMod = new Date("2026-01-15T12:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
      "/dsb-support",
      "/dsb-assistance",
      "/recruiter-network",
      "/partners",
      "/bemanning-bygg-anlegg",
      "/bemanning-logistikk",
      "/bemanning-industri",
      "/bemanning-renhold",
      "/bemanning-horeca",
      "/bemanning-helse",
    ].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: primaryLastMod,
      changeFrequency: "monthly" as const,
      priority: path === "/dsb-assistance" ? 0.5 : 0.9,
    })),
    ...["/about", "/contact"].map((path) => ({
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
    ...["/en", "/ro", "/pl"].map((path) => ({
      url: `${SITE}${path}`,
      lastModified: stableLastMod,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
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
  ];
}
