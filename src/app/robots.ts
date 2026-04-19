import type { MetadataRoute } from "next";

/**
 * Crawl rules for production. /request is disallowed but may still be linked internally for UX.
 * Query-string URLs are discouraged for indexing via `/*?` (see also Search Console parameter handling).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/request", "/request/", "/feedback", "/feedback/", "/admin", "/admin/", "/api/", "/dsb-preview", "/*?"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/request", "/request/", "/feedback", "/feedback/", "/admin", "/admin/", "/api/", "/dsb-preview", "/*?"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/request", "/request/", "/feedback", "/feedback/", "/admin", "/admin/", "/api/", "/dsb-preview", "/*?"],
      },
    ],
    sitemap: "https://www.arbeidmatch.no/sitemap.xml",
    host: "https://www.arbeidmatch.no",
  };
}
