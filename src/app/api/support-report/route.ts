import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/lib/requestProtection";

/**
 * The flag in a form's error popup (ORDER 44, 5 October 2026): feedback or a
 * fault report, sent on to the ATS's own /report-problem door with its human
 * check and its limits. The ATS refuses a browser's call to its public routes,
 * so the page writes here, on its own origin, and this passes the report on.
 */
const ATS_ENDPOINT = "https://ats.arbeidmatch.no/api/public/support-report";

export async function POST(request: NextRequest) {
  if (isRateLimited(request, "support-report", 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many reports. Please try again later." }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > 6_000) return NextResponse.json({ ok: false, error: "Too long." }, { status: 400 });
  try {
    const res = await fetch(ATS_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": request.headers.get("user-agent") ?? "ArbeidMatch Website",
        "x-forwarded-for": (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
      },
      body: text,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "We could not send the report. Please try again." }, { status: 502 });
  }
}
