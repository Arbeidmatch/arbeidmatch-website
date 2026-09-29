import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { checkAccessCode, isAccessRequestId } from "@/lib/prosjekter/access";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

const TOO_MANY = "For mange forsøk. Prøv igjen litt senere.";
const UNAVAILABLE = "Koden kunne ikke sjekkes akkurat nå. Prøv igjen om litt.";

/**
 * The code from the e-mail, typed in the access dialog (29 September 2026).
 * The ATS holds the code's hash and counts the tries; this only checks the
 * shape and passes the ATS's Norwegian answer on.
 */
export async function POST(request: NextRequest) {
  const rate = getRateLimitResult(request, "prosjekter-access-verify", 20, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson({ error: TOO_MANY }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || !isAccessRequestId(raw.requestId)) return noStoreJson({ error: "Begynn på nytt." }, { status: 400 });
  const code = checkAccessCode(raw.code);
  if (!code.ok) return noStoreJson({ error: code.error }, { status: 400 });

  const answer = await callAts("/api/public/project-access/verify", {
    method: "POST",
    visitorHeaders: request.headers,
    body: { requestId: raw.requestId, code: code.code },
  });
  if (answer.status >= 200 && answer.status < 300 && answer.body.ok === true) return noStoreJson({ ok: true });
  if (answer.status === 429) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const atsError = typeof answer.body.error === "string" ? answer.body.error.slice(0, 300) : null;
  if (atsError && answer.status >= 400 && answer.status < 500 && answer.status !== 404) return noStoreJson({ error: atsError }, { status: 400 });
  return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
}
