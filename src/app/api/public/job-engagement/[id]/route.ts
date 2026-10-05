import { NextRequest, NextResponse } from "next/server";

/**
 * The job page's four numbers, on this site's own origin (ORDER 57).
 *
 * The ATS refuses a browser on its public API (his rule: the public uses
 * arbeidmatch.no, never the ATS), so the page asks here and this server asks
 * the ATS. A job id and an action travel; nothing about the visitor does,
 * beyond the user agent (crawlers are not counted) and the address the rate
 * limit is kept by.
 */
const ATS = "https://ats.arbeidmatch.no/api/public/jobs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

function forwardHeaders(request: NextRequest): Record<string, string> {
  return {
    "content-type": "application/json",
    "user-agent": request.headers.get("user-agent") ?? "ArbeidMatch Website",
    "x-forwarded-for": (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
  };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  const res = await fetch(`${ATS}/${id}/engagement`, { headers: forwardHeaders(request), cache: "no-store" }).catch(() => null);
  if (!res) return NextResponse.json({ error: "Unavailable" }, { status: 502 });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { action?: unknown };
  const action = String(body.action ?? "");
  const target =
    action === "like"
      ? { url: `${ATS}/${id}/like`, method: "POST", body: undefined }
      : action === "unlike"
        ? { url: `${ATS}/${id}/like`, method: "DELETE", body: undefined }
        : action === "view" || action === "share"
          ? { url: `${ATS}/${id}/engagement`, method: "POST", body: JSON.stringify({ action }) }
          : null;
  if (!target) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const res = await fetch(target.url, { method: target.method, headers: forwardHeaders(request), body: target.body, cache: "no-store" }).catch(() => null);
  if (!res) return NextResponse.json({ error: "Unavailable" }, { status: 502 });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
