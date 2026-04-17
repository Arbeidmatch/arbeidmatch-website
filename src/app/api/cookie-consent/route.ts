import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "site_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function normalizeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/")) return "/";
  return value;
}

function buildConsentResponse(request: NextRequest, action: string | null, redirectRaw: string | null) {
  const redirect = normalizeRedirect(redirectRaw);

  const isAccepted = action === "accepted";
  const isDeclined = action === "declined";

  if (!isAccepted && !isDeclined) {
    const invalidResponse = NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
    invalidResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return invalidResponse;
  }

  const destination = isAccepted ? redirect : "/cookie-required";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return buildConsentResponse(request, searchParams.get("action"), searchParams.get("redirect"));
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const action = formData.get("action");
    const redirect = formData.get("redirect");
    return buildConsentResponse(
      request,
      typeof action === "string" ? action : null,
      typeof redirect === "string" ? redirect : null,
    );
  }

  try {
    const jsonBody = (await request.json()) as { action?: string; redirect?: string };
    return buildConsentResponse(request, jsonBody.action ?? null, jsonBody.redirect ?? null);
  } catch {
    const invalidBodyResponse = NextResponse.json({ success: false, error: "Invalid body." }, { status: 400 });
    invalidBodyResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return invalidBodyResponse;
  }
}
