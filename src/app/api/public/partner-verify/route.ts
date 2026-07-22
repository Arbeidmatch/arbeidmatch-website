import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ATS_PUBLIC_BASE_URL =
  process.env.ATS_PUBLIC_BASE_URL?.trim() || "https://ats.arbeidmatch.no";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("email")?.trim() ?? "";
  const email = raw.toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  try {
    const url = `${ATS_PUBLIC_BASE_URL}/api/public/partner-verify?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { cache: "no-store" });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ found: false }, { status: 200, headers: NO_STORE_HEADERS });
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ found: false }, { status: 200, headers: NO_STORE_HEADERS });
    }

    if (!res.ok) {
      return NextResponse.json({ found: false }, { status: 200, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(data, { status: 200, headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json({ found: false }, { status: 200, headers: NO_STORE_HEADERS });
  }
}
