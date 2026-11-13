import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isRecommendationToken, LANDING_NO, trialRequestBody } from "@/lib/min-side/recommend";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const BAD_REQUEST = "Ugyldig forespørsel.";
const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";

/**
 * ORDER 274: the link in a recommendation mail. GET says who recommended; POST
 * asks for a trial (never a trial by itself: a card in the owner's bell) or
 * stops recommendations to the link's own address. The token reaches that one
 * recommendation and nothing else; the ATS decides every answer.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isRecommendationToken(token)) return noStoreJson({ error: LANDING_NO.invalid }, { status: 404 });
  const rate = getRateLimitResult(request, "anbefalt-get", 60, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const answer = await callAts(`/api/public/project-recommendation/${token}`, { method: "GET", visitorHeaders: request.headers });
  return noStoreJson(answer.body, { status: answer.status });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isRecommendationToken(token)) return noStoreJson({ error: LANDING_NO.invalid }, { status: 404 });
  const rate = getRateLimitResult(request, "anbefalt-post", 10, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  const body = raw && typeof raw === "object" ? trialRequestBody(raw) : null;
  if (!body) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  const answer = await callAts(`/api/public/project-recommendation/${token}`, { method: "POST", visitorHeaders: request.headers, body });
  return noStoreJson(answer.body, { status: answer.status });
}
