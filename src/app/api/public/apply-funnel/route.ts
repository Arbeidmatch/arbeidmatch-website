import { NextRequest, NextResponse } from "next/server";

/**
 * The apply funnel, counted first party (ORDER 41, point 9, 5 October 2026).
 *
 * The page sends "Apply pressed" and "box ticked" here, on its own origin, and
 * this passes them to the ATS, which keeps the count per job. A slug, a step
 * and a random id for the visit: nothing about the person travels.
 */
const ATS_ENDPOINT = "https://ats.arbeidmatch.no/api/public/apply-funnel";

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (body.length > 2_000) return new NextResponse(null, { status: 204 });

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
