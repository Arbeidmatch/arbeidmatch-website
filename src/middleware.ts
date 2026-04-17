import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site_cookie_consent";
const allowedWhenDeclined = ["/cookie-required", "/privacy", "/terms"];

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const consent = request.cookies.get(COOKIE_NAME)?.value;
  const isAllowedPage = allowedWhenDeclined.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (consent === "declined" && !isAllowedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/cookie-required";
    return NextResponse.redirect(url);
  }

  if (consent === "accepted" && pathname === "/cookie-required") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
