import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ["/premium/browse", "/premium/article/:path*"],
};

