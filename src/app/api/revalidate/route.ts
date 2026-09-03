import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { BOARD_TAG, jobTag } from "@/lib/jobs-fetch";

export const dynamic = "force-dynamic";

/**
 * The ATS telling this site that a job changed, so the change is visible at once.
 *
 * HIS QUESTION, 3 September 2026: "sa se actualizeze imediat cand schimb ceva in
 * ele din spate? fara sa fie ridicate in vercel ci sa fie conectate repede ca
 * modificarile sa fie vizibile imediat cum le salvez."
 *
 * No deploy was ever needed: these pages render per request. What stood in the
 * way was the cache window on the read, which was five minutes. It is fifteen
 * seconds now, and this route removes even that: saving a job in the ATS drops
 * the tag here and the very next view is the new one.
 *
 * WHY A SECRET AND NOT AN OPEN ENDPOINT. Nothing here reads or writes data, so
 * the worst an open one could do is force cache misses, which is a slow way to
 * make our own pages hit the ATS on every request. Not a disaster, but not free
 * either, and a shared secret costs one environment variable.
 *
 * WHEN THE SECRET IS NOT SET the route refuses everything, and the fifteen
 * second window is what keeps the site current. That is the deliberate order: a
 * missing variable slows the site down by fifteen seconds rather than opening
 * it up.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "Revalidation is not configured on this deployment." },
      { status: 503 },
    );
  }

  const given = request.headers.get("x-revalidate-secret")?.trim();
  if (!given || given !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { slug?: unknown };
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

  /**
   * The board always, because a change to one advert changes the list it sits
   * in: its title on a card, its town in the facets, whether it is there at all.
   *
   * `{ expire: 0 }` is the second argument Next 16 requires: how long the purged
   * entry may still be served for. Zero, because the whole point is that the
   * next reader sees the new text.
   */
  const now = { expire: 0 };
  revalidateTag(BOARD_TAG, now);
  if (slug) revalidateTag(jobTag(slug), now);

  return NextResponse.json({ ok: true, revalidated: slug ? [BOARD_TAG, jobTag(slug)] : [BOARD_TAG] });
}
