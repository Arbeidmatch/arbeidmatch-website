import { NextRequest, NextResponse } from "next/server";

import { buildPageviewRow } from "@/lib/analytics/pageview";
import { atsRelay } from "@/lib/atsRelay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The first-party pageview beacon, same origin.
 *
 * The browser posts here instead of to ats.arbeidmatch.no (which refuses it:
 * the public never talks to the ATS host from a browser), and this route builds
 * the row by the same rules as the ATS sink and hands it to the ATS's
 * website-relay, server to server (ORDER 415: the site holds no ATS database key).
 * See src/lib/analytics/pageview.ts for why the row is built here.
 *
 * Always 204, whatever happens: analytics must never surface an error to a visitor.
 */
export async function POST(request: NextRequest) {
  try {
    // Sent as text/plain by the beacon, so parse the JSON from the raw body.
    const raw = await request.text().catch(() => "");
    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw.slice(0, 4096)) : null;
    } catch {
      body = null;
    }

    if (!body || typeof body !== "object" || (body as { consentVersion?: unknown }).consentVersion !== 2) {
      return new NextResponse(null, { status: 204 });
    }
    const row = buildPageviewRow({
      headers: {
        origin: request.headers.get("origin"),
        referer: request.headers.get("referer"),
        host: request.headers.get("host"),
        userAgent: request.headers.get("user-agent"),
        forwardedFor: request.headers.get("x-forwarded-for"),
        realIp: request.headers.get("x-real-ip"),
        country: request.headers.get("x-vercel-ip-country"),
        city: request.headers.get("x-vercel-ip-city"),
      },
      body,
    });
    if (row) {
      await atsRelay("pageview", { ...row, path: row.path.split(/[?#]/)[0].split("/").slice(0, 2).join("/") });
    }
  } catch {
    /* best-effort */
  }
  return new NextResponse(null, { status: 204 });
}
