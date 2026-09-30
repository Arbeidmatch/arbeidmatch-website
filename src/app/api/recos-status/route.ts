import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
/** The page and its fallback run on the website, independently of the application. */
export async function GET() {
  try {
    const result = await fetch(
      "https://ats.arbeidmatch.no/api/public/platform-status",
      { signal: AbortSignal.timeout(5000), cache: "no-store" },
    );
    if (!result.ok) throw new Error();
    const value = await result.json();
    if (!Array.isArray(value.incidents) || !Array.isArray(value.updates))
      throw new Error();
    return NextResponse.json(value, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch {
    return NextResponse.json(
      { health: "unknown", checkedAt: null, incidents: [], updates: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
