import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isProjectToken } from "@/lib/prosjekter/format";
import { isProjectId } from "@/lib/min-side/project-detail";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string; id: string }> };

const NOT_FOUND = "Prosjektet ble ikke funnet.";
const TOO_MANY = "For mange forespørsler. Prøv igjen litt senere.";

/**
 * ORDER 273: one project of the client's alerts in full, for the detail on
 * the subscription's map page. The ATS answers only a project in this
 * subscription's own list (404 otherwise) and records that it was opened; this checks the
 * two shapes first, so a malformed address never reaches it, and passes the
 * answer on private and uncached from this site's own address.
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token, id } = await ctx.params;
  if (!isProjectToken(token) || !isProjectId(id)) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-alerts-project", 240, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const answer = await callAts(`/api/public/project-alerts/${token}/project/${id}`, { method: "GET", visitorHeaders: request.headers });
  if (answer.status === 404) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  return noStoreJson(answer.body, { status: answer.status });
}

/** "Se kunngjøringen": the tender documents' link while the competition is open; the ATS records the click. */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token, id } = await ctx.params;
  if (!isProjectToken(token) || !isProjectId(id)) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  const rate = getRateLimitResult(request, "prosjekter-alerts-project-tender", 60, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  const answer = await callAts(`/api/public/project-alerts/${token}/project/${id}`, { method: "POST", visitorHeaders: request.headers, body: {} });
  if (answer.status === 404) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  return noStoreJson(answer.body, { status: answer.status });
}
