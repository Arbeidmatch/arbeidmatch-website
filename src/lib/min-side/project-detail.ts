/**
 * ORDER 273: one project of a client's alerts in full, as the ATS answers it
 * for Min side (client-profile/<access>/project/<id>) and for the map page
 * (project-alerts/<subscription>/project/<id>). The ATS answers only a project
 * that is in that subscription's own list; this reads the answer defensively.
 * Also the register report behind "Sjekk firma".
 */

export type Firm = { name: string; orgnr: string | null; town: string | null; industry: string | null };

export type SubscriberProjectDetail = {
  id: string;
  project_no: number | null;
  stage: string;
  stage_label: string;
  title: string;
  description: string | null;
  buyer_name: string | null;
  buyer: Firm | null;
  regions: string[];
  city: string | null;
  place: string | null;
  domains: string[];
  trades: string[];
  cpv_codes: string[];
  estimated_value_nok: number | null;
  awarded_value_nok: number | null;
  published_on: string | null;
  deadline_at: string | null;
  start_on: string | null;
  end_on: string | null;
  duration_text: string | null;
  tenders_received: number | null;
  contract_signed_on: string | null;
  winners: Firm[];
  details: { label: string; value: string }[];
  tender_open: boolean;
  first_seen_at: string;
};

/** A project id as the ATS writes them, nothing that could change a path. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isProjectId(value: unknown): value is string {
  return typeof value === "string" && ID.test(value);
}

const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
const strOrNull = (v: unknown, max = 300) => str(v, max).trim() || null;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
const whole = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);
const when = (v: unknown) => (typeof v === "string" && Number.isFinite(Date.parse(v)) ? v.slice(0, 40) : null);
const list = (v: unknown, max = 30, len = 60) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, len)).slice(0, max) : []);

function firmFrom(raw: unknown): Firm | null {
  const r = obj(raw);
  const name = str(r?.name, 200).trim();
  if (!r || !name) return null;
  const orgnr = str(r.orgnr, 20).replace(/\D/g, "");
  return { name, orgnr: orgnr.length === 9 ? orgnr : null, town: strOrNull(r.town, 80), industry: strOrNull(r.industry, 160) };
}

export function projectDetailFrom(raw: unknown): SubscriberProjectDetail | null {
  const p = obj(obj(raw)?.project);
  if (!p || !isProjectId(p.id) || typeof p.title !== "string") return null;
  return {
    id: String(p.id),
    project_no: whole(p.project_no),
    stage: str(p.stage, 20),
    stage_label: str(p.stage_label, 60),
    title: str(p.title, 400),
    description: strOrNull(p.description, 20000),
    buyer_name: strOrNull(p.buyer_name, 200),
    buyer: firmFrom(p.buyer),
    regions: list(p.regions),
    city: strOrNull(p.city, 80),
    place: strOrNull(p.place, 80),
    domains: list(p.domains),
    trades: list(p.trades),
    cpv_codes: list(p.cpv_codes, 60, 20),
    estimated_value_nok: num(p.estimated_value_nok),
    awarded_value_nok: num(p.awarded_value_nok),
    published_on: when(p.published_on),
    deadline_at: when(p.deadline_at),
    start_on: when(p.start_on),
    end_on: when(p.end_on),
    duration_text: strOrNull(p.duration_text, 120),
    tenders_received: whole(p.tenders_received),
    contract_signed_on: when(p.contract_signed_on),
    winners: (Array.isArray(p.winners) ? p.winners : []).map(firmFrom).filter((w): w is Firm => w !== null).slice(0, 20),
    details: (Array.isArray(p.details) ? p.details : [])
      .map(obj)
      .filter((d): d is Record<string, unknown> => d !== null && typeof d.label === "string" && typeof d.value === "string")
      .map((d) => ({ label: str(d.label, 120), value: str(d.value, 4000) }))
      .slice(0, 200),
    tender_open: p.tender_open === true,
    first_seen_at: str(p.first_seen_at, 40),
  };
}

/** The tender documents' link from the POST answer, only over https. */
export function tenderUrlFrom(raw: unknown): string | null {
  const u = obj(raw)?.url;
  if (typeof u !== "string") return null;
  try {
    return new URL(u).protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/** The dates of the horizontal timeline, only those that exist, in order. */
export function timelineOf(p: Pick<SubscriberProjectDetail, "published_on" | "deadline_at" | "contract_signed_on" | "start_on" | "stage">): { label: string; at: string }[] {
  const out: { label: string; at: string }[] = [];
  if (p.published_on) out.push({ label: "Kunngjort", at: p.published_on });
  if (p.deadline_at) out.push({ label: "Tilbudsfrist", at: p.deadline_at });
  if (p.contract_signed_on) out.push({ label: "Tildelt", at: p.contract_signed_on });
  if (p.start_on) out.push({ label: "Byggestart", at: p.start_on });
  return out;
}

/** "Delkontrakt" details as small cards: the name, then a value and a winner when the line says them ("Navn · 2 mill. kr · Firma AS"). */
export function lotsOf(details: { label: string; value: string }[]): { name: string; value: string | null; winner: string | null }[] {
  return details
    .filter((d) => d.label === "Delkontrakt")
    .map((d) => {
      const parts = d.value.split(/\s+·\s+/);
      return { name: parts[0] ?? d.value, value: parts[1] ?? null, winner: parts[2] ?? null };
    });
}

// ---------------------------------------------------------------------------
// "Sjekk firma": the public registers' facts about the client's own firm.
// ---------------------------------------------------------------------------

export type CompanyReport = { updated_at: string; groups: { title: string; rows: { label: string; value: string }[]; footer: string | null }[] };

export function companyReportFrom(raw: unknown): CompanyReport | null {
  const r = obj(obj(raw)?.report);
  if (!r || !Array.isArray(r.groups)) return null;
  const groups = r.groups
    .map(obj)
    .filter((g): g is Record<string, unknown> => g !== null && typeof g.title === "string")
    .map((g) => ({
      title: str(g.title, 80),
      rows: (Array.isArray(g.rows) ? g.rows : [])
        .map(obj)
        .filter((x): x is Record<string, unknown> => x !== null && typeof x.label === "string" && typeof x.value === "string")
        .map((x) => ({ label: str(x.label, 80), value: str(x.value, 600) }))
        .slice(0, 40),
      footer: strOrNull(g.footer, 2000),
    }))
    .slice(0, 12);
  return { updated_at: str(r.updated_at, 40), groups };
}
