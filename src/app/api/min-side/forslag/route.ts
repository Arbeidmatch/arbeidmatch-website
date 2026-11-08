import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isProposalKey, proposalRequest } from "@/lib/min-side/proposal";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

const INVALID_LINK = "Lenken er ikke gyldig lenger.";
const BAD_REQUEST = "Ugyldig forespørsel.";
const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";

/**
 * ORDER 210 part (b): the proposals letter's answer page. GET shows the
 * proposal behind a button's key and writes nothing; POST is the press,
 * passed on with only its named fields. The ATS decides what the key may do.
 */
export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t") ?? "";
  if (!isProposalKey(t)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "min-side-forslag-get", 60, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const answer = await callAts(`/api/public/forsprang-proposal?t=${encodeURIComponent(t)}`, { method: "GET", visitorHeaders: request.headers });
  return noStoreJson(answer.body, { status: answer.status });
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  const body = proposalRequest(raw);
  if (!body) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  const rate = getRateLimitResult(request, "min-side-forslag-post", 20, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const answer = await callAts("/api/public/forsprang-proposal", { method: "POST", visitorHeaders: request.headers, body });
  return noStoreJson(answer.body, { status: answer.status });
}
