import { DOMAINS, domainLabel, domainsOf, type DomainKey } from "@/lib/prosjekter/domains";
import { LEGACY_REGIONS, NORWAY_REGIONS, type FutureProjectStage } from "@/lib/prosjekter/regions";

/**
 * The words a client reads about a project, in Norwegian.
 *
 * Pure functions copied from the ATS (src/lib/project-alerts/alerts.ts there)
 * and kept identical in behaviour, so a project reads the same in a letter from
 * the ATS and on these pages. Nothing here names where the projects come from,
 * and cleanDescription / readableText take every web address out of a text.
 */

export type Frequency = "daily" | "weekly" | "monthly";
export const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly"];
export const FREQUENCY_NO: Record<Frequency, string> = {
  daily: "Hver dag",
  weekly: "Hver uke",
  monthly: "Hver måned",
};

/** A project as the subscription page receives it from the ATS. */
export type AlertProject = {
  id: string;
  project_no: number | null;
  stage: FutureProjectStage;
  title: string;
  description: string | null;
  buyer_name: string | null;
  regions: string[];
  city: string | null;
  cpv_codes: string[];
  estimated_value_nok: number | null;
  awarded_value_nok: number | null;
  published_on: string | null;
  deadline_at: string | null;
  start_on: string | null;
  end_on: string | null;
  winners: { name: string; orgnr?: string | null }[];
  /** The buyer's tender platform, only while the competition is open. */
  documents_url: string | null;
};

export const STAGE_NO: Record<FutureProjectStage, string> = {
  planned: "Planlagt",
  tender: "Åpen konkurranse",
  awarded: "Tildelt",
  cancelled: "Avlyst",
};

export function stageNo(p: Pick<AlertProject, "stage" | "deadline_at">, now = Date.now()): string {
  if (p.stage === "tender" && p.deadline_at && Date.parse(p.deadline_at) < now) return "Venter på tildeling";
  return STAGE_NO[p.stage];
}

export function regionNo(regions: string[]): string {
  return regions
    .map((r) => NORWAY_REGIONS[r])
    .filter(Boolean)
    .join(", ");
}

export function placeNo(p: Pick<AlertProject, "city" | "regions">): string {
  const county = regionNo(p.regions);
  return p.city ? (county ? `${p.city}, ${county}` : p.city) : county;
}

const nok = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });

export function valueNo(p: Pick<AlertProject, "awarded_value_nok" | "estimated_value_nok">): string | null {
  const v = p.awarded_value_nok ?? p.estimated_value_nok;
  if (!v || v <= 0) return null;
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m >= 10 ? nok.format(Math.round(m)) : String(Math.round(m * 10) / 10).replace(".", ",")} mill. kr`;
  }
  return `${nok.format(Math.round(v))} kr`;
}

const dateNo = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Oslo",
});

export function formatDateNo(iso: string | null | undefined): string | null {
  const ms = iso ? Date.parse(String(iso).length === 10 ? `${iso}T00:00:00Z` : String(iso)) : NaN;
  return Number.isFinite(ms) ? dateNo.format(new Date(ms)) : null;
}

/** The one date that matters for the stage, named in Norwegian. */
export function keyDateNo(
  p: Pick<AlertProject, "stage" | "deadline_at" | "start_on" | "published_on">,
  now = Date.now(),
): string | null {
  if (p.stage === "tender" && p.deadline_at && Date.parse(p.deadline_at) >= now)
    return `Tilbudsfrist ${formatDateNo(p.deadline_at)}`;
  if (p.start_on) return `Oppstart ${formatDateNo(p.start_on)}`;
  if (p.published_on) return `Kunngjort ${formatDateNo(p.published_on)}`;
  return null;
}

/** A short description with any web address taken out: no link may lead to the source. */
export function cleanDescription(text: string | null | undefined, max = 320): string | null {
  const s = String(text ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")} ...` : s;
}

/** Today's counties, for a client to choose among; an old one is found under the ones it became. */
export function regionChoices(): { code: string; label: string }[] {
  return Object.entries(NORWAY_REGIONS)
    .filter(([code]) => !LEGACY_REGIONS[code])
    .map(([code, label]) => ({ code, label }));
}

export function domainChoices(): { key: DomainKey; label: string }[] {
  return DOMAINS.map((d) => ({ key: d.key, label: d.no }));
}

export function domainsNo(p: Pick<AlertProject, "cpv_codes">): string[] {
  return domainsOf(p.cpv_codes).map((d) => domainLabel(d, "no"));
}

/** The notice's description with the full stops the register ran together put back ("tilbud.Forhandlinger"). */
export function readableText(text: string | null | undefined): string[] {
  const s = String(text ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/([.!?:])([A-ZÆØÅ])/g, "$1 $2")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (!s) return [];
  // Paragraphs where the notice has them, otherwise every three sentences.
  const blocks = s
    .split(/\n{2,}|\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length > 1) return blocks;
  const sentences = s.split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) out.push(sentences.slice(i, i + 3).join(" "));
  return out;
}

/** A presentation or subscription token: a uuid, the same check the ATS makes. */
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProjectToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}
