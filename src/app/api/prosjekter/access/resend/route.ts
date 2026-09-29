import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isAccessRequestId } from "@/lib/prosjekter/access";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";
const UNAVAILABLE = "Koden kunne ikke sendes akkurat nå. Prøv igjen om litt.";

/** "Send ny kode" in the access dialog (29 September 2026). The ATS allows three codes per request. */
export async function POST(request: NextRequest) {
  const rate = getRateLimitResult(request, "prosjekter-access-resend", 6, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson({ error: TOO_MANY }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || !isAccessRequestId(raw.requestId)) return noStoreJson({ error: "Begynn på nytt." }, { status: 400 });

  const answer = await callAts("/api/public/project-access/resend", {
    method: "POST",
    visitorHeaders: request.headers,
    body: { requestId: raw.requestId },
    timeoutMs: 25_000,
  });
  if (answer.status >= 200 && answer.status < 300 && answer.body.ok === true) return noStoreJson({ ok: true });
  if (answer.status === 429) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const atsError = typeof answer.body.error === "string" ? answer.body.error.slice(0, 300) : null;
  if (atsError && answer.status >= 400 && answer.status < 500 && answer.status !== 404) return noStoreJson({ error: atsError }, { status: 400 });
  return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
}
