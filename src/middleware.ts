import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
