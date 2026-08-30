/**
 * The card Facebook draws when somebody shares `arbeidmatch.no/j/482823`.
 *
 * MEASURED 30 AUGUST 2026, after he said the adverts come out without a photo.
 * Asked through Meta's own scraper, our link had nothing at all on it:
 *
 *   POST graph.facebook.com/v21.0/?scrape=true&id=https://arbeidmatch.no/j/482823
 *     -> title: none, image: none
 *   the same call for https://jobs.arbeidmatch.no/job/482823
 *     -> title: "Precast Concrete Factory Workers - Norway, Stavanger",
 *        image: a 1200x778 photo on the board's CDN
 *
 * The posting has always had a proper card. Our own link is a bare 302 with an
 * empty body, and a crawler asked to draw a preview of an empty body draws
 * nothing. Everything the public sees goes through that link, so every advert
 * link we publish has been going out grey.
 *
 * SO A CRAWLER GETS A PAGE AND A PERSON STILL GETS THE REDIRECT. The preview is
 * the posting's own title, description and photo, read from the board at the
 * moment the crawler asks and never stored. A person is redirected exactly as
 * before, in one hop, with the tap counted; a crawler is not counted, which is
 * the same rule the ATS redirect already applies.
 *
 * Pure: no fetch, no Next, nothing to mock. The route does the talking.
 */

/**
 * The user agents that draw a card rather than read a page.
 *
 * Facebook's is the one that matters here and the others cost nothing to
 * include: every one of them behaves the same way, asking for the page and
 * rendering whatever meta tags come back. Googlebot is deliberately NOT in this
 * list: a redirect is the honest answer for a search engine, and passing it an
 * interstitial instead is how a domain earns a manual action.
 */
const CRAWLERS =
  /(facebookexternalhit|facebookcatalog|meta-externalagent|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|pinterest|redditbot|skypeuripreview|vkshare|embedly|quora link preview|bitlybot|nuzzel|outbrain|iframely)/i;

export function isLinkPreviewCrawler(userAgent: string | null | undefined): boolean {
  return CRAWLERS.test(String(userAgent ?? ""));
}

export type PostingPreview = {
  title: string;
  description: string;
  image: string;
};

/** What the card says when the board cannot be read in time. */
export const FALLBACK_PREVIEW: PostingPreview = {
  title: "Locuri de munca in Norvegia - ArbeidMatch",
  description:
    "Recrutam meseriasi cu calificare sau experienta recenta pentru clientii nostri din Norvegia. Selectam in continuu.",
  image: "https://arbeidmatch.no/og-image.png",
};

const META =
  /<meta[^>]+(?:property|name)\s*=\s*["'](og:title|og:description|og:image|twitter:title|twitter:description|twitter:image)["'][^>]*>/gi;
const CONTENT = /content\s*=\s*["']([^"']*)["']/i;

/**
 * The posting's own card, read out of the board's HTML.
 *
 * Regex rather than a parser because this reads six tags out of a five kilobyte
 * page that we do not control and must never crash on. Anything missing falls
 * back to the line above, so a card is always complete: Facebook shows a grey
 * box for a card with a title and no image just as readily as for no card at
 * all.
 */
export function previewFromHtml(html: string | null | undefined): PostingPreview {
  const found: Record<string, string> = {};
  const text = String(html ?? "");
  for (const tag of text.match(META) ?? []) {
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const value = tag.match(CONTENT)?.[1]?.trim();
    if (!key || !value) continue;
    const plain = key.replace(/^twitter:/, "og:");
    if (!found[plain]) found[plain] = decodeEntities(value);
  }
  return {
    title: found["og:title"] || FALLBACK_PREVIEW.title,
    description: found["og:description"] || FALLBACK_PREVIEW.description,
    image: found["og:image"] || FALLBACK_PREVIEW.image,
  };
}

/** The five entities a Recman posting actually contains. */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The page a crawler receives: the card, and a way onward for anything that
 * follows it.
 *
 * `og:url` is our own address rather than the board's on purpose. Facebook
 * attributes shares, comments and reactions to the canonical url it is given,
 * and pointing it at the board would hand the engagement on our own adverts to
 * a domain we do not own.
 */
export function previewHtml(preview: PostingPreview, canonicalUrl: string, destination: string): string {
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const image = escapeHtml(preview.image);
  const url = escapeHtml(canonicalUrl);
  const to = escapeHtml(destination);
  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ArbeidMatch">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0;url=${to}">
</head>
<body>
<p><a href="${to}">${title}</a></p>
</body>
</html>`;
}
