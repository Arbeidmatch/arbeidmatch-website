/**
 * Paid job adverts: the shapes the ATS speaks, and the copy the client reads.
 *
 * THE OWNER'S DECISION, 11 September 2026: a company writes a full advert as on
 * FINN, accepts our posting rules, our reviewer reads it BEFORE any payment,
 * then the client picks a package and pays by card or invoice, and only then is
 * it published here.
 *
 * The ATS owns the order, the review, the prices and the publishing
 * (ats-recruitment src/lib/job-ads/). These types are copied from there and
 * must be kept in step with it: advert.ts (AdvertDraft), pricing.ts (AdQuote,
 * packages, add-ons) and orders.ts (PublicOrderView). This file is shared by the
 * browser and the server, so it holds no secrets and no server imports.
 */

export const EMPLOYMENT_TYPES = ["fast", "vikariat", "prosjekt", "sesong", "laerling", "engasjement"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export type AdvertDraft = {
  /** Max 60 characters. */
  headline?: string | null;
  title: string;
  /** 200..6000 characters, paragraphs separated by blank lines. */
  description: string;
  /** 1..50 */
  positions: number;
  employmentType: EmploymentType;
  partTime: boolean;
  /** One of INDUSTRIES[].value: the ATS decides the price tier from it. */
  industry: string;
  /** Max 8. */
  skills?: string[];
  /** Max 5. */
  keywords?: string[];
  remote?: "no" | "hybrid" | "full" | null;
  /** ISO date, in the future, within one year. */
  deadline: string;
  /** Free text, e.g. "Snarest" or a date. */
  startDate?: string | null;
  workLanguages?: string[];
  salary: { period: "hour" | "month"; min: number; max?: number | null };
  location: { address?: string | null; postcode?: string | null; city: string };
  employer: { name: string; orgNumber: string; about?: string | null; website?: string | null };
  /** Email or phone required. */
  contact: { name: string; role?: string | null; email?: string | null; phone?: string | null };
  advertFor: "recruitment" | "staffing";
  imageUrl?: string | null;
};

export type AdPackage = "basis" | "synlig" | "maks";
export type AdAddon = "featured_7d" | "extend_30d" | "translation" | "written_by_us" | "urgent_label";
export type PaymentMethod = "card" | "invoice";

export type AdQuote = {
  tier: 1 | 2 | 3 | 4;
  package: AdPackage;
  partTime: boolean;
  addons: string[];
  lines: { key: string; label: string; nok: number }[];
  subtotalNok: number;
  vatNok: number;
  totalNok: number;
};

export type OrderStatus =
  | "in_review"
  | "changes_requested"
  | "refused"
  | "approved"
  | "awaiting_payment"
  | "paid"
  | "invoiced"
  | "published"
  | "expired"
  | "cancelled";

export type ReviewFinding = {
  rule: string;
  quote: string | null;
  problem: string;
  fix: string | null;
  field?: string;
};

export type PublicOrderView = {
  token: string;
  status: OrderStatus;
  reviewRound: number;
  rulesVersion: string;
  findings: ReviewFinding[];
  advert: AdvertDraft;
  company: string;
  /** What each package contains; null before approval and from an ATS that does not send it yet. */
  packageContents?: PackageContents | null;
  quotes: Record<AdPackage, AdQuote> | null;
  chosen: { package: AdPackage; addons: string[]; method: PaymentMethod | null; quote: AdQuote | null } | null;
  publishedSlug: string | null;
  expiresAt: string | null;
};

export type PostingRule = { id: string; title: string; text: string };
export type PostingRules = { version: string; rules: PostingRule[] };

/** The ATS issues 64 hex characters; anything else is never forwarded. */
export const ORDER_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function isOrderToken(value: unknown): value is string {
  return typeof value === "string" && ORDER_TOKEN_PATTERN.test(value);
}

/**
 * Industries as the ATS prices them. `value` is sent, `label` is shown.
 * The values are the website request form's industry names, which the ATS
 * keys its price tiers by (pricing.ts INDUSTRY_TIER).
 */
export const INDUSTRIES: readonly { value: string; label: string; tier: 1 | 2 | 3 | 4 }[] = [
  { value: "Construction", label: "Bygg og anlegg", tier: 2 },
  { value: "Electrical", label: "Elektro", tier: 4 },
  { value: "Plumbing and HVAC (VVS)", label: "Rørlegger og VVS", tier: 3 },
  { value: "Welding and Metal", label: "Sveis og metall", tier: 3 },
  { value: "Industry and Production", label: "Industri og produksjon", tier: 1 },
  { value: "Logistics", label: "Logistikk og lager", tier: 1 },
  { value: "Cleaning", label: "Renhold", tier: 1 },
  { value: "HoReCa", label: "Hotell, restaurant og catering", tier: 1 },
  { value: "Healthcare", label: "Helse og omsorg", tier: 4 },
];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  fast: "Fast",
  vikariat: "Vikariat",
  prosjekt: "Prosjekt",
  sesong: "Sesong",
  laerling: "Lærling",
  engasjement: "Engasjement",
};

export const REMOTE_LABELS: Record<"no" | "hybrid" | "full", string> = {
  no: "Nei, arbeidet gjøres på stedet",
  hybrid: "Delvis",
  full: "Ja, helt",
};

export const WORK_LANGUAGE_OPTIONS = ["Norsk", "Engelsk", "Skandinavisk", "Polsk", "Rumensk", "Litauisk"] as const;

// No price before review (his decision, 11 September 2026: prices are asked
// for through a request). The ATS quotes the packages once the advert is approved.

/**
 * What each package contains comes from the ATS with the quotes
 * (PublicOrderView.packageContents, ats-recruitment pricing.ts
 * adPackageContents): the days, the translations, the profiles and the add-ons
 * a package already holds. This file keeps only the sentences (ORDER 302); it
 * used to mirror the ATS's facts, and a mirror drifts.
 */
export type PackageFacts = {
  includedAddons: AdAddon[];
  translations: number;
  anonymousProfiles: number;
  facebook: boolean;
  chatAssistant: boolean;
  ranked: boolean;
};

export type PackageContents = {
  maxDays: number;
  extendDays: number;
  featuredDays: number;
  packages: Record<AdPackage, PackageFacts>;
};

export const PACKAGES: readonly { id: AdPackage; name: string; recommended?: boolean }[] = [
  { id: "basis", name: "Basis" },
  { id: "synlig", name: "Synlig", recommended: true },
  { id: "maks", name: "Maks" },
];

export const PACKAGE_NAMES: Record<AdPackage, string> = { basis: "Basis", synlig: "Synlig", maks: "Maks" };

const NUMBER_WORDS_NO = ["null", "ett", "to", "tre", "fire", "fem", "seks", "sju", "åtte", "ni", "ti"];

function inWords(n: number): string {
  return Number.isInteger(n) && n >= 0 && n <= 10 ? NUMBER_WORDS_NO[n] : String(n);
}

/** "fem" for profiles: the common-gender word for one is "én", not "ett". */
function profilesInWords(n: number): string {
  return n === 1 ? "én" : inWords(n);
}

/**
 * The lines under a package, built from the ATS's facts. Each package after the
 * first opens with "Alt i <the one before>" and lists only what it adds.
 * Without the facts there are no lines: the card shows its name and price.
 */
export function packageGives(contents: PackageContents | null, pkg: AdPackage): string[] {
  if (!contents) return [];
  const index = PACKAGES.findIndex((p) => p.id === pkg);
  const facts = contents.packages[pkg];
  if (index < 0 || !facts) return [];
  if (index === 0) {
    return [
      `Annonsen på arbeidmatch.no til søknadsfristen, høyst ${contents.maxDays} dager`,
      "Kontrollert mot annonsereglene",
      "Søkerne rett inn i deres egen RecOS-konto",
    ];
  }
  const prevPkg = PACKAGES[index - 1];
  const prev = contents.packages[prevPkg.id];
  const has = (a: AdAddon) => facts.includedAddons.includes(a) && !(prev?.includedAddons ?? []).includes(a);
  const lines = [`Alt i ${prevPkg.name}`];
  if (facts.facebook && !prev?.facebook) lines.push("Innlegg på vår Facebook-side");
  if (has("featured_7d")) lines.push(`Fremhevet på forsiden i ${contents.featuredDays} dager`);
  if (facts.chatAssistant && !prev?.chatAssistant) lines.push("Anbefalt av vår chat-assistent");
  if (facts.anonymousProfiles > (prev?.anonymousProfiles ?? 0)) {
    lines.push(`Opptil ${profilesInWords(facts.anonymousProfiles)} anonyme kandidatprofiler fra vår database den første uken`);
  }
  if (facts.ranked && !prev?.ranked) lines.push("Søkerne sortert etter hvor godt de passer");
  if (facts.translations > (prev?.translations ?? 0)) {
    lines.push(facts.translations === 1 ? "Oversatt til ett språk (rumensk, polsk eller litauisk)" : `Oversatt til ${inWords(facts.translations)} språk`);
  }
  if (has("extend_30d")) lines.push(`${contents.extendDays} dager ekstra`);
  return lines;
}

const ADDON_IDS: readonly AdAddon[] = ["featured_7d", "extend_30d", "translation", "written_by_us", "urgent_label"];

/**
 * The add-ons with their labels. The two that carry a number of days take it
 * from the ATS's facts; without the facts they are not offered, since their
 * label would have no number to say.
 */
export function addonChoices(contents: PackageContents | null): { id: AdAddon; label: string }[] {
  const out: { id: AdAddon; label: string }[] = [];
  for (const id of ADDON_IDS) {
    if (id === "featured_7d") {
      if (contents) out.push({ id, label: `Fremhevet på forsiden i ${contents.featuredDays} dager` });
    } else if (id === "extend_30d") {
      if (contents) out.push({ id, label: `${contents.extendDays} dager ekstra` });
    } else if (id === "translation") out.push({ id, label: "Oversettelse til ett språk" });
    else if (id === "written_by_us") out.push({ id, label: "Vi skriver annonsen for dere" });
    else out.push({ id, label: "Merket «Haster»" });
  }
  return out;
}

/** Add-ons the package already contains, as the ATS says: never offered twice. */
export function addonsIncludedIn(contents: PackageContents | null, pkg: AdPackage): AdAddon[] {
  return [...(contents?.packages[pkg]?.includedAddons ?? [])];
}

export function addonsOfferedFor(contents: PackageContents | null, pkg: AdPackage): AdAddon[] {
  const included = new Set(addonsIncludedIn(contents, pkg));
  return addonChoices(contents).map((a) => a.id).filter((id) => !included.has(id));
}

export function isAdPackage(value: unknown): value is AdPackage {
  return value === "basis" || value === "synlig" || value === "maks";
}

export function isAdAddon(value: unknown): value is AdAddon {
  return (ADDON_IDS as readonly unknown[]).includes(value);
}

export function formatNok(n: number): string {
  return `${Math.round(n).toLocaleString("nb-NO")} kr`;
}

export const ADVERT_LIMITS = {
  headlineMax: 60,
  titleMin: 3,
  titleMax: 120,
  descriptionMin: 200,
  descriptionMax: 6000,
  positionsMin: 1,
  positionsMax: 50,
  skillsMax: 8,
  keywordsMax: 5,
} as const;

const s = (v: unknown) => String(v ?? "").trim();

/**
 * What must be fixed before the advert can be sent, by field, in Norwegian.
 * The same limits the ATS checks (advert.ts missingFields), so the client hears
 * about an empty field here instead of after a minute's review.
 */
export function validateAdvert(ad: AdvertDraft, now: Date = new Date()): Record<string, string> {
  const out: Record<string, string> = {};
  const L = ADVERT_LIMITS;

  if (s(ad.employer?.name).length < 2) out["employer.name"] = "Skriv firmanavnet.";
  if (!/^\d{9}$/.test(s(ad.employer?.orgNumber).replace(/[\s.]/g, ""))) {
    out["employer.orgNumber"] = "Organisasjonsnummeret må ha ni siffer.";
  }
  const website = s(ad.employer?.website);
  if (website && !/^(https?:\/\/)?[^\s/]+\.[^\s]+$/i.test(website)) out["employer.website"] = "Nettadressen ser ikke riktig ut.";
  if (s(ad.employer?.about).length > 2000) out["employer.about"] = "Høyst 2000 tegn.";

  if (s(ad.contact?.name).length < 2) out["contact.name"] = "Skriv navnet på kontaktpersonen.";
  const email = s(ad.contact?.email);
  const phone = s(ad.contact?.phone);
  if (!email && !phone) out["contact"] = "Oppgi e-post eller telefon til kontaktpersonen.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) out["contact.email"] = "E-postadressen ser ikke riktig ut.";
  if (phone && phone.replace(/\D/g, "").length < 8) out["contact.phone"] = "Telefonnummeret ser ikke riktig ut.";

  if (s(ad.headline).length > L.headlineMax) out["headline"] = `Overskriften kan være høyst ${L.headlineMax} tegn.`;
  if (s(ad.title).length < L.titleMin) out["title"] = "Skriv stillingstittelen.";
  else if (s(ad.title).length > L.titleMax) out["title"] = `Stillingstittelen kan være høyst ${L.titleMax} tegn.`;
  const desc = s(ad.description).length;
  if (desc < L.descriptionMin) {
    out["description"] = `Beskrivelsen er for kort. Skriv minst ${L.descriptionMin} tegn om arbeidet, arbeidsstedet og hva dere tilbyr.`;
  } else if (desc > L.descriptionMax) {
    out["description"] = `Beskrivelsen kan være høyst ${L.descriptionMax} tegn.`;
  }
  if (!Number.isInteger(ad.positions) || ad.positions < L.positionsMin || ad.positions > L.positionsMax) {
    out["positions"] = `Antall stillinger må være mellom ${L.positionsMin} og ${L.positionsMax}.`;
  }
  if (!(EMPLOYMENT_TYPES as readonly string[]).includes(ad.employmentType)) out["employmentType"] = "Velg ansettelsesform.";
  if (!INDUSTRIES.some((i) => i.value === ad.industry)) out["industry"] = "Velg bransje.";
  if ((ad.skills ?? []).length > L.skillsMax) out["skills"] = `Høyst ${L.skillsMax} kompetansekrav.`;
  if ((ad.keywords ?? []).length > L.keywordsMax) out["keywords"] = `Høyst ${L.keywordsMax} nøkkelord.`;

  if (!s(ad.location?.city)) out["location.city"] = "Skriv hvilken by eller kommune arbeidet er i.";
  const postcode = s(ad.location?.postcode);
  if (postcode && !/^\d{4}$/.test(postcode)) out["location.postcode"] = "Postnummeret har fire siffer.";

  const min = Number(ad.salary?.min);
  const max = ad.salary?.max === null || ad.salary?.max === undefined ? null : Number(ad.salary.max);
  if (ad.salary?.period !== "hour" && ad.salary?.period !== "month") out["salary.period"] = "Velg lønn per time eller per måned.";
  if (!Number.isFinite(min) || min <= 0) out["salary.min"] = "Oppgi lønn, et beløp eller et spenn.";
  else if (max !== null && (!Number.isFinite(max) || max < min)) out["salary.max"] = "Høyeste lønn kan ikke være lavere enn laveste.";

  const deadlineRaw = s(ad.deadline).slice(0, 10);
  const deadline = new Date(`${deadlineRaw}T23:59:59Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw) || Number.isNaN(deadline.getTime())) out["deadline"] = "Velg søknadsfrist.";
  else if (deadline.getTime() < now.getTime()) out["deadline"] = "Søknadsfristen må være frem i tid.";
  else if (deadline.getTime() - now.getTime() > 365 * 86_400_000) out["deadline"] = "Søknadsfristen kan være høyst ett år frem.";

  if (ad.advertFor !== "recruitment" && ad.advertFor !== "staffing") out["advertFor"] = "Svar på hvem som ansetter personen.";
  return out;
}

/** The advert as sent: trimmed, empty optionals as null, org number as digits. */
export function normaliseAdvert(ad: AdvertDraft): AdvertDraft {
  const opt = (v: unknown) => (s(v) ? s(v) : null);
  const list = (v: unknown, max: number) =>
    Array.isArray(v) ? [...new Set(v.map((x) => s(x)).filter(Boolean))].slice(0, max) : [];
  const max = ad.salary?.max === null || ad.salary?.max === undefined || String(ad.salary.max) === "" ? null : Number(ad.salary.max);
  return {
    headline: opt(ad.headline),
    title: s(ad.title),
    description: String(ad.description ?? "").replace(/\r\n/g, "\n").trim(),
    positions: Number(ad.positions),
    employmentType: ad.employmentType,
    partTime: Boolean(ad.partTime),
    industry: s(ad.industry),
    skills: list(ad.skills, ADVERT_LIMITS.skillsMax),
    keywords: list(ad.keywords, ADVERT_LIMITS.keywordsMax),
    remote: ad.remote ?? null,
    deadline: s(ad.deadline).slice(0, 10),
    startDate: opt(ad.startDate),
    workLanguages: list(ad.workLanguages, 10),
    salary: { period: ad.salary?.period === "month" ? "month" : "hour", min: Number(ad.salary?.min), max },
    location: { address: opt(ad.location?.address), postcode: opt(ad.location?.postcode), city: s(ad.location?.city) },
    employer: {
      name: s(ad.employer?.name),
      orgNumber: s(ad.employer?.orgNumber).replace(/\D/g, ""),
      about: opt(ad.employer?.about),
      website: opt(ad.employer?.website),
    },
    contact: {
      name: s(ad.contact?.name),
      role: opt(ad.contact?.role),
      email: opt(ad.contact?.email),
      phone: opt(ad.contact?.phone),
    },
    advertFor: ad.advertFor,
  };
}

export function emptyAdvert(): AdvertDraft {
  return {
    headline: "",
    title: "",
    description: "",
    positions: 1,
    employmentType: "fast",
    partTime: false,
    industry: "",
    skills: [],
    keywords: [],
    remote: "no",
    deadline: "",
    startDate: "",
    workLanguages: [],
    salary: { period: "hour", min: 0, max: null },
    location: { address: "", postcode: "", city: "" },
    employer: { name: "", orgNumber: "", about: "", website: "" },
    contact: { name: "", role: "", email: "", phone: "" },
    advertFor: "" as AdvertDraft["advertFor"],
  };
}
