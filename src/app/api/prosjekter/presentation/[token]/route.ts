import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { callAts } from "@/lib/prosjekter/ats";
import { isProjectToken } from "@/lib/prosjekter/format";
import { PORTAL_SESSION_COOKIE, sessionHeaders } from "@/lib/prosjekter/portal-session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const INVALID_LINK = "Lenken er ikke gyldig lenger.";
const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";

/**
 * One project presented to one client. ?preview=1 is passed on so an internal look is not counted as an open.
 * The client's session goes with it (PROJ-REST A): the ATS answers every detail only to the address the
 * presentation was sent to, 401 with the masked project without a session, 403 for another address.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProjectToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-presentation-get", 120, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });

  const preview = request.nextUrl.searchParams.get("preview") === "1" ? "?preview=1" : "";
  const answer = await callAts(`/api/public/project-presentation/${token}${preview}`, {
    method: "GET",
    visitorHeaders: request.headers,
    headers: sessionHeaders(request.cookies.get(PORTAL_SESSION_COOKIE)?.value),
  });
  return noStoreJson(answer.body, { status: answer.status });
}

/** The way into the competition while it is open: { url } to open in a new tab, or 404. */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProjectToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-presentation-post", 30, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });

  const answer = await callAts(`/api/public/project-presentation/${token}`, {
    method: "POST",
    visitorHeaders: request.headers,
    headers: sessionHeaders(request.cookies.get(PORTAL_SESSION_COOKIE)?.value),
  });
  // Only a web address goes back to the browser to be opened, never another scheme.
  if (answer.status === 200) {
    const url = typeof answer.body.url === "string" ? answer.body.url : "";
    if (!/^https?:\/\//i.test(url)) return noStoreJson({ error: "Konkurransen er ikke åpen lenger." }, { status: 404 });
    return noStoreJson({ url });
  }
  return noStoreJson(answer.body, { status: answer.status });
}
