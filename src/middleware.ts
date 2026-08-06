import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// TODO(next16): Migrate this file to `proxy.ts` once routing behavior is validated in staging.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * THE JOBS SECTION IS NOT GATED ANY MORE, 6 August 2026.
   *
   * The key was the reason arbeidmatch.no/jobs answered 404 on his phone while it
   * opened on his desktop: the desktop carried the cookie from the day he tapped the
   * link in Slack, the phone never had one, and a gate that admits one device and
   * refuses the next is a gate nobody can reason about. He asked three times to reach
   * this page from a plain link.
   *
   * Nothing is exposed by removing it. The page carries `noindex`, so it cannot arrive
   * in a search result, and what is behind it is a list of our own open jobs that is
   * already readable on the ATS board without any key at all.
   *
   * To close it again, gate it here deliberately rather than reviving a key nobody can
   * remember which devices hold.
   */
  /** Article routes stay public for SEO; access control is enforced client-side via PaywallOverlay. */
  const isBrowse = pathname.startsWith("/premium/browse");
  if (!isBrowse) {
    return NextResponse.next();
  }

  const jwtSecret = process.env.PREMIUM_JWT_SECRET?.trim();
  if (!jwtSecret) {
    return NextResponse.redirect(new URL("/premium?locked=true", request.url));
  }

  const token = request.cookies.get("premium_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/premium?locked=true", request.url));
  }

  try {
    const key = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/premium?locked=true", request.url));
  }
}

export const config = {
  matcher: ["/premium/browse", "/premium/article/:path*", "/jobs", "/jobs/:path*"],
};
