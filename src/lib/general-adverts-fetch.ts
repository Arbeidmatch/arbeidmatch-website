import "server-only";

import { atsBaseUrl } from "@/lib/jobs-fetch";

/**
 * ORDER 253: ArbeidMatch's own standing advert for one trade and county, read
 * from the ATS on every request (/api/public/general-adverts/<slug>), so an
 * advert approved there is on this site at once, and the ATS reads this page
 * back before it asks to post the advert on Facebook.
 */

export type GeneralAdvert = {
  id: string;
  slug: string;
  tradeKey: string;
  county: string;
  countyName: string;
  titleNo: string;
  titleEn: string;
  bodyNo: string;
  bodyEn: string;
  registerUrl: string;
  refreshedAt: string;
  demand: { active: number; firms: number; newThisWeek: number; readAt: string };
};

export async function fetchGeneralAdvert(slug: string): Promise<GeneralAdvert | null> {
  const clean = String(slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean) || clean.length > 80) return null;
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/general-adverts/${encodeURIComponent(clean)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { advert?: GeneralAdvert };
    const a = body.advert;
    if (!a || a.slug !== clean || !/^https:\/\//.test(a.registerUrl)) return null;
    return a;
  } catch {
    return null;
  }
}

/**
 * The advert body as blocks: a line in capitals ending in ":" is a heading,
 * "- " lines are a list, anything else a paragraph. The first line (the title)
 * is left out, the page prints it. Pure.
 */
export type Block = { kind: "h"; text: string } | { kind: "p"; text: string } | { kind: "ul"; items: string[] };

export function advertBlocks(body: string): Block[] {
  const lines = String(body ?? "").split(/\r?\n/).slice(1);
  const out: Block[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("- ")) {
      const last = out[out.length - 1];
      if (last?.kind === "ul") last.items.push(line.slice(2));
      else out.push({ kind: "ul", items: [line.slice(2)] });
    } else if (/^[\p{Lu}\s]+:?$/u.test(line) && line.length <= 40) out.push({ kind: "h", text: line.replace(/:$/, "") });
    else out.push({ kind: "p", text: line });
  }
  return out;
}
