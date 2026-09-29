import { NextRequest } from "next/server";

import { getRateLimitResult, hasHoneypotValue, noStoreJson } from "@/lib/apiSecurity";
import { checkLoginEmail } from "@/lib/prosjekter/access";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

const TOO_MANY = "For mange forsøk. Prøv igjen litt senere.";
const UNAVAILABLE = "Innloggingen er ikke tilgjengelig akkurat nå. Prøv igjen om litt.";

/**
 * "Send meg en innloggingslenke" in the login dialog (#logg-inn). The ATS mails a link
 * to an address that has access and answers { ok: true } either way, so the
 * answer here never tells a visitor whether an address is a client. Only a
 * malformed address, too many tries or an unreachable ATS say anything else.
 */
export async function POST(request: NextRequest) {
  const rate = getRateLimitResult(request, "prosjekter-login", 5, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson({ error: TOO_MANY }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: "Ugyldig forespørsel." }, { status: 400 });
  }
  if (raw && typeof raw === "object" && hasHoneypotValue(raw)) return noStoreJson({ ok: true });

  const checked = checkLoginEmail(raw?.email);
  if (!checked.ok) return noStoreJson({ error: checked.error }, { status: 400 });

  const answer = await callAts("/api/public/project-login", {
    method: "POST",
    visitorHeaders: request.headers,
    body: { email: checked.email },
  });
  if (answer.status === 429) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  if (answer.status >= 500 || answer.status === 404) return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
  // Whatever else the ATS said, the visitor hears the same sentence.
  return noStoreJson({ ok: true });
}
