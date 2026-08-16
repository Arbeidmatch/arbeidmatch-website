import { NextRequest, NextResponse } from "next/server";

import { boardDestination, clickRecordUrl } from "@/lib/boardJobLink";

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
 * A REDIRECT THAT NEVER WAITS. The recording is fired without being awaited and
 * every failure is swallowed: a person on their way to a job posting is the last
 * thing that should wait on our analytics, or be stopped by it.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const destination = boardDestination(id);
  const record = clickRecordUrl(id, request.nextUrl.searchParams.get("src"));

  if (record) {
    void fetch(record, {
      redirect: "manual",
      cache: "no-store",
      headers: {
        // Carried over so the ATS can tell a person from a link preview.
        "user-agent": request.headers.get("user-agent") ?? "ArbeidMatch Website",
      },
    }).catch(() => undefined);
  }

  return NextResponse.redirect(destination, { status: 302 });
}
