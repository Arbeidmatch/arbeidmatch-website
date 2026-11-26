import { NextRequest, NextResponse } from "next/server";

import { cleanPreviewToken, PREVIEW_COOKIE, PREVIEW_MAX_AGE_SECONDS, safePreviewNext } from "@/lib/market-jobs/pure";

export const dynamic = "force-dynamic";

/**
 * The staff preview of the market jobs (ORDER 514).
 *
 * RecOS sends a signed-in staff member here with a token. This site never
 * checks the token itself: it keeps it in an httpOnly cookie for twelve hours
 * and forwards it to the ATS as `x-market-preview` on its own server-side
 * reads, and the ATS decides. A visitor without the cookie sees exactly the
 * public list.
 *
 * `next` may only be the list or one market job; anything else goes to the list.
 */
export function GET(request: NextRequest) {
  const next = safePreviewNext(request.nextUrl.searchParams.get("next"));
  const res = NextResponse.redirect(new URL(next, request.url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  const token = cleanPreviewToken(request.nextUrl.searchParams.get("token"));
  if (!token) return res;
  const host = request.nextUrl.hostname;
  res.cookies.set(PREVIEW_COOKIE, token, {
    path: "/",
    maxAge: PREVIEW_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    // The apex and www are one site to a visitor; the cookie follows them across both.
    ...(host === "arbeidmatch.no" || host.endsWith(".arbeidmatch.no") ? { domain: ".arbeidmatch.no" } : {}),
  });
  return res;
}
