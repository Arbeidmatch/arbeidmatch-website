import { NextRequest, NextResponse } from "next/server";

import { getRateLimitResult } from "@/lib/apiSecurity";
import { isLoginToken } from "@/lib/prosjekter/access";
import { callAts } from "@/lib/prosjekter/ats";
import { isProjectToken } from "@/lib/prosjekter/format";
import { isProfileToken } from "@/lib/min-side/profile";
import {
  PORTAL_SESSION_COOKIE,
  loginIntentFrom,
  loginTarget,
  portalSessionCookieOptions,
  sessionKeyFrom,
} from "@/lib/prosjekter/portal-session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/**
 * A login link from the e-mail, redeemed (PROJ-REST A, 17 October 2026; before
 * that the page /prosjekter/inn/<token> did it). The ATS trades the login token
 * for the key to the client's own page and/or subscription page; the key is kept
 * in an httpOnly cookie, the client's session for the project pages, and the
 * visitor goes on where the link asked: a presentation, the alerts, Min side.
 * A used, expired or unknown link, or an ATS that cannot be reached, goes back
 * to /prosjekter/inn/<token> with a status, where "Send ny lenke" is offered.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const back = (status: "utlopt" | "feil") =>
    NextResponse.redirect(new URL(`/prosjekter/inn/${encodeURIComponent(token)}?status=${status}`, request.url), 303);
  if (!isLoginToken(token)) return back("utlopt");
  const rate = getRateLimitResult(request, "prosjekter-inn", 30, 10 * 60 * 1000);
  if (rate.limited) return back("feil");

  const intent = loginIntentFrom(request.nextUrl.searchParams);
  const answer = await callAts(`/api/public/project-login/${encodeURIComponent(token)}`, {
    method: "GET",
    visitorHeaders: request.headers,
  });
  const profile = answer.status === 200 && isProfileToken(answer.body.profile) ? answer.body.profile : null;
  const projects = answer.status === 200 && isProjectToken(answer.body.token) ? answer.body.token : null;
  const target = loginTarget({ profile, projects }, intent);
  if (!target) return back(answer.status >= 500 ? "feil" : "utlopt");

  const res = NextResponse.redirect(new URL(target, request.url), 303);
  const key = sessionKeyFrom({ profile, token: projects });
  if (key) res.cookies.set(PORTAL_SESSION_COOKIE, key, portalSessionCookieOptions());
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
