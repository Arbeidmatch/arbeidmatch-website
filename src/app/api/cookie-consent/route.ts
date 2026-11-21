import { NextRequest, NextResponse } from "next/server";
import { analyticsSalt, visitorHash, visitorIp } from "@/lib/analytics/pageview";
import { atsRelay } from "@/lib/atsRelay";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const raw = await request.text();
  if (raw.length > 256) return new NextResponse(null, { status: 400 });
  let body: { analytics?: unknown };
  try { body = JSON.parse(raw); } catch { return new NextResponse(null, { status: 400 }); }
  if (!body || typeof body.analytics !== "boolean") return new NextResponse(null, { status: 400 });
  // ORDER 415: written by the ATS's website-relay; the site holds no ATS database key.
  const recorded = await atsRelay("consent", {
    document_version: 2,
    analytics: body.analytics,
    host: request.nextUrl.hostname,
    visitor_hash: visitorHash(visitorIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
      request.headers.get("user-agent") ?? "", new Date().toISOString().slice(0, 10), analyticsSalt()),
  });
  return new NextResponse(null, { status: recorded ? 204 : 503 });
}
