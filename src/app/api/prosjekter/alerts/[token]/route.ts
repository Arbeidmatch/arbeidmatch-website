import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { callAts } from "@/lib/prosjekter/ats";
import { isProjectToken } from "@/lib/prosjekter/format";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const INVALID_LINK = "Lenken er ikke gyldig lenger.";
const BAD_REQUEST = "Ugyldig forespørsel.";
const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";

function stringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && /^[A-Za-z0-9_]{1,24}$/.test(v))
    .slice(0, max);
}

/** A client's project alerts page: their subscription and the projects that fit it. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProjectToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-alerts-get", 120, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });

  const answer = await callAts(`/api/public/project-alerts/${token}`, {
    method: "GET",
    visitorHeaders: request.headers,
  });
  return noStoreJson(answer.body, { status: answer.status });
}

/** Their yes, a change of how often and what, or their no. */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProjectToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-alerts-post", 30, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  const action = raw?.action;
  if (action !== "confirm" && action !== "update" && action !== "unsubscribe") {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  const frequency = raw.frequency === "daily" || raw.frequency === "weekly" || raw.frequency === "monthly" ? raw.frequency : null;

  const answer = await callAts(`/api/public/project-alerts/${token}`, {
    method: "POST",
    visitorHeaders: request.headers,
    body: { action, frequency, domains: stringList(raw.domains, 20), regions: stringList(raw.regions, 30) },
  });
  return noStoreJson(answer.body, { status: answer.status });
}
