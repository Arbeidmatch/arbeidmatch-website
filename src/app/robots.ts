import type { MetadataRoute } from "next";

/**
 * Crawl rules for production. /request is disallowed but may still be linked internally for UX.
 * Internal-only flows (candidate profile, employer review links, one-time job edit) are disallowed but remain reachable by direct URL.
 * Query-string URLs are discouraged for indexing via `/*?` (see also Search Console parameter handling).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/request",
          "/request/",
          "/feedback",
          "/feedback/",
          "/admin",
          "/admin/",
          "/api/",
          "/dsb-preview",
          "/candidates",
          "/candidates/",
          "/engineers-technical",
          "/engineers-technical/",
          "/jobs",
          "/jobs/",
          "/jobs/edit/",
          "/employer/candidates/",
          "/*?",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/request",
          "/request/",
          "/feedback",
          "/feedback/",
          "/admin",
          "/admin/",
          "/api/",
          "/dsb-preview",
          "/candidates",
          "/candidates/",
          "/engineers-technical",
          "/engineers-technical/",
          "/jobs",
          "/jobs/",
          "/jobs/edit/",
          "/employer/candidates/",
          "/*?",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/request",
          "/request/",
          "/feedback",
          "/feedback/",
          "/admin",
          "/admin/",
          "/api/",
          "/dsb-preview",
          "/candidates",
          "/candidates/",
          "/engineers-technical",
          "/engineers-technical/",
          "/jobs",
          "/jobs/",
          "/jobs/edit/",
          "/employer/candidates/",
          "/*?",
        ],
      },
    ],
    sitemap: "https://www.arbeidmatch.no/sitemap.xml",
    host: "https://www.arbeidmatch.no",
  };
}
