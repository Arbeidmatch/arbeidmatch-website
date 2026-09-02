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

/**
 * `Disallow: /*?` IS GONE, and it was doing more harm than the duplicate
 * content it was there to prevent.
 *
 * It blocked every address with a question mark in it. That is every search
 * this site can answer: `/jobs?search=tomrer`, `/jobs?location=Bergen`,
 * `/jobs?industry=automotive` - which are exactly the pages that answer the
 * questions people type. Checked live on 2 September 2026: those pages could
 * not be indexed at all, so the one part of the site that is a direct answer
 * to a search was invisible to search.
 *
 * The duplicate-content worry it addressed is real but is not robots.txt's job
 * any more: the canonical tag on each page says which address is the one, and
 * Search Console handles parameters. Refusing the crawl instead means the page
 * is never seen well enough to be de-duplicated in the first place.
 *
 * The preview crawlers already had it removed on 30 August for the same shape
 * of reason: every advert link this company publishes carries `?src=comment`,
 * and every one of them was being refused at the door and drawn as a grey box.
 */
const INDEXER_DISALLOW = [...PRIVATE_PATHS];

/**
 * The crawlers that read for an assistant rather than for an index.
 *
 * Listed so that allowing them is a decision on the record rather than an
 * accident of the wildcard. They were never blocked here - many sites block
 * them by mistake and become invisible to every assistant at once - and this
 * says out loud that we do not.
 *
 * Being crawled is necessary and is not sufficient: a place in an answer cannot
 * be bought, and what earns a citation is being the most exact source on a
 * narrow question. That is what the JobPosting and FAQ markup is for.
 */
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

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
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: "https://www.arbeidmatch.no/sitemap.xml",
    host: "https://www.arbeidmatch.no",
  };
}
