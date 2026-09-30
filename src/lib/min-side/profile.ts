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

export type Profile = {
  me: { email: string; contact_id: string | null };
  company: Company;
  contacts: Contact[];
  alerts: Alerts | null;
  offers: Offer[];
  documents: SignedDocument[];
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
    offers: list(r.offers)
      .map((o) => ({ number: str(o.number, 40), title: str(o.title, 120), state: str(o.state, 40), open: o.open === true, sent_at: typeof o.sent_at === "string" ? o.sent_at : null, url: ownLink(o.url) }))
      .slice(0, 50),
    documents: list(r.documents)
      .map((d) => ({ title: str(d.title, 200), signed_at: typeof d.signed_at === "string" ? d.signed_at : null, pdf_url: ownLink(d.pdf_url) }))
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
export function alertsWords(alerts: Alerts | null): { title: string; text: string } {
  const plan = alerts?.plan ?? null;
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
