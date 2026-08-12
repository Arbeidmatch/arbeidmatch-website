import { NextRequest, NextResponse } from "next/server";

const ATS_ENDPOINT = "https://ats.arbeidmatch.no/api/public/flislegger-track";

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (body.length > 8_000) return new NextResponse(null, { status: 204 });

  await fetch(ATS_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": request.headers.get("user-agent") ?? "ArbeidMatch Website",
      "x-forwarded-for": (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
    },
    body,
    cache: "no-store",
  }).catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
