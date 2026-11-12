import { NextRequest, NextResponse } from "next/server";

import { getRateLimitResult } from "@/lib/apiSecurity";
import { isProfileToken } from "@/lib/min-side/profile";
import { callAts } from "@/lib/prosjekter/ats";
import { PORTAL_SESSION_COOKIE } from "@/lib/prosjekter/portal-session";

export const dynamic = "force-dynamic";

/**
 * ORDER 273: "Endre valg" on the map page of an active subscription goes to
 * the settings in Min side, the only place they live now. The map page holds
 * the subscription's key, not the Min side key; the session cookie the login
 * set holds the latter. It is checked with the ATS (the cookie may hold a
 * subscription key instead), and without a Min side session the visitor is
 * sent to the login.
 */
export async function GET(request: NextRequest) {
  const login = NextResponse.redirect(new URL("/min-side#logg-inn", request.url), 303);
  const key = request.cookies.get(PORTAL_SESSION_COOKIE)?.value?.trim() ?? "";
  if (!isProfileToken(key)) return login;
  const rate = getRateLimitResult(request, "min-side-innstillinger", 30, 10 * 60 * 1000);
  if (rate.limited) return login;
  const answer = await callAts(`/api/public/client-profile/${key}`, { method: "GET", visitorHeaders: request.headers });
  if (answer.status !== 200) return login;
  const res = NextResponse.redirect(new URL(`/min-side/${key}#varsler/innstillinger`, request.url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
