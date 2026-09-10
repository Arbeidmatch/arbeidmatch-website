import { NextRequest, NextResponse } from "next/server";
import { atsBaseUrl } from "@/lib/jobs-fetch";

export const dynamic = "force-dynamic";

/**
 * The apply button in Messenger, on our own domain.
 *
 * The bot's buttons point at the ATS click counter, `/api/go/apply?p=...`, which
 * records the tap and sends the person on to the advert. Since 6 September 2026
 * the ATS sends every browser that has no session to the same path here, on
 * arbeidmatch.no, so the public never lands on the ATS - and nothing here
 * answered it. MEASURED 10 September 2026: every apply button in Messenger ended
 * on a 404.
 *
 * IT FORWARDS RATHER THAN DECIDES. The ATS still counts the tap and still chooses
 * where it goes; this asks it from our server and passes its answer on. Where a
 * link lands is the owner's decision and stays in one place.
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  try {
    const upstream = await fetch(`${atsBaseUrl()}/api/go/apply${search}`, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      // The ATS tells a link preview from a person by these; without them every
      // tap would be counted as the same visitor, or as none.
      headers: {
        "user-agent": request.headers.get("user-agent") ?? "",
        referer: request.headers.get("referer") ?? "",
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
    });
    const location = upstream.headers.get("location");
    if (upstream.status >= 300 && upstream.status < 400 && location && /^https:\/\//i.test(location)) {
      return NextResponse.redirect(location, { status: 302 });
    }
  } catch {
    // Fall through: a person who tapped apply should still see our jobs.
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}
