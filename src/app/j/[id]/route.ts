import { after, NextRequest, NextResponse } from "next/server";

import { boardDestination, clickRecordUrl } from "@/lib/boardJobLink";
import {
  FALLBACK_PREVIEW,
  isLinkPreviewCrawler,
  previewFromHtml,
  previewHtml,
  type PostingPreview,
} from "@/lib/linkPreview";

export const dynamic = "force-dynamic";

/**
 * `arbeidmatch.no/j/482823` - the link the public reads under our adverts.
 *
 * WHY IT EXISTS. The bot used to publish `ats.arbeidmatch.no/api/go/apply?p=...`
 * in the comment under every job advert. On 16 August 2026 the owner ruled that
 * the ATS address is not to be visible in public, and the link became the board
 * posting itself - which cost the count: twenty-one of the thirty-six taps we
 * had in a fortnight came from exactly those comments, and a link straight to
 * the board passes through nothing of ours. This page is the answer he asked
 * for: his own domain in front of the public, the tap still counted.
 *
 * HOW IT COUNTS. By calling the ATS redirect from this server, with the
 * visitor's user agent carried over so their crawler guard still works: a
 * Facebook preview fetch must not be recorded as somebody deciding to apply.
 * The response of that call is thrown away; only the row it writes matters, and
 * it is the same row, in the same table, as every other tap. Nothing is stored
 * here.
 *
 * A REDIRECT THAT NEVER WAITS, AND A RECORDING THAT SURVIVES IT. The first
 * version of this used a bare `void fetch(...)`, and the first real tap through
 * it recorded nothing at all: on Vercel the function is frozen the instant the
 * response is returned, so work still in flight is simply dropped. The ATS
 * redirect has that same scar written on it from 31 July 2026. `after` keeps the
 * instance alive until the call finishes while the redirect still leaves
 * immediately, and every failure is swallowed: a person on their way to a job
 * posting is the last thing that should wait on our analytics, or be stopped by
 * it.
 */
/** How long the board gets to answer before the card goes out on the fallback. */
const PREVIEW_TIMEOUT_MS = 3000;

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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const destination = boardDestination(id);
  const record = clickRecordUrl(id, request.nextUrl.searchParams.get("src"));

  // A CRAWLER GETS A PAGE, A PERSON GETS THE REDIRECT.
  //
  // Measured 30 August 2026 with Meta's own scraper: this address returned no
  // title and no image, because a 302 with an empty body is all a crawler ever
  // saw. Every advert link the page publishes goes through here, so every one of
  // them was being shared as a grey box. See src/lib/linkPreview.ts.
  //
  // Nothing is recorded on this branch: a preview fetch is not somebody deciding
  // to apply, and counting it would put a tap on every advert the moment it is
  // posted.
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
