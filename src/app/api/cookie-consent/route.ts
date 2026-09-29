import { NextRequest, NextResponse } from "next/server";
import { analyticsSalt, visitorHash, visitorIp } from "@/lib/analytics/pageview";
import { getSupabaseAtsClient } from "@/lib/supabaseAts";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  const raw = await request.text();
  if (raw.length > 256) return new NextResponse(null, { status: 400 });
  let body: { analytics?: unknown };
  try { body = JSON.parse(raw); } catch { return new NextResponse(null, { status: 400 }); }
  if (!body || typeof body.analytics !== "boolean") return new NextResponse(null, { status: 400 });
  const db = getSupabaseAtsClient();
  if (!db) return new NextResponse(null, { status: 503 });
  const { error } = await db.from("ats_consent_records").insert({
    kind: "cookies", document_slug: "cookie-policy", document_version: 2,
    choice: { necessary: true, analytics: body.analytics, marketing: false },
    host: request.nextUrl.hostname,
    visitor_hash: visitorHash(visitorIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
      request.headers.get("user-agent") ?? "", new Date().toISOString().slice(0, 10), analyticsSalt()),
  });
  return new NextResponse(null, { status: error ? 503 : 204 });
}
