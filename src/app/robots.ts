import type { MetadataRoute } from "next";

/**
 * Crawl rules for production. /request is disallowed but may still be linked internally for UX.
 * Query-string URLs are discouraged for indexing via `/*?` (see also Search Console parameter handling).
 *
 * WHY THE LINK PREVIEW CRAWLERS HAVE THEIR OWN RULE, measured 30 August 2026.
 * He said the job links come out on Facebook without a photo. Meta's scraper
 * answered for `arbeidmatch.no/j/480204` with a full card, and for
 * `arbeidmatch.no/j/480204?src=comment` - the same posting, the same server,
 * the only difference a query string - with an empty object, even for an
 * address it had never seen before.
 *
 * `Disallow: /*?` is why. It exists so Search Console does not index the same
 * page under a dozen parameters, which is right for a search engine, and
 * facebookexternalhit obeys robots.txt the same as Googlebot. Every advert link
 * this company publishes carries `?src=comment` or `?src=post`, so every one of
 * them was refused at the door and drawn as a grey box.
 *
 * The preview crawlers are not indexers. They fetch one page, read six meta
 * tags and draw a card, so the duplicate-content rule has nothing to protect
 * against there. They keep the three real disallows and lose the parameter one.
 */
const PRIVATE_PATHS = ["/request", "/request/", "/feedback", "/feedback/", "/admin", "/admin/", "/api/"];

const INDEXER_DISALLOW = [...PRIVATE_PATHS, "/*?"];

/**
 * The user agents that draw a card rather than index a page. Kept in step with
 * `isLinkPreviewCrawler` in src/lib/linkPreview.ts, which decides what the /j/
 * route serves them.
 */
const PREVIEW_CRAWLERS = [
  "facebookexternalhit",
  "facebookcatalog",
  "meta-externalagent",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "Slackbot-LinkExpanding",
  "Discordbot",
  "TelegramBot",
  "WhatsApp",
  "Pinterest",
  "redditbot",
  "SkypeUriPreview",
  "Embedly",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: INDEXER_DISALLOW },
      { userAgent: "Googlebot", allow: "/", disallow: INDEXER_DISALLOW },
      { userAgent: "Bingbot", allow: "/", disallow: INDEXER_DISALLOW },
      ...PREVIEW_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: "https://www.arbeidmatch.no/sitemap.xml",
    host: "https://www.arbeidmatch.no",
  };
}
