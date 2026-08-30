import { after, NextRequest, NextResponse } from "next/server";

import { boardDestination, clickRecordUrl } from "./boardJobLink";
import {
  FALLBACK_PREVIEW,
  isLinkPreviewCrawler,
  previewFromHtml,
  previewHtml,
  type PostingPreview,
} from "./linkPreview";

/**
 * `arbeidmatch.no/j/482823` and `arbeidmatch.no/j/482823/comment`, in one place.
 *
 * WHY THE SOURCE MOVED OUT OF THE QUERY STRING, measured 30 August 2026. Meta's
 * scraper refuses every address on this domain that carries a query string, the
 * home page included:
 *
 *   arbeidmatch.no/      -> a card
 *   arbeidmatch.no/?x=1  -> an empty object
 *
 * `Disallow: /*?` in robots.txt is why, and facebookexternalhit obeys robots.txt
 * exactly like Googlebot. Every advert link this company publishes carried
 * `?src=comment` or `?src=post`, so every one of them was drawn as a grey box.
 * The rule now exempts the preview crawlers, but Meta caches robots.txt for up
 * to a day, and a rule somebody re-tightens next year would silently do this
 * again.
 *
 * So the surface is a path segment. It cannot be caught by a parameter rule, it
 * needs no exemption to work, and the count survives. The old `?src=` form still
 * answers, because links carrying it are already published under adverts.
 */
const PREVIEW_TIMEOUT_MS = 3000;

/** The surfaces we count, and nothing else gets through to the recorder. */
const KNOWN_SOURCES = new Set(["comment", "post", "message", "ad", "page"]);

export function readSource(raw: unknown): string | null {
  const value = String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z_]/g, "")
    .slice(0, 24);
  return KNOWN_SOURCES.has(value) ? value : null;
}

/**
 * The posting's own card, fetched at the moment a crawler asks for it.
 *
 * Never throws and never waits long: a preview is worth three seconds and not a
 * second more, and a card with our own line on it is better than a share that
 * hangs while Facebook waits for us.
 */
async function previewFor(destination: string): Promise<PostingPreview> {
  try {
    const res = await fetch(destination, {
      cache: "no-store",
      signal: AbortSignal.timeout(PREVIEW_TIMEOUT_MS),
      headers: { "user-agent": "ArbeidMatch Link Preview" },
    });
    if (!res.ok) return FALLBACK_PREVIEW;
    return previewFromHtml(await res.text());
  } catch {
    return FALLBACK_PREVIEW;
  }
}

/**
 * A crawler gets a page, a person gets the redirect.
 *
 * Nothing is recorded on the crawler branch: a preview fetch is not somebody
 * deciding to apply, and counting it would put a tap on every advert the moment
 * it is posted.
 */
export async function handleJobLink(request: NextRequest, id: string, src: string | null): Promise<NextResponse> {
  const destination = boardDestination(id);
  const record = clickRecordUrl(id, src ?? request.nextUrl.searchParams.get("src"));

  if (isLinkPreviewCrawler(request.headers.get("user-agent"))) {
    const preview = await previewFor(destination);
    return new NextResponse(previewHtml(preview, request.nextUrl.href, destination), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        // Long enough that Meta's re-scrapes are cheap, short enough that a
        // posting edited on the board is not misdescribed for a day.
        "cache-control": "public, max-age=600, s-maxage=600",
      },
    });
  }

  if (record) {
    const userAgent = request.headers.get("user-agent") ?? "ArbeidMatch Website";
    after(async () => {
      await fetch(record, {
        redirect: "manual",
        cache: "no-store",
        // Carried over so the ATS can tell a person from a link preview.
        headers: { "user-agent": userAgent },
      }).catch(() => undefined);
    });
  }

  return NextResponse.redirect(destination, { status: 302 });
}
