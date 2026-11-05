import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isProfileToken } from "@/lib/min-side/profile";
import { PASSKEY_CHALLENGE_COOKIE, atsCallFor, isPasskeyStep, passkeyChallengeCookieOptions } from "@/lib/min-side/passkey";
import { callAts } from "@/lib/prosjekter/ats";
import { PORTAL_SESSION_COOKIE, portalSessionCookieOptions } from "@/lib/prosjekter/portal-session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ step: string }> };

const BAD_REQUEST = "Ugyldig forespørsel.";
const TOO_MANY = "For mange forsøk. Prøv igjen litt senere.";

/**
 * One step of a Min side passkey ceremony (ORDER 228), passed on to the ATS
 * (lib/min-side/passkey.ts says which). The two "-options" steps keep the ATS's
 * challenge id in an httpOnly cookie; the two "-verify" steps hand it back and
 * clear it. A sign-in that the ATS accepts sets the same session cookie a
 * pressed login link sets, and answers where Min side is.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { step } = await ctx.params;
  if (!isPasskeyStep(step)) return noStoreJson({ error: BAD_REQUEST }, { status: 404 });
  const rate = getRateLimitResult(request, `min-side-passkey-${step}`, 20, 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });

  const call = atsCallFor(step, raw, request.cookies.get(PASSKEY_CHALLENGE_COOKIE)?.value ?? null);
  if (!call) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  const answer = await callAts(call.path, { method: "POST", visitorHeaders: request.headers, body: call.body });

  if (step === "register-options" || step === "login-options") {
    const challengeId = typeof answer.body.challenge_id === "string" ? answer.body.challenge_id : null;
    if (answer.status !== 200 || !challengeId || !answer.body.options) return noStoreJson({ error: String(answer.body.error ?? "Kunne ikke starte. Prøv igjen.") }, { status: answer.status === 200 ? 502 : answer.status });
    const res = noStoreJson({ options: answer.body.options });
    res.cookies.set(PASSKEY_CHALLENGE_COOKIE, challengeId, passkeyChallengeCookieOptions());
    return res;
  }

  if (step === "register-verify" || step === "login-verify") {
    const profile = step === "login-verify" && answer.status === 200 && isProfileToken(answer.body.profile) ? answer.body.profile : null;
    const res =
      step === "login-verify"
        ? profile
          ? noStoreJson({ ok: true, redirect: `/min-side/${profile}` })
          : noStoreJson({ error: String(answer.body.error ?? "Innloggingen kunne ikke fullføres.") }, { status: answer.status === 200 ? 502 : answer.status })
        : noStoreJson(answer.body, { status: answer.status });
    res.cookies.set(PASSKEY_CHALLENGE_COOKIE, "", passkeyChallengeCookieOptions(0));
    if (profile) res.cookies.set(PORTAL_SESSION_COOKIE, profile, portalSessionCookieOptions());
    return res;
  }

  return noStoreJson(answer.body, { status: answer.status });
}
