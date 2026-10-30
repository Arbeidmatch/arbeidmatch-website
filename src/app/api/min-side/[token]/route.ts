import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { alertCitiesRequest, cityQuestionRequest, hiringRequest, isCityName, isHiringAction, isHiringPrefsAction, isProfileToken, isWhatsNewId } from "@/lib/min-side/profile";
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
 * One change from the page. Only the actions the ATS knows are passed on, with
 * the fields as plain values; the ATS decides what each may touch.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isProfileToken(token)) return noStoreJson({ error: INVALID_LINK }, { status: 404 });

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  }
  if (!raw || typeof raw !== "object") return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  const action = raw.action;
  // ORDER 170: the hiring settings save on every change, so they count in a bucket of their own and
  // ordinary use of the settings never reaches the general limit of the page's other changes.
  const rate = isHiringPrefsAction(action)
    ? getRateLimitResult(request, "min-side-prefs", 120, 10 * 60 * 1000)
    : getRateLimitResult(request, "min-side-post", 30, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: TOO_MANY }, { status: 429 });
  // ORDER 157: the hiring alerts and the account; each passed on with only its named fields, bounded.
  if (isHiringAction(action)) {
    const body = hiringRequest(raw);
    if (!body) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
    const answer = await callAts(`/api/public/client-profile/${token}`, { method: "POST", visitorHeaders: request.headers, body });
    return noStoreJson(answer.body, { status: answer.status });
  }
  if (
    action !== "company" &&
    action !== "contact" &&
    action !== "remove_contact" &&
    action !== "start_free_alerts" &&
    action !== "whats_new" &&
    action !== "staffing_request" &&
    action !== "alert_cities" &&
    action !== "city_question"
  )
    return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
  // ORDER 101: the towns of the alerts, as a short list of plain names; the ATS checks them against the county and the 30-day rule.
  if (action === "alert_cities") {
    if (!Array.isArray(raw.cities) || raw.cities.length > 50 || !raw.cities.every(isCityName)) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
    const answer = await callAts(`/api/public/client-profile/${token}`, { method: "POST", visitorHeaders: request.headers, body: alertCitiesRequest(raw.cities) });
    return noStoreJson(answer.body, { status: answer.status });
  }
  // ORDER 101: the one-time question about the suggested town, yes or no.
  if (action === "city_question") {
    if (raw.answer !== "yes" && raw.answer !== "no") return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
    const answer = await callAts(`/api/public/client-profile/${token}`, { method: "POST", visitorHeaders: request.headers, body: cityQuestionRequest(raw.answer) });
    return noStoreJson(answer.body, { status: answer.status });
  }
  // ORDER 100: "Planlegg bemanning med oss", passed on as plain short text; the ATS checks every field.
  if (action === "staffing_request") {
    const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : typeof v === "number" && Number.isFinite(v) ? String(v) : "");
    const body = { action, trade: text(raw.trade, 120), count: text(raw.count, 6), from: text(raw.from, 10), duration: text(raw.duration, 80), place: text(raw.place, 120), note: text(raw.note, 1000) };
    const answer = await callAts(`/api/public/client-profile/${token}`, { method: "POST", visitorHeaders: request.headers, body });
    return noStoreJson(answer.body, { status: answer.status });
  }
  // U1b: a tick in the What's new window, an item id and whether it was tried.
  if (action === "whats_new") {
    if (!isWhatsNewId(raw.id)) return noStoreJson({ error: BAD_REQUEST }, { status: 400 });
    const answer = await callAts(`/api/public/client-profile/${token}`, { method: "POST", visitorHeaders: request.headers, body: { action, id: raw.id, tried: raw.tried === true } });
    return noStoreJson(answer.body, { status: answer.status });
  }

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
