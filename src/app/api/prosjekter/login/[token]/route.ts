import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isLoginToken } from "@/lib/prosjekter/access";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

const TOO_MANY = "For mange forsøk. Prøv igjen litt senere.";
const UNAVAILABLE = "Innloggingen er ikke tilgjengelig akkurat nå. Prøv igjen om litt.";

/**
 * "Send ny lenke" for an expired login link (PROJ-REST A, 17 October 2026).
 * No address is read or sent on: the ATS mails a new link to the address the
 * old one was issued for, and answers { ok: true } either way.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!isLoginToken(token)) return noStoreJson({ ok: true });
  const rate = getRateLimitResult(request, "prosjekter-login-resend", 5, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson({ error: TOO_MANY }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }
  const answer = await callAts(`/api/public/project-login/${encodeURIComponent(token)}`, {
    method: "POST",
    visitorHeaders: request.headers,
  });
  if (answer.status === 429) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  if (answer.status !== 200) return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
  return noStoreJson({ ok: true });
}
