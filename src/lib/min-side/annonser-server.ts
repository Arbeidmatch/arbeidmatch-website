import "server-only";

import { annonserFrom, type Annonser } from "@/lib/min-side/annonser";
import { logApiError } from "@/lib/secureLogger";

/**
 * ORDER 276: the server side of Min side's section Annonser. Server to server
 * with JobbOS, never from the browser:
 *
 *   GET <JOBBOS_MINSIDE_URL>/api/v1/min-side?org=<org.nr.>
 *   x-jobbos-key: <JOBBOS_MINSIDE_KEY, the same value on both sides>
 *
 * The organisation number is the one the ATS gave for this person's own key,
 * never one the page sends, so a key opens only its own firm's list.
 *
 * Owner switch: the section is asked for only for the organisation numbers in
 * JOBBOS_MINSIDE_ORGS (comma separated; "*" opens it for every firm). Unset,
 * or the URL or key missing, and nothing is asked and the section is absent.
 *
 * The links in the answer must point to the public board, JOBBOS_PUBLIC_URL
 * when the API is reached on another address, otherwise the API's own.
 *
 * Every load of Min side and every save on it reads the page again, so the
 * answer is kept a minute per firm (15 seconds after a failure) and JobbOS
 * gets two seconds: a slow JobbOS never holds the rest of the page.
 */

const KEY_HEADER = "x-jobbos-key";
const MIN_KEY_LENGTH = 32;
const ORG = /^\d{9}$/;
const KEEP_MS = 60_000;
const KEEP_FAILED_MS = 15_000;
const CACHE_MAX = 500;

export type JobbosConfig = { origin: string; publicOrigin: string; key: string; orgs: "all" | ReadonlySet<string> };

function httpsOrigin(raw: unknown): string | null {
  try {
    const url = new URL(String(raw ?? "").trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

/** The configuration, or null while any part is missing or malformed. */
export function jobbosConfig(env: Record<string, string | undefined> = process.env): JobbosConfig | null {
  const key = String(env.JOBBOS_MINSIDE_KEY ?? "").trim();
  if (key.length < MIN_KEY_LENGTH) return null;
  const origin = httpsOrigin(env.JOBBOS_MINSIDE_URL);
  if (!origin) return null;
  const publicRaw = String(env.JOBBOS_PUBLIC_URL ?? "").trim();
  const publicOrigin = publicRaw ? httpsOrigin(publicRaw) : origin;
  if (!publicOrigin) return null;
  const raw = String(env.JOBBOS_MINSIDE_ORGS ?? "").trim();
  if (raw === "*") return { origin, publicOrigin, key, orgs: "all" };
  const orgs = new Set(raw.split(",").map((s) => s.replace(/\s+/g, "")).filter((s) => ORG.test(s)));
  return orgs.size ? { origin, publicOrigin, key, orgs } : null;
}

/** The organisation number as the ATS wrote it, spaces taken out; null for anything else. */
export function orgOf(profileBody: unknown): string | null {
  const company = profileBody && typeof profileBody === "object" ? (profileBody as { company?: unknown }).company : null;
  const org = company && typeof company === "object" ? (company as { org_number?: unknown }).org_number : null;
  const clean = typeof org === "string" ? org.replace(/\s+/g, "") : "";
  return ORG.test(clean) ? clean : null;
}

/** Whether the owner switch opens the section for this firm. */
export function switchedOn(config: JobbosConfig, org: string): boolean {
  return config.orgs === "all" || config.orgs.has(org);
}

const kept = new Map<string, { until: number; value: Annonser | null }>();

/** Forget every kept answer (tests). */
export function forgetAnnonser(): void {
  kept.clear();
}

async function ask(config: JobbosConfig, org: string, doFetch: typeof fetch, timeoutMs: number): Promise<Annonser | null> {
  try {
    const res = await doFetch(`${config.origin}/api/v1/min-side?org=${org}`, {
      method: "GET",
      headers: { Accept: "application/json", [KEY_HEADER]: config.key },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      logApiError("min-side/annonser", new Error(`jobbos answered ${res.status}`), { status: res.status });
      return { state: "unavailable" };
    }
    const body = (await res.json().catch(() => null)) as unknown;
    const firm = body && typeof body === "object" ? (body as { ok?: unknown; firm?: unknown }) : null;
    // JobbOS's plain "no such firm": the section is simply not there.
    if (firm?.ok === true && firm.firm === null) return null;
    const section = annonserFrom(body, config.publicOrigin);
    if (section) return section;
    logApiError("min-side/annonser", new Error("jobbos answer refused for its shape or links"), {});
    return { state: "unavailable" };
  } catch (error) {
    logApiError("min-side/annonser", error, {});
    return { state: "unavailable" };
  }
}

/**
 * The section for one firm. Null when the switch is off for it, nothing is
 * configured, or JobbOS knows no active firm that chose adverts by that
 * number; "unavailable" when JobbOS could not be asked. Never throws.
 */
export async function annonserFor(
  org: string | null,
  options: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch; timeoutMs?: number; now?: number } = {},
): Promise<Annonser | null> {
  const config = jobbosConfig(options.env);
  if (!config || !org || !switchedOn(config, org)) return null;
  const now = options.now ?? Date.now();
  const hit = kept.get(org);
  if (hit && hit.until > now) return hit.value;
  const value = await ask(config, org, options.fetchImpl ?? fetch, options.timeoutMs ?? 2_000);
  if (kept.size >= CACHE_MAX) kept.clear();
  kept.set(org, { until: now + (value?.state === "unavailable" ? KEEP_FAILED_MS : KEEP_MS), value });
  return value;
}
