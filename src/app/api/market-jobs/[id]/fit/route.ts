import { NextRequest, NextResponse } from "next/server";

import { postMarketFit } from "@/lib/market-jobs/fetch";
import { cleanFitAnswers, cleanPreviewToken, isMarketId, PREVIEW_COOKIE } from "@/lib/market-jobs/pure";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

/**
 * Check if I fit on a market job (ORDER 514): the visitor's yes and no, posted
 * on to RecOS with the shared secret and the staff preview token. RecOS answers
 * which button the window shows. Nothing that names the visitor leaves here.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isMarketId(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (isRateLimited(request, "market-job-fit", 40, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "too_many" }, { status: 429 });
  }
  const answers = cleanFitAnswers(await request.json().catch(() => null));
  const token = cleanPreviewToken(request.cookies.get(PREVIEW_COOKIE)?.value);
  const answer = await postMarketFit(id, answers, token);
  const res = NextResponse.json(answer.body, { status: answer.status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
