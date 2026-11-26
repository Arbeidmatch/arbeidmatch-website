import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { postMarketEvent } from "@/lib/market-jobs/fetch";
import {
  cleanPreviewToken,
  isMarketId,
  PREVIEW_COOKIE,
  validateEventBody,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE_SECONDS,
} from "@/lib/market-jobs/pure";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

const VISITOR_ID = /^[0-9a-f-]{36}$/;

/**
 * One event on a market job (ORDER 514): a view, Keep, Interested, Pass,
 * Send, Recommend me, Check source or a report.
 *
 * The browser names the event; this route adds the anonymous visitor id (made
 * here the first time, kept in `am_vid` for a year), the user agent and the
 * staff preview token, and posts it to the ATS with the shared secret. The
 * visitor's address is never sent.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMarketId(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (isRateLimited(request, "market-job-event", 60, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "too_many" }, { status: 429 });
  }
  const parsed = validateEventBody(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const known = request.cookies.get(VISITOR_COOKIE)?.value ?? "";
  const visitorId = VISITOR_ID.test(known) ? known : randomUUID();
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);
  const token = cleanPreviewToken(request.cookies.get(PREVIEW_COOKIE)?.value);

  const answer = await postMarketEvent(id, parsed.value, { visitorId, userAgent }, token);
  const res = NextResponse.json(answer.body, { status: answer.status });
  res.headers.set("Cache-Control", "no-store");
  if (visitorId !== known) {
    res.cookies.set(VISITOR_COOKIE, visitorId, { path: "/", maxAge: VISITOR_MAX_AGE_SECONDS, httpOnly: true, secure: true, sameSite: "lax" });
  }
  return res;
}
