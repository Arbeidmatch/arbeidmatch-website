import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function normalizeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const redirect = normalizeRedirect(searchParams.get("redirect"));

  const isAccepted = action === "accepted";
  const isDeclined = action === "declined";

  if (!isAccepted && !isDeclined) {
    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  }

  const destination = isAccepted ? redirect : "/cookie-required";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set({
    name: COOKIE_NAME,
    value: isAccepted ? "accepted" : "declined",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: false,
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}
