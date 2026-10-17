import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { callAts } from "@/lib/prosjekter/ats";
import { isProjectToken } from "@/lib/prosjekter/format";

export const dynamic = "force-dynamic";

const TOO_MANY = "For mange forsøk. Prøv igjen litt senere.";
const UNAVAILABLE = "Innloggingen er ikke tilgjengelig akkurat nå. Prøv igjen om litt.";

/**
 * "Logg inn" on a masked presentation (PROJ-REST A, 17 October 2026). Nothing
 * the visitor types is read or sent on: the ATS mails the login link to the
 * address the presentation was sent to, and the link brings them back to it.
 * The answer is the same either way.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!isProjectToken(token)) return noStoreJson({ error: "Lenken er ikke gyldig lenger." }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-presentation-login", 5, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson({ error: TOO_MANY }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }
  const answer = await callAts(`/api/public/project-presentation/${token}/login`, {
    method: "POST",
    visitorHeaders: request.headers,
  });
  if (answer.status === 429) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  if (answer.status !== 200) return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
  return noStoreJson({ ok: true });
}
