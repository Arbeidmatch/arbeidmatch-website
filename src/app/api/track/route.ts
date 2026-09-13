import { NextRequest, NextResponse } from "next/server";

import { buildPageviewRow } from "@/lib/analytics/pageview";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getSupabaseAtsClient } from "@/lib/supabaseAts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The first-party pageview beacon, same origin.
 *
 * The browser posts here instead of to ats.arbeidmatch.no (which refuses it:
 * the public never talks to the ATS host from a browser), and this route writes
 * the row into ats_web_pageviews itself, built by the same rules as the ATS
 * sink. See src/lib/analytics/pageview.ts for why it is not forwarded.
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
      const supabase = getSupabaseAtsClient() ?? getSupabaseAdminClient();
      if (supabase) {
        await supabase
          .from("ats_web_pageviews")
          .insert(row)
          .then(
            () => undefined,
            () => undefined,
          );
      }
    }
  } catch {
    /* best-effort */
  }
  return new NextResponse(null, { status: 204 });
}
