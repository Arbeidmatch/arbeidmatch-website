import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { JOBS_PREVIEW_COOKIE, JOBS_PREVIEW_PARAM, mayViewJobsPreview } from "@/lib/jobs-preview-gate";

// TODO(next16): Migrate this file to `proxy.ts` once routing behavior is validated in staging.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * The jobs section is being built and is not public yet. It is reachable only
   * with the key the owner has in Slack, and anything else is a 404 rather than
   * a locked screen: a "you need access" page announces that something is here
   * and invites guessing.
   *
   * The key in the address sets a cookie, so the link is tapped once rather
   * than pasted onto every page.
   */
  if (pathname === "/jobs" || pathname.startsWith("/jobs/")) {
    const paramKey = request.nextUrl.searchParams.get(JOBS_PREVIEW_PARAM);
    const cookieKey = request.cookies.get(JOBS_PREVIEW_COOKIE)?.value ?? null;
    if (!mayViewJobsPreview({ paramKey, cookieKey })) {
      return new NextResponse(null, { status: 404 });
    }
    const res = NextResponse.next();
    if (paramKey) {
      res.cookies.set(JOBS_PREVIEW_COOKIE, paramKey, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  }
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
