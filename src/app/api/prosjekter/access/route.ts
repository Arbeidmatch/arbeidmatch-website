import { NextRequest } from "next/server";

import { getRateLimitResult, hasHoneypotValue, noStoreJson } from "@/lib/apiSecurity";
import { verifyCaptcha } from "@/lib/cv/captcha";
import { checkAccessRequest, isAccessRequestId } from "@/lib/prosjekter/access";
import { callAts, visitorIp } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";
const BAD_REQUEST = "Ugyldig forespørsel.";
const UNAVAILABLE = "Forespørselen kunne ikke sendes akkurat nå. Prøv igjen om litt.";

/**
 * "Be om tilgang" on /prosjekter. Checked here the way the form checks it
 * (company, a real organisation number, an e-mail, known county and trade
 * codes only), guarded like the site's other public forms (a honeypot, a rate
 * limit per visitor, Turnstile when it is configured), and forwarded to the
 * ATS, which puts it in front of the owner. The ATS's own Norwegian message
 * comes back when it refuses; anything else becomes one plain sentence.
 */
export async function POST(request: NextRequest) {
  const rate = getRateLimitResult(request, "prosjekter-access", 6, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson({ error: TOO_MANY }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });

  // A bot filled the hidden field: thank it and send nothing.
  if (hasHoneypotValue(raw)) return noStoreJson({ ok: true });

  const checked = checkAccessRequest(raw);
  if (!checked.ok) return noStoreJson({ error: checked.error, field: checked.field }, { status: 400 });

  const captcha = await verifyCaptcha(
    typeof raw.turnstileToken === "string" ? raw.turnstileToken : null,
    visitorIp(request.headers),
  );
  if (!captcha.ok) {
    return noStoreJson({ error: "Bekreft at du ikke er en robot, og prøv igjen." }, { status: 400 });
  }

  const answer = await callAts("/api/public/project-access", {
    method: "POST",
    visitorHeaders: request.headers,
    // The ATS reads the register and sends the code before it answers.
    timeoutMs: 25_000,
    body: checked.value,
  });
  if (answer.status >= 200 && answer.status < 300 && answer.body.ok === true) {
    // An address the ATS does not already hold gets a code; the dialog asks for it next.
    if (answer.body.needsCode === true && isAccessRequestId(answer.body.requestId)) {
      return noStoreJson({ ok: true, needsCode: true, requestId: answer.body.requestId });
    }
    return noStoreJson({ ok: true, needsCode: false });
  }
  if (answer.status === 429) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const atsError = typeof answer.body.error === "string" ? answer.body.error.slice(0, 300) : null;
  if (atsError && answer.status >= 400 && answer.status < 500 && answer.status !== 404) {
    const field = typeof answer.body.field === "string" ? answer.body.field : undefined;
    return noStoreJson({ error: atsError, field }, { status: answer.status });
  }
  return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
}
