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

export type Alerts = { plan: Plan | null; free_until: string | null; projects_url: string | null };
export type Offer = { number: string; title: string; state: string; open: boolean; sent_at: string | null; url: string | null };
export type SignedDocument = { title: string; signed_at: string | null; pdf_url: string | null };

/** A weekly timeliste: one that waits for this person's signature, with the way to it, or one they signed. */
export type WaitingTimesheet = { title: string; sent_at: string | null; url: string | null };
export type Timesheets = { waiting: WaitingTimesheet[]; signed: SignedDocument[] };

export type Invoice = { id: number; number: string; date: string | null; due: string | null; amount: number; outstanding: number; state: string; state_key: "paid" | "open" | "overdue" | "credit" };
/** The firm's invoices, for the person at its invoice address; `allowed` false for anybody else. */
export type Invoices = { allowed: boolean; rows: Invoice[] };

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
};

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
    alerts: a ? { plan: planFrom(a.plan), free_until: day(a.free_until), projects_url: ownLink(a.projects_url) } : null,
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
export type SectionKey = "firma" | "fakturaopplysninger" | "kontakter" | "kandidater" | "tilbud" | "timelister" | "fakturaer" | "dokumenter" | "varsler";

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
];

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
    if (!plan) return "Gratis";
    if (plan.status === "ended") return "Avsluttet";
    if (plan.cancelled || plan.freeOnly) return "Avsluttes";
    return plan.status === "paid" ? "Betalt" : "Gratis";
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
