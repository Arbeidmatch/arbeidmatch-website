import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/lib/requestProtection";
import { atsBase, portalSecret, visitorIp } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

/**
 * The server side of the candidate's sign-in on /candidate-login (ORDER 426).
 * The page posts here; this asks RecOS (api/public/candidate-sign-in, server
 * to server with the portal secret, the visitor's own address vouched for) to
 * mail the code or check it. RecOS's answer goes back to the page as it came:
 * an error to show, the gate to open, the profile step, or the one-time
 * handover token the page then posts to RecOS so the session opens there.
 *
 * Only the fields the sign-in uses go on; nothing is stored or logged here.
 */

const FIELDS = ["email", "code", "ticket", "full_name", "next", "invite", "gate", "consent", "consent_source", "birth_date"] as const;

export async function POST(request: NextRequest) {
  if (isRateLimited(request, "candidate-sign-in", 40, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  if (!body || (action !== "code" && action !== "verify")) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const secret = portalSecret();
  if (!secret) return NextResponse.json({ error: "Sign-in is not available right now. Try again in a moment." }, { status: 503 });

  const payload: Record<string, unknown> = { action };
  for (const key of FIELDS) if (body[key] !== undefined) payload[key] = body[key];

  const headers: Record<string, string> = { "x-arbeidmatch-website-secret": secret, "Content-Type": "application/json" };
  const ip = visitorIp(request.headers);
  if (ip) headers["x-arbeidmatch-applicant-ip"] = ip;

  const res = await fetch(`${atsBase()}/api/public/candidate-sign-in`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: "We could not reach the sign-in right now. Try again in a moment." }, { status: 503 });

  const answer = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return NextResponse.json(answer ?? { error: "We could not sign you in. Try again." }, { status: answer ? res.status : 502 });
}
