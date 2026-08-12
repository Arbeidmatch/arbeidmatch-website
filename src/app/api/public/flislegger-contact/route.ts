import { NextRequest, NextResponse } from "next/server";

const ATS_ENDPOINT = "https://ats.arbeidmatch.no/api/public/flislegger-contact";

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (body.length > 24_000) return NextResponse.json({ error: "Forespørselen er for stor." }, { status: 413 });

  const response = await fetch(ATS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": request.headers.get("user-agent") ?? "ArbeidMatch Website" },
    body,
    cache: "no-store",
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}
