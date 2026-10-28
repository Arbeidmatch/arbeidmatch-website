/**
 * "Min side": what the ATS answers for a client's own page, read defensively,
 * and the few things the page works out itself.
 *
 * The owner's decision of 30 September 2026: a client has their own page, like
 * a candidate, with the details we hold about their firm. The page lives here
 * on arbeidmatch.no; the data and every rule about who may see or change what
 * are the ATS's (its lib/client-profile). This file only shapes the answer for
 * the screen and refuses anything that does not look like what it expects.
 */

import { domainLabel, isDomainKey } from "@/lib/prosjekter/domains";
import { NORWAY_REGIONS } from "@/lib/prosjekter/regions";

export type Company = {
  name: string;
  org_number: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  billing_same_as_address: boolean;
  billing_address: string;
  billing_postal_code: string;
  billing_city: string;
  invoice_email: string;
  invoice_ehf: boolean;
  invoice_reference: string;
};

export type Contact = { id: string; full_name: string; role: string; email: string; phone: string; mine: boolean };

export type Plan = {
  status: "free" | "paid" | "ended";
  until: string | null;
  nextInvoiceOn: string | null;
  cancelled: boolean;
  freeOnly: boolean;
  periodPrice: number;
  billing: "yearly" | "quarterly";
  offer_url: string | null;
};

/** One project of the person's alerts, as Min side lists it (12 October 2026). */
export type MinSideProject = {
  id: string;
  title: string;
  stage: "planned" | "tender" | "awarded";
  buyer_name: string | null;
  regions: string[];
  city: string | null;
  domains: string[];
  description: string | null;
  estimated_value_nok: number | null;
  awarded_value_nok: number | null;
  published_on: string | null;
  deadline_at: string | null;
  documents_url: string | null;
  winners: string[];
  /** ORDER 101: the project's town, the real one or one derived by the ATS; null shows "Sted ikke oppgitt". */
  place: string | null;
};

/** ORDER 100: the subscription's fields (domain keys) and counties (NUTS codes), to preset the staffing request. */
export type AlertChoices = { domains: string[]; regions: string[] };

/** ORDER 101: a town to choose among, with how many of the projects are there. */
export type CityOption = { name: string; count: number };
/** ORDER 101: the one-time question, while it is unanswered: the suggested towns and the county they are in. */
export type CityQuestion = { cities: string[]; county: string };

export type Alerts = {
  plan: Plan | null;
  free_until: string | null;
  projects_url: string | null;
  projects: MinSideProject[];
  choices?: AlertChoices;
  /** ORDER 101: the towns chosen; empty means the whole county. */
  cities?: string[];
  city_options?: CityOption[];
  /** ORDER 101: the day before which the towns cannot change again; null when they may change now. */
  next_city_change?: string | null;
  city_question?: CityQuestion | null;
  /** ORDER 101: YYYY-MM-DD, the last day of a free trial; null when the alerts are not a trial. */
  trial_until?: string | null;
};

/** ORDER 101: our contact person, shown at the side of Min side. */
export type ContactPerson = { name: string; role: string; phone: string; avatar_url: string | null };
export type Offer = { number: string; title: string; state: string; open: boolean; sent_at: string | null; url: string | null };
export type SignedDocument = { title: string; signed_at: string | null; pdf_url: string | null };

/** A weekly timeliste: one that waits for this person's signature, with the way to it, or one they signed. */
export type WaitingTimesheet = { title: string; sent_at: string | null; url: string | null };
export type Timesheets = { waiting: WaitingTimesheet[]; signed: SignedDocument[] };

export type Invoice = { id: number; number: string; date: string | null; due: string | null; amount: number; outstanding: number; state: string; state_key: "paid" | "open" | "overdue" | "credit" };
/** The firm's invoices, for the person at its invoice address; `allowed` false for anybody else. */
export type Invoices = {
  allowed: boolean;
  rows: Invoice[];
  /** The ATS hands the PDF only to a signed-in session (ORDER G2), so the page draws no link that cannot work. */
  pdf_requires_sign_in: boolean;
};

export type CandidatePresentation = { title: string; sent_at: string | null; state: string; url: string | null };

export type Profile = {
  me: { email: string; contact_id: string | null };
  company: Company;
  contacts: Contact[];
  alerts: Alerts | null;
  /** ORDER 50: free months this person may switch on themselves; null when none. */
  free_alerts: { months: number } | null;
  offers: Offer[];
  documents: SignedDocument[];
  timesheets: Timesheets;
  invoices: Invoices;
  candidates: CandidatePresentation[];
  /** U1b: the improvements this person has not ticked yet; empty from an older ATS. */
  whats_new: WhatsNewEntry[];
  /** ORDER 101: our contact person for this client; null leaves the card out. */
  contact_person: ContactPerson | null;
  /** ORDER 157: Bedrifter som ansetter; null for a person without hiring alerts. */
  hiring: Hiring | null;
};

export type WhatsNewEntry = { id: string; title: string; detail: string; variants: string[]; link: string | null };

/** An item id as the ATS writes them: a date and words, nothing that could be anything else. */
export function isWhatsNewId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-z-]{4,80}$/.test(value);
}

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The key to a person's page, as the ATS hands it out: nothing that could change a path. */
export function isProfileToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN.test(value);
}

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v : null);

/**
 * A link the ATS sent, kept only when it leads to one of our own two sites over
 * https, or to a path on this one. Anything else is not shown as a link.
 */
export function ownLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^\/(prosjekter|prosjekt|min-side)\/[A-Za-z0-9-]{6,80}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    return host === "ats.arbeidmatch.no" || host === "www.arbeidmatch.no" || host === "arbeidmatch.no" ? url.toString() : null;
  } catch {
    return null;
  }
}

function planFrom(raw: unknown): Plan | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!r) return null;
  const status = r.status === "paid" || r.status === "ended" ? r.status : r.status === "free" ? "free" : null;
  if (!status) return null;
  return {
    status,
    until: day(r.until),
    nextInvoiceOn: day(r.nextInvoiceOn),
    cancelled: r.cancelled === true,
    freeOnly: r.freeOnly === true,
    periodPrice: typeof r.periodPrice === "number" && Number.isFinite(r.periodPrice) ? r.periodPrice : 0,
    billing: r.billing === "quarterly" ? "quarterly" : "yearly",
    offer_url: ownLink(r.offer_url),
  };
}

const numOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
const strings = (v: unknown, max = 20, len = 40) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, len)).slice(0, max) : []);

/** A link to the tender's documents, only over https; anything else is not a link. */
function httpsLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function projectsFrom(raw: unknown): MinSideProject[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object" && typeof (p as { id?: unknown }).id === "string")
    .filter((p) => p.stage === "planned" || p.stage === "tender" || p.stage === "awarded")
    .map((p) => ({
      id: String(p.id).slice(0, 60),
      title: str(p.title, 300),
      stage: p.stage as MinSideProject["stage"],
      buyer_name: str(p.buyer_name, 200) || null,
      regions: strings(p.regions),
      city: str(p.city, 80) || null,
      domains: strings(p.domains),
      description: str(p.description, 400) || null,
      estimated_value_nok: numOrNull(p.estimated_value_nok),
      awarded_value_nok: numOrNull(p.awarded_value_nok),
      published_on: day(p.published_on),
      deadline_at: typeof p.deadline_at === "string" ? p.deadline_at.slice(0, 40) : null,
      documents_url: httpsLink(p.documents_url),
      winners: strings(p.winners, 10, 120),
      place: str(p.place, 80).trim() || null,
    }))
    .slice(0, 200);
}

function choicesFrom(raw: unknown): AlertChoices {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const codes = (v: unknown) => strings(v).filter((x) => /^[A-Za-z0-9_-]{2,20}$/.test(x));
  return { domains: codes(r.domains), regions: codes(r.regions) };
}

/** A town's name as the page accepts it: letters, spaces, hyphens and dots, nothing that could be markup. */
export function isCityName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 2 && value.length <= 60 && /^\p{L}[\p{L} .'-]*$/u.test(value.trim());
}

const cityList = (v: unknown, max = 50) => (Array.isArray(v) ? [...new Set(v.filter(isCityName).map((x) => x.trim()))].slice(0, max) : []);

function cityOptionsFrom(raw: unknown): CityOption[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((o): o is Record<string, unknown> => Boolean(o) && typeof o === "object" && isCityName((o as { name?: unknown }).name))
    .map((o) => ({ name: String(o.name).trim(), count: typeof o.count === "number" && Number.isFinite(o.count) && o.count > 0 ? Math.round(o.count) : 0 }))
    .slice(0, 80);
}

function cityQuestionFrom(raw: unknown): CityQuestion | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!r) return null;
  const cities = cityList(r.cities, 5);
  const county = str(r.county, 60).trim();
  return cities.length && county ? { cities, county } : null;
}

/** Our contact person, with a photo only over https and a phone only as digits, spaces and a plus. */
function contactPersonFrom(raw: unknown): ContactPerson | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  const name = str(r?.name, 120).trim();
  if (!r || !name) return null;
  const phone = str(r.phone, 24).trim();
  return { name, role: str(r.role, 80).trim(), phone: /^\+?[0-9 ]{5,20}$/.test(phone) ? phone : "", avatar_url: httpsLink(r.avatar_url) };
}

function alertsFrom(a: Record<string, unknown>): Alerts {
  return {
    plan: planFrom(a.plan),
    free_until: day(a.free_until),
    projects_url: ownLink(a.projects_url),
    projects: projectsFrom(a.projects),
    choices: choicesFrom(a.choices),
    cities: cityList(a.cities),
    city_options: cityOptionsFrom(a.city_options),
    next_city_change: day(a.next_city_change),
    city_question: cityQuestionFrom(a.city_question),
    trial_until: day(a.trial_until),
  };
}

/** The ATS's answer as the page uses it, or null when it is not a page at all. */
export function profileFrom(raw: unknown): Profile | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  const c = (r?.company && typeof r.company === "object" ? r.company : null) as Record<string, unknown> | null;
  const me = (r?.me && typeof r.me === "object" ? r.me : null) as Record<string, unknown> | null;
  if (!r || !c || !me || typeof c.name !== "string") return null;
  const list = (v: unknown) => (Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : []);
  const a = (r.alerts && typeof r.alerts === "object" ? r.alerts : null) as Record<string, unknown> | null;
  // An older ATS sends none of the three below; the page then shows them empty rather than failing.
  const t = (r.timesheets && typeof r.timesheets === "object" ? r.timesheets : null) as Record<string, unknown> | null;
  const inv = (r.invoices && typeof r.invoices === "object" ? r.invoices : null) as Record<string, unknown> | null;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const signedList = (v: unknown): SignedDocument[] =>
    list(v)
      .map((d) => ({ title: str(d.title, 200), signed_at: typeof d.signed_at === "string" ? d.signed_at : null, pdf_url: ownLink(d.pdf_url) }))
      .slice(0, 100);
  return {
    me: { email: str(me.email, 254), contact_id: typeof me.contact_id === "string" ? me.contact_id : null },
    company: {
      name: str(c.name),
      org_number: str(c.org_number, 20),
      address: str(c.address),
      postal_code: str(c.postal_code, 12),
      city: str(c.city, 80),
      phone: str(c.phone, 24),
      email: str(c.email, 254),
      billing_same_as_address: c.billing_same_as_address === true,
      billing_address: str(c.billing_address),
      billing_postal_code: str(c.billing_postal_code, 12),
      billing_city: str(c.billing_city, 80),
      invoice_email: str(c.invoice_email, 254),
      invoice_ehf: c.invoice_ehf === true,
      invoice_reference: str(c.invoice_reference, 120),
    },
    contacts: list(r.contacts)
      .filter((k) => typeof k.id === "string")
      .map((k) => ({ id: String(k.id), full_name: str(k.full_name, 120), role: str(k.role, 80), email: str(k.email, 254), phone: str(k.phone, 24), mine: k.mine === true }))
      .slice(0, 100),
    alerts: a ? alertsFrom(a) : null,
    free_alerts: freeAlertsFrom(r.free_alerts),
    offers: list(r.offers)
      .map((o) => ({ number: str(o.number, 40), title: str(o.title, 120), state: str(o.state, 40), open: o.open === true, sent_at: typeof o.sent_at === "string" ? o.sent_at : null, url: ownLink(o.url) }))
      .slice(0, 50),
    documents: signedList(r.documents),
    timesheets: {
      waiting: list(t?.waiting)
        .map((w) => ({ title: str(w.title, 200), sent_at: typeof w.sent_at === "string" ? w.sent_at : null, url: ownLink(w.url) }))
        .slice(0, 50),
      signed: signedList(t?.signed),
    },
    invoices: {
      allowed: inv?.allowed === true,
      // Unless the ATS says plainly that the PDF can be fetched, it is treated as closed.
      pdf_requires_sign_in: inv?.pdf_requires_sign_in !== false,
      rows: list(inv?.rows)
        .filter((i) => typeof i.id === "number" && Number.isFinite(i.id))
        .map((i) => ({
          id: i.id as number,
          number: str(i.number, 20),
          date: day(i.date),
          due: day(i.due),
          amount: num(i.amount),
          outstanding: num(i.outstanding),
          state: str(i.state, 40),
          state_key: (i.state_key === "paid" || i.state_key === "overdue" || i.state_key === "credit" ? i.state_key : "open") as Invoice["state_key"],
        }))
        .slice(0, 200),
    },
    candidates: list(r.candidates)
      .map((k) => ({ title: str(k.title, 200), sent_at: typeof k.sent_at === "string" ? k.sent_at : null, state: str(k.state, 60), url: ownLink(k.url) }))
      .slice(0, 50),
    whats_new: list(r.whats_new)
      .filter((w) => isWhatsNewId(w.id))
      .map((w) => ({
        id: String(w.id),
        title: str(w.title, 160),
        detail: str(w.detail, 600),
        variants: Array.isArray(w.variants) ? w.variants.filter((v): v is string => typeof v === "string").map((v) => v.slice(0, 160)).slice(0, 6) : [],
        link: ownLink(w.link),
      }))
      .slice(0, 10),
    contact_person: contactPersonFrom(r.contact_person),
    hiring: hiringFrom(r.hiring),
  };
}

/** 912345678 as the register prints it: 912 345 678. */
export function orgNumberNo(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 9 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : raw.trim();
}

const nok = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });
const dateNo = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function dayNo(iso: string | null): string {
  const ms = iso ? Date.parse(`${iso.slice(0, 10)}T12:00:00Z`) : NaN;
  return Number.isFinite(ms) ? dateNo.format(new Date(ms)) : "";
}

/** Where the project alerts stand, in two sentences: a heading and what follows. */
/** The free months offered to a firm we worked with (ORDER 50), whole and between 1 and 36, or null. */
export function freeAlertsFrom(v: unknown): { months: number } | null {
  const months = Number((v as { months?: unknown } | null)?.months);
  return Number.isInteger(months) && months >= 1 && months <= 36 ? { months } : null;
}

export function alertsWords(alerts: Alerts | null, freeMonths: number | null = null): { title: string; text: string } {
  const plan = alerts?.plan ?? null;
  // ORDER 101: a trial says it is a trial, never the old thank-you words.
  if (alerts?.trial_until && plan?.status !== "ended") {
    const trial = `Gratis prøveperiode til og med ${dayNo(alerts.trial_until)}.`;
    if (plan && plan.status === "free" && !plan.freeOnly && !plan.cancelled && plan.periodPrice > 0) {
      const price = `kr ${nok.format(Math.round(plan.periodPrice)).replace(/[  ]/g, " ")} ${plan.billing === "yearly" ? "per år" : "per kvartal"}`;
      return { title: "Gratis prøveperiode", text: `${trial} Deretter fortsetter abonnementet: ${price} uten merverdiavgift${plan.nextInvoiceOn ? `, første faktura ${dayNo(plan.nextInvoiceOn)}` : ""}.` };
    }
    return { title: "Gratis prøveperiode", text: trial };
  }
  if (!alerts && freeMonths)
    return { title: `Gratis prosjektvarsler i ${freeMonths === 1 ? "1 måned" : `${freeMonths} måneder`}`, text: "Som takk for samarbeidet. Varslene stopper av seg selv når perioden er over, uten faktura." };
  if (!alerts) return { title: "Ingen prosjektvarsler ennå", text: "Dere kan følge bygg- og anleggsprosjekter der dere jobber. Se prosjektkartet, eller ta kontakt med oss." };
  if (!plan) {
    return alerts.free_until
      ? { title: `Gratis til ${dayNo(alerts.free_until)}`, text: "Prosjektvarslene er gratis som takk for samarbeidet." }
      : { title: "Prosjektvarsler", text: "Dere får prosjektvarsler fra oss." };
  }
  const until = dayNo(plan.until);
  const price = `kr ${nok.format(Math.round(plan.periodPrice)).replace(/[  ]/g, " ")} ${plan.billing === "yearly" ? "per år" : "per kvartal"}`;
  if (plan.status === "ended") return { title: "Abonnementet er avsluttet", text: "Dere får ikke flere prosjektvarsler. Ta kontakt hvis dere vil starte igjen." };
  if (plan.freeOnly) return { title: `Gratis til ${until}`, text: "Abonnementet avsluttes da, uten faktura." };
  if (plan.cancelled) return { title: `Abonnementet avsluttes ${until}`, text: "Dere har sagt opp. Dere får varsler frem til da, og det kommer ingen ny faktura." };
  if (plan.status === "free") return { title: `Gratis til ${until}`, text: `Deretter fortsetter abonnementet: ${price} uten merverdiavgift, første faktura ${dayNo(plan.nextInvoiceOn)}.` };
  return { title: `Betalt til ${until}`, text: `Abonnementet fornyes ${dayNo(plan.nextInvoiceOn)} for ${price} uten merverdiavgift, hvis dere ikke sier opp før.` };
}

/** One line for an address: the street, then the postcode and town. */
export function addressLine(street: string, postcode: string, town: string): string {
  return [street.trim(), [postcode.trim(), town.trim()].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

// ---------------------------------------------------------------------------
// The page in sections, one on screen at a time.
// ---------------------------------------------------------------------------

/**
 * The owner's word on the first version, 30 September 2026: everything on one
 * sheet was mixed together; it has to be well divided so it does not confuse.
 * So the page is sections, each with a name, one line that says what it is,
 * and nothing of another section in it.
 *
 * The same day the timesheets, the invoices and the candidates came onto the
 * page ("da fa le acum"), each as a section of its own. With nine of them the
 * list is in two groups: what the firm is, and what passes between us.
 * "Fakturaopplysninger" is where invoices are sent; "Fakturaer" is the
 * invoices themselves. They are two sections because they are two questions.
 */
export type SectionKey = "firma" | "fakturaopplysninger" | "kontakter" | "kandidater" | "tilbud" | "timelister" | "fakturaer" | "dokumenter" | "varsler" | "ansetter";

export type SectionGroup = "firmaet" | "samarbeidet";
export const SECTION_GROUPS: { key: SectionGroup; label: string }[] = [
  { key: "firmaet", label: "Firmaet" },
  { key: "samarbeidet", label: "Samarbeidet med oss" },
];

export const SECTIONS: { key: SectionKey; group: SectionGroup; label: string; about: string }[] = [
  { key: "firma", group: "firmaet", label: "Firma", about: "Opplysningene vi har om firmaet deres." },
  // The label carries a soft hyphen (written as its escape so it can be seen): on a phone the long word breaks at its joint.
  { key: "fakturaopplysninger", group: "firmaet", label: "Faktura­opplysninger", about: "Hvor og hvordan fakturaene fra oss sendes." },
  { key: "kontakter", group: "firmaet", label: "Kontaktpersoner", about: "Personene vi kan kontakte hos dere." },
  { key: "kandidater", group: "samarbeidet", label: "Kandidater", about: "Kandidatene vi har presentert for deg." },
  { key: "tilbud", group: "samarbeidet", label: "Tilbud", about: "Tilbud fra oss til deg: de som venter på svar, og de som er besvart." },
  { key: "timelister", group: "samarbeidet", label: "Timelister", about: "Timelistene du skal signere, og de du har signert." },
  { key: "fakturaer", group: "samarbeidet", label: "Fakturaer", about: "Fakturaene fra oss til firmaet, med status." },
  { key: "dokumenter", group: "samarbeidet", label: "Signerte dokumenter", about: "Avtaler og tilbud du har signert hos oss, som PDF." },
  { key: "varsler", group: "samarbeidet", label: "Prosjektvarsler", about: "Varslene om bygg- og anleggsprosjekter, og abonnementet." },
  // ORDER 157: only in the list for a person with hiring alerts (visibleSections).
  { key: "ansetter", group: "samarbeidet", label: "Bedrifter som ansetter", about: "Firmaer som ansetter i fylkene og fagene deres." },
];

/** The sections this person's list shows: "Bedrifter som ansetter" only with hiring alerts. */
export function visibleSections(p: Pick<Profile, "hiring">): typeof SECTIONS {
  return SECTIONS.filter((s) => s.key !== "ansetter" || p.hiring !== null);
}

/** The section an address asks for (#fakturaer), or null for anything else, a dialog's hash included. */
export function sectionFromHash(hash: string): SectionKey | null {
  const key = hash.replace(/^#/, "");
  // A link made before the invoice details got their longer name.
  if (key === "faktura") return "fakturaopplysninger";
  return SECTIONS.some((s) => s.key === key) ? (key as SectionKey) : null;
}

const count = (n: number, one: string, many: string, none: string) => (n === 0 ? none : n === 1 ? `1 ${one}` : `${n} ${many}`);

/** A few words under a section's name in the list, so the list already says where things stand. */
export function sectionHint(key: SectionKey, p: Profile): string {
  if (key === "firma") return p.company.city || "Adresse og kontakt";
  if (key === "fakturaopplysninger") return p.company.invoice_ehf ? "EHF" : p.company.invoice_email ? "På e-post" : "Ikke oppgitt";
  if (key === "kontakter") return count(p.contacts.length, "person", "personer", "Ingen registrert");
  if (key === "kandidater") return count(p.candidates.length, "presentasjon", "presentasjoner", "Ingen ennå");
  if (key === "varsler") {
    const plan = p.alerts?.plan ?? null;
    if (!p.alerts) return "Ikke aktivt";
    if (p.alerts.trial_until && plan?.status !== "ended") return "Gratis prøveperiode";
    if (!plan) return "Gratis";
    if (plan.status === "ended") return "Avsluttet";
    if (plan.cancelled || plan.freeOnly) return "Avsluttes";
    return plan.status === "paid" ? "Betalt" : "Gratis";
  }
  if (key === "ansetter") {
    const h = p.hiring;
    if (!h) return "";
    if (!h.terms.accepted) return h.terms.ready ? "Godta vilkårene" : "Åpnes snart";
    if (h.subscription.tier === "basis") return "Basis";
    return count(h.rows.length, "bedrift", "bedrifter", "Ingen ennå");
  }
  if (key === "tilbud") {
    const open = p.offers.filter((o) => o.open).length;
    return open === 0 ? (p.offers.length ? "Ingen venter på svar" : "Ingen tilbud") : open === 1 ? "1 venter på svar" : `${open} venter på svar`;
  }
  if (key === "timelister") {
    const waiting = p.timesheets.waiting.length;
    return waiting ? count(waiting, "venter på signatur", "venter på signatur", "") : count(p.timesheets.signed.length, "signert", "signerte", "Ingen ennå");
  }
  if (key === "fakturaer") {
    if (!p.invoices.allowed) return "For fakturaadressen";
    const unpaid = p.invoices.rows.filter((i) => i.state_key === "open" || i.state_key === "overdue").length;
    return unpaid ? count(unpaid, "ubetalt", "ubetalte", "") : p.invoices.rows.length ? "Alle betalt" : "Ingen ennå";
  }
  return count(p.documents.length, "dokument", "dokumenter", "Ingen ennå");
}

/** An amount as an invoice prints it: kr 12 500,00. */
export function kronerNo(amount: number): string {
  return `kr ${new Intl.NumberFormat("nb-NO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount).replace(/[\u00a0\u202f]/g, " ")}`;
}

// ---------------------------------------------------------------------------
// ORDER 100 (13 October 2026): "Planlegg bemanning med oss", and the source line.
// ---------------------------------------------------------------------------

/**
 * Where the projects come from, in the smallest print on the page (his words:
 * "si sa nu fie scris mare ci mai mic decat mic"), under the project list: the
 * disclaimer of the final design (13 October 2026) with Doffin in its middle.
 * Not a link, not highlighted. It is never in an e-mail.
 */
export const PROJECT_SOURCE_LINE =
  "Oversikten er ment som et hjelpemiddel og kan inneholde feil eller mangler. Prosjektene er offentlige kunngjøringer hentet fra Doffin, og oppdragsgiver kan endre dem etter at de vises her. Kontroller alltid frister og vilkår i selve konkurransen før dere gir tilbud. ArbeidMatch Norge AS er ikke part i konkurransene.";

export const PLAN_CONFIRMATION = "Takk. Vi har fått forespørselen og tar kontakt innen én arbeidsdag.";

/** What a link asks Min side to open: ?plan=1 the staffing request, ?alerts=1 the project alerts. */
export function intentFromSearch(search: string): "plan" | "alerts" | null {
  const q = new URLSearchParams(search);
  if (q.get("plan") === "1") return "plan";
  if (q.get("alerts") === "1") return "alerts";
  return null;
}

/** The trade and place the staffing request opens with: the subscription's fields and counties, in Norwegian. */
export function staffingPrefill(alerts: Alerts | null): { trade: string; place: string } {
  const domains = (alerts?.choices?.domains ?? []).filter(isDomainKey).map((d) => domainLabel(d, "no"));
  const regions = [...new Set((alerts?.choices?.regions ?? []).map((r) => NORWAY_REGIONS[r]).filter((x): x is string => Boolean(x)))];
  return { trade: domains.slice(0, 3).join(", "), place: regions.slice(0, 3).join(", ") };
}

export type StaffingPrefill = { trade: string; place: string; note?: string };

/**
 * "Be om folk" on one project (ORDER 101): the request opens with the
 * project's own trades in Norwegian, its town, and its title in the note. What
 * the project does not say comes from the subscription's choices.
 */
export function projectPrefill(p: MinSideProject, alerts: Alerts | null): Required<StaffingPrefill> {
  const base = staffingPrefill(alerts);
  const trades = p.domains.filter(isDomainKey).map((d) => domainLabel(d, "no"));
  return { trade: trades.length ? trades.slice(0, 3).join(", ") : base.trade, place: p.place ?? base.place, note: `Prosjekt: ${p.title}`.slice(0, 1000) };
}

// ---------------------------------------------------------------------------
// ORDER 101 (13 October 2026): the list follows the towns, the stage and the
// unknown-place toggle, and the count follows the list.
// ---------------------------------------------------------------------------

export type MinSideStage = "planned" | "tender" | "closed" | "awarded";

/** A tender past its deadline waits for the award: a stage of its own on the page. */
export function projectStage(p: Pick<MinSideProject, "stage" | "deadline_at">, now: number): MinSideStage {
  if (p.stage === "tender" && p.deadline_at && Date.parse(p.deadline_at) < now) return "closed";
  return p.stage;
}

export type ProjectFilter = { cities: string[]; stages: MinSideStage[]; showUnknown: boolean; now: number };

/**
 * The projects the page shows. Chosen towns keep the projects in them and the
 * ones with no known place (those stay, marked, unless the toggle hides them).
 * No town chosen is the whole county. No stage chosen is every stage.
 */
export function visibleProjects(projects: MinSideProject[], f: ProjectFilter): MinSideProject[] {
  const towns = new Set(f.cities.map((c) => c.toLocaleLowerCase("nb")));
  return projects.filter((p) => {
    if (!p.place) {
      if (!f.showUnknown) return false;
    } else if (towns.size && !towns.has(p.place.toLocaleLowerCase("nb"))) return false;
    return !f.stages.length || f.stages.includes(projectStage(p, f.now));
  });
}

/** "3 prosjekter i Trondheim og Malvik": always a whole number, from the list as it is filtered. */
export function projectCountLine(count: number, cities: string[]): string {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const words = n === 1 ? "1 prosjekt" : `${n} prosjekter`;
  if (!cities.length) return words;
  const towns = cities.length === 1 ? cities[0] : `${cities.slice(0, -1).join(", ")} og ${cities[cities.length - 1]}`;
  return `${words} i ${towns}`;
}

/** The bodies Min side posts for the towns and for the one-time question. */
export function alertCitiesRequest(cities: string[]): { action: "alert_cities"; cities: string[] } {
  return { action: "alert_cities", cities: cityList(cities) };
}
export function cityQuestionRequest(answer: "yes" | "no"): { action: "city_question"; answer: "yes" | "no" } {
  return { action: "city_question", answer };
}

/** A phone number as a tel: link wants it: the plus and the digits. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^0-9+]/g, "");
  return /^\+?[0-9]{5,15}$/.test(digits) ? `tel:${digits}` : null;
}

// ---------------------------------------------------------------------------
// ORDER 157 (October 2026): Bedrifter som ansetter, the hiring alerts. The
// firms that hire in the client's counties and trades, behind terms the client
// accepts first; the full lead card is Premium, Basis shows the list locked.
// ---------------------------------------------------------------------------

export type HiringTier = "basis" | "premium";
export type HiringStatus = "new" | "contacted";

/** Terms as the ATS sends them to be read and accepted. */
export type TermsText = { title: string; paragraphs: string[]; version: string; consent: string };
export type HiringTerms = TermsText & { accepted: boolean; ready: boolean };

export type HiringSubscription = { status: string; counties: string[]; trades: string[]; free_until: string | null; tier: HiringTier; frequency: string };

export type HiringRow = {
  orgnr: string;
  name: string;
  town: string | null;
  county: string | null;
  county_name: string | null;
  trades: string[];
  trade_names: string[];
  positions: number;
  published: string | null;
  status: HiringStatus;
  /** Null in Basis. */
  behov: string | null;
  /** Null in Basis, and when the firm did not say. */
  english_ok: boolean | null;
  won: string | null;
  note: string | null;
  follow_up_on: string | null;
  opened: boolean;
};

/** The full lead card, Premium only. */
export type HiringCard = HiringRow & { address: string | null; website: string | null; industry: string | null; employees: number | null; recruits: string | null };

export type HiringProjectRow = { id: string; title: string; county: string | null; stage: string };
export type HiringProjects = {
  count: number;
  won_count: number;
  counties: string[];
  rows: HiringProjectRow[];
  request: { sent_at: string; status: string } | null;
  terms: TermsText;
  terms_accepted: boolean;
  email: string;
};

export type Hiring = {
  subscription: HiringSubscription;
  terms: HiringTerms;
  /** Empty until the terms are accepted. */
  rows: HiringRow[];
  last_viewed_at: string | null;
  filters: { counties: { code: string; name: string }[]; trades: { key: string; name: string }[] };
  /** Null when the firm already has project alerts, or before the terms are accepted. */
  projects: HiringProjects | null;
};

const COUNTY_CODE = /^NO[0-9A-Z]{3}$/;
const TRADE_KEY = /^[a-z0-9_]{2,40}$/;
const ORGNR = /^\d{9}$/;
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const objs = (v: unknown) => (Array.isArray(v) ? v.map(obj).filter((x): x is Record<string, unknown> => x !== null) : []);
const textOrNull = (v: unknown, max: number) => str(v, max).trim() || null;
const isoOrNull = (v: unknown) => (typeof v === "string" && Number.isFinite(Date.parse(v)) ? v.slice(0, 40) : null);
const wholeOrZero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);

function termsTextFrom(r: Record<string, unknown> | null): TermsText {
  return {
    title: str(r?.title, 200).trim() || "Vilkår",
    paragraphs: strings(r?.paragraphs, 60, 4000),
    version: str(r?.version, 40),
    consent: str(r?.consent, 300).trim() || "Jeg har lest og godtar vilkårene",
  };
}

function hiringRowFrom(r: Record<string, unknown>): HiringRow | null {
  const orgnr = str(r.orgnr, 20).replace(/\s/g, "");
  const name = str(r.name, 200).trim();
  if (!ORGNR.test(orgnr) || !name) return null;
  const county = str(r.county, 10);
  return {
    orgnr,
    name,
    town: textOrNull(r.town, 80),
    county: COUNTY_CODE.test(county) ? county : null,
    county_name: textOrNull(r.county_name, 80),
    trades: strings(r.trades, 20, 40).filter((t) => TRADE_KEY.test(t)),
    trade_names: strings(r.trade_names, 20, 80),
    positions: wholeOrZero(r.positions),
    published: isoOrNull(r.published),
    status: r.status === "contacted" ? "contacted" : "new",
    behov: textOrNull(r.behov, 300),
    english_ok: typeof r.english_ok === "boolean" ? r.english_ok : null,
    won: textOrNull(r.won, 200),
    note: textOrNull(r.note, 2000),
    follow_up_on: day(r.follow_up_on)?.slice(0, 10) ?? null,
    opened: r.opened === true,
  };
}

/** The firm's own website: a plain http(s) address, nothing else. */
function websiteFrom(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The lead card the ATS answers to hiring_card, or null when it is not one. */
export function hiringCardFrom(raw: unknown): HiringCard | null {
  const r = obj(raw);
  const row = r ? hiringRowFrom(r) : null;
  if (!r || !row) return null;
  const employees = typeof r.employees === "number" && Number.isFinite(r.employees) && r.employees >= 0 ? Math.round(r.employees) : null;
  return { ...row, address: textOrNull(r.address, 300), website: websiteFrom(r.website), industry: textOrNull(r.industry, 200), employees, recruits: textOrNull(r.recruits, 40) };
}

function hiringProjectsFrom(raw: unknown): HiringProjects | null {
  const r = obj(raw);
  if (!r) return null;
  const req = obj(r.request);
  const sentAt = req ? isoOrNull(req.sent_at) : null;
  return {
    count: wholeOrZero(r.count),
    won_count: wholeOrZero(r.won_count),
    counties: strings(r.counties, 20, 80),
    rows: objs(r.rows)
      .filter((p) => typeof p.id === "string" && p.id.length > 0)
      .map((p) => ({ id: String(p.id).slice(0, 60), title: str(p.title, 300), county: textOrNull(p.county, 80), stage: str(p.stage, 40) }))
      .slice(0, 200),
    request: sentAt ? { sent_at: sentAt, status: str(req?.status, 40) } : null,
    terms: termsTextFrom(obj(r.terms)),
    terms_accepted: r.terms_accepted === true,
    email: str(r.email, 254),
  };
}

/** The hiring part of the ATS's answer, or null: absent, or not shaped like one. */
export function hiringFrom(raw: unknown): Hiring | null {
  const r = obj(raw);
  const s = obj(r?.subscription);
  const t = obj(r?.terms);
  if (!r || !s || !t) return null;
  const f = obj(r.filters);
  return {
    subscription: {
      status: str(s.status, 40),
      counties: strings(s.counties, 20, 80),
      trades: strings(s.trades, 30, 80),
      free_until: day(s.free_until)?.slice(0, 10) ?? null,
      tier: s.tier === "basis" ? "basis" : "premium",
      frequency: str(s.frequency, 40),
    },
    terms: { ...termsTextFrom(t), accepted: t.accepted === true, ready: t.ready === true },
    rows: objs(r.rows)
      .map(hiringRowFrom)
      .filter((x): x is HiringRow => x !== null)
      .slice(0, 1000),
    last_viewed_at: isoOrNull(r.last_viewed_at),
    filters: {
      counties: objs(f?.counties)
        .filter((c) => typeof c.code === "string" && COUNTY_CODE.test(c.code))
        .map((c) => ({ code: String(c.code), name: str(c.name, 80) || String(c.code) }))
        .slice(0, 30),
      trades: objs(f?.trades)
        .filter((c) => typeof c.key === "string" && TRADE_KEY.test(c.key))
        .map((c) => ({ key: String(c.key), name: str(c.name, 80) || String(c.key) }))
        .slice(0, 60),
    },
    projects: hiringProjectsFrom(r.projects),
  };
}

/** "Trøndelag · Tømrer, Murer · prøveperiode til 31. desember 2026": the line under the section's name. */
export function hiringSubtitle(h: Hiring): string {
  const s = h.subscription;
  const trial = s.free_until && s.tier !== "basis" ? `prøveperiode til ${dayNo(s.free_until)}` : null;
  return [s.counties.join(", "), s.trades.join(", "), trial].filter(Boolean).join(" · ");
}

export type HiringFilter = { county: string; trade: string; english: boolean; onlyNew: boolean };
export const NO_HIRING_FILTER: HiringFilter = { county: "", trade: "", english: false, onlyNew: false };

/**
 * The rows the list shows. `since` is last_viewed_at as it stood BEFORE this
 * visit told the ATS it was seen: "Bare nye siden sist" compares against that.
 * Never seen before means every dated row is new. In Basis the language and
 * the new-only filters are locked, so they never narrow the list.
 */
export function visibleHiringRows(rows: HiringRow[], f: HiringFilter, since: string | null, tier: HiringTier): HiringRow[] {
  const sinceMs = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
  const premium = tier === "premium";
  return rows.filter((r) => {
    if (f.county && r.county !== f.county) return false;
    if (f.trade && !r.trades.includes(f.trade)) return false;
    if (premium && f.english && r.english_ok !== true) return false;
    if (premium && f.onlyNew) {
      const at = r.published ? Date.parse(r.published) : NaN;
      if (!Number.isFinite(at) || !(at > sinceMs)) return false;
    }
    return true;
  });
}

/** The CSV download with the filters on screen; the language and new-only filters are Premium. */
export function hiringCsvHref(token: string, f: HiringFilter): string {
  const q = new URLSearchParams();
  if (COUNTY_CODE.test(f.county)) q.set("county", f.county);
  if (TRADE_KEY.test(f.trade)) q.set("trade", f.trade);
  if (f.english) q.set("english", "1");
  if (f.onlyNew) q.set("new", "1");
  const s = q.toString();
  return `/api/min-side/${encodeURIComponent(token)}/hiring-csv${s ? `?${s}` : ""}`;
}

/** The CSV query as the proxy passes it on: only the four known values in their shapes, or null for anything else. */
export function hiringCsvQuery(params: URLSearchParams): string | null {
  const out = new URLSearchParams();
  for (const [k, v] of params) {
    if (k === "county" && COUNTY_CODE.test(v)) out.set(k, v);
    else if (k === "trade" && TRADE_KEY.test(v)) out.set(k, v);
    else if ((k === "english" || k === "new") && v === "1") out.set(k, v);
    else return null;
  }
  return out.toString();
}

/** What "Åpne lead" does: the card in Premium, the "Bedriftskortet er Premium" dialog in Basis. */
export function leadAction(tier: HiringTier): "card" | "premium" {
  return tier === "premium" ? "card" : "premium";
}

export const HIRING_STATUS_NO: Record<HiringStatus, string> = { new: "Ny", contacted: "Kontaktet" };

/** The lead card as plain text, for "Kopier". */
export function leadCardText(c: HiringCard, note: string, followUp: string): string {
  const lines: [string, string | null][] = [
    ["Org.nr", orgNumberNo(c.orgnr)],
    ["Bransje", c.industry],
    ["Ansatte", c.employees === null ? null : String(c.employees)],
    ["Adresse", c.address ?? ([c.town, c.county_name].filter(Boolean).join(", ") || null)],
    ["Nettsted", c.website],
    ["Fag", c.trade_names.join(", ") || null],
    ["Behov", c.behov],
    ["Byrå", c.recruits],
    ["Språk", c.english_ok ? "Aksepterer engelsk" : "Ikke oppgitt"],
    ["Offentlig kontrakt", c.won],
    ["Status", HIRING_STATUS_NO[c.status]],
    ["Følg opp", followUp ? dayNo(followUp) : null],
    ["Notat", note.trim() || null],
  ];
  return [c.name, ...lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join("\n");
}

/** The stage of a project in the teaser, in Norwegian; an unknown stage is shown as sent. */
export function projectStageNo(stage: string): string {
  const words: Record<string, string> = { planned: "Planlagt", tender: "Åpen konkurranse", closed: "Venter på tildeling", awarded: "Tildelt", cancelled: "Avlyst" };
  return words[stage] ?? stage;
}

/** "Prøv prosjektvarsler" from the weekly letter (?hiring=projects) opens the hiring section at the projects card. */
export function hiringIntentFromSearch(search: string): "projects" | null {
  return new URLSearchParams(search).get("hiring") === "projects" ? "projects" : null;
}

/** The project teaser replaces the empty Prosjektvarsler state only for a person with neither alerts nor free months. */
export function showsProjectsTeaser(p: Pick<Profile, "alerts" | "free_alerts" | "hiring">): boolean {
  return !p.alerts && !p.free_alerts && Boolean(p.hiring?.projects);
}

const DAY_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

export const HIRING_ACTIONS = ["hiring_terms", "hiring_viewed", "hiring_card", "hiring_lead", "hiring_feedback", "hiring_stop", "hiring_premium", "projects_trial", "close_account"] as const;

export function isHiringAction(v: unknown): v is (typeof HIRING_ACTIONS)[number] {
  return typeof v === "string" && (HIRING_ACTIONS as readonly string[]).includes(v);
}

/**
 * The body the proxy passes on for one of the hiring actions, with only the
 * fields named and as plain bounded values, or null when it is not one. The
 * ATS validates again.
 */
export function hiringRequest(raw: Record<string, unknown>): Record<string, unknown> | null {
  const action = raw.action;
  switch (action) {
    case "hiring_viewed":
    case "hiring_stop":
    case "hiring_premium":
    case "projects_trial":
    case "close_account":
      return { action };
    case "hiring_terms":
      return raw.service === "hiring" || raw.service === "projects" ? { action, service: raw.service } : null;
    case "hiring_card":
      return typeof raw.orgnr === "string" && ORGNR.test(raw.orgnr) ? { action, orgnr: raw.orgnr } : null;
    case "hiring_lead": {
      if (typeof raw.orgnr !== "string" || !ORGNR.test(raw.orgnr)) return null;
      const body: Record<string, unknown> = { action, orgnr: raw.orgnr };
      if (raw.status !== undefined) {
        if (raw.status !== "new" && raw.status !== "contacted") return null;
        body.status = raw.status;
      }
      if (raw.note !== undefined) {
        if (typeof raw.note !== "string" || raw.note.length > 2000) return null;
        body.note = raw.note;
      }
      if (raw.follow_up_on !== undefined) {
        if (typeof raw.follow_up_on !== "string" || (raw.follow_up_on !== "" && !DAY_SHAPE.test(raw.follow_up_on))) return null;
        body.follow_up_on = raw.follow_up_on;
      }
      return Object.keys(body).length > 2 ? body : null;
    }
    case "hiring_feedback": {
      const body: Record<string, unknown> = { action };
      if (raw.score !== undefined) {
        if (typeof raw.score !== "number" || !Number.isInteger(raw.score) || raw.score < 1 || raw.score > 5) return null;
        body.score = raw.score;
      }
      if (raw.text !== undefined) {
        if (typeof raw.text !== "string" || raw.text.length > 2000) return null;
        body.text = raw.text;
      }
      return Object.keys(body).length > 1 ? body : null;
    }
    default:
      return null;
  }
}
