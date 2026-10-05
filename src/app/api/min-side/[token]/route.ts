import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isProfileToken } from "@/lib/min-side/profile";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

const INVALID_LINK = "Lenken er ikke gyldig lenger.";
const BAD_REQUEST = "Ugyldig forespørsel.";
const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";

/** A client's own page: what we hold about their firm and what was addressed to them. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProfileToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "min-side-get", 120, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const answer = await callAts(`/api/public/client-profile/${token}`, { method: "GET", visitorHeaders: request.headers });
  return noStoreJson(answer.body, { status: answer.status });
}

/**
 * One change from the page. Only the three the ATS knows are passed on, with
 * the fields as plain values; the ATS decides what each may touch.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProfileToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });
  const rate = getRateLimitResult(request, "min-side-post", 30, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  const action = raw?.action;
  if (action !== "company" && action !== "contact" && action !== "remove_contact" && action !== "start_free_alerts") return noStoreJson({ error: BAD_REQUEST }, { status: 400 });

  const plain = (value: unknown): Record<string, string | boolean> => {
    const out: Record<string, string | boolean> = {};
    if (!value || typeof value !== "object") return out;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!/^[a-z_]{2,40}$/.test(k)) continue;
      if (typeof v === "boolean") out[k] = v;
      else if (typeof v === "string") out[k] = v.slice(0, 300);
    }
    return out;
  };
  const id = typeof raw.id === "string" && isProfileToken(raw.id) ? raw.id : undefined;
  const body = action === "start_free_alerts" ? { action } : action === "remove_contact" ? { action, id } : action === "contact" ? { action, id, details: plain(raw.details) } : { action, details: plain(raw.details) };

  const answer = await callAts(`/api/public/client-profile/${token}`, { method: "POST", visitorHeaders: request.headers, body });
  return noStoreJson(answer.body, { status: answer.status });
}
