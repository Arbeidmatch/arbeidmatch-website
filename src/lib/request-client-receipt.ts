/**
 * THE RECEIPT A CLIENT GETS FOR A REQUEST: THE WHOLE ORDER, IN NORWEGIAN.
 *
 * His correction, 25 September 2026, reading the receipt of a test request:
 * "aici trebuie sa primeasca comanda toata nu doar partiala ca confirmare".
 * The letter used to repeat seven of the answers (reference, service, position,
 * how many, place, start) and stop. A client who has just filled in twenty
 * answers reads a receipt to check what was ordered, so every answer the office
 * copy carries is here too, under the same headings, in the client's language.
 *
 * WHAT IS TRANSLATED AND WHAT IS NOT. Our labels and headings are Norwegian,
 * and a coded answer (company_covered, has_d_number, Per month) is said in
 * words. What the client typed or picked from the wizard's own lists stays as
 * they saw it: the wizard is English, and "Permanent employment" is what they
 * chose, so the receipt does not rewrite their choice behind their back. The
 * "Role details" answers keep the wizard's labels for the same reason.
 *
 * AND WHO IT COMES FROM. The same correction: "si primeste confirmarea de la
 * comanda de la no reply". A receipt that asks the client to reply if
 * something is wrong cannot come from an address that takes no reply. Its
 * reply-to is the office address, so a reply lands where the order itself is
 * read; the from is what the mail server allows, see below.
 */

/**
 * WHY THE FROM IS STILL THE NO-REPLY MAILBOX. Sending as post@ was tried on
 * 25 September 2026 and the mail server refused it: "550 5.7.1 User
 * no-reply@arbeidmatch.no not authorized to send on behalf of
 * post@arbeidmatch.no". The website's SMTP account is the no-reply mailbox,
 * and the provider only lets a mailbox send as itself. Until the site gets
 * SMTP credentials for post@ (or post@ is authorised as a sender alias for
 * no-reply@ at the provider), the letter leaves from the authorised mailbox
 * and the reply-to sends every answer to post@, where the order is read.
 */
export const REQUEST_RECEIPT_FROM = '"ArbeidMatch Norge AS" <no-reply@arbeidmatch.no>';
export const REQUEST_RECEIPT_REPLY_TO = "post@arbeidmatch.no";

export type ReceiptRow = { label: string; value: string };
export type ReceiptSection = { heading: string; rows: ReceiptRow[] };

/** Every answer the office copy prints, as plain strings; empty means not answered. */
export type ClientReceiptInput = {
  referenceId: string;
  /** The ATS's own service key: staffing, recruitment, sourcing, advertising. */
  service: string;
  /** "agency" or "own_operation", from the wizard's first question. */
  requesterKind: string;
  adContactLine: string;
  company: string;
  orgNumber: string;
  email: string;
  fullName: string;
  contactRole: string;
  phone: string;
  category: string;
  /** Already in Norwegian (positionNb). */
  position: string;
  jobSummary: string;
  contractType: string;
  qualification: string;
  candidatesNeeded: string;
  certifications: string;
  drivingLicence: string;
  /** The code (has_d_number, we_handle) or the typed text. */
  dNumber: string;
  workTasks: string[];
  personalQualities: string[];
  salary: string;
  salaryPeriod: string;
  overtime: string;
  accommodation: string;
  accommodationCost: string;
  localTravel: string;
  /** The code (company_covered, own_responsibility). */
  internationalTravel: string;
  rotation: string;
  weOffer: string[];
  startDate: string;
  city: string;
  region: string;
  /** The wizard's own labels and answers, as the office copy prints them. */
  roleDetails: ReceiptRow[];
  clientNote: string;
};

export function serviceNb(value: string): string {
  if (value === "staffing") return "Bemanning";
  if (value === "recruitment") return "Rekruttering";
  if (value === "sourcing") return "Sourcing";
  if (value === "advertising") return "Stillingsannonse";
  return value;
}

export function requesterKindNb(value: string): string {
  if (value === "agency") return "Bemannings- eller rekrutteringsbyrå";
  if (value === "own_operation") return "Egen virksomhet";
  return "";
}

function travelNb(value: string): string {
  if (value === "company_covered") return "Dekkes av firmaet";
  if (value === "own_responsibility") return "Kandidatens eget ansvar";
  return value;
}

function dNumberNb(value: string): string {
  if (value === "has_d_number") return "Har D-nummer allerede";
  if (value === "we_handle") return "Vi ordner prosedyren";
  return value;
}

function salaryPeriodNb(value: string): string {
  if (value === "Per month") return "Per måned";
  if (value === "Per hour") return "Per time";
  return value;
}

function yesNoNb(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "yes") return "Ja";
  if (v === "false" || v === "no") return "Nei";
  return value;
}

function accommodationNb(value: string): string {
  if (value === "Candidate finds own") return "Kandidaten ordner selv";
  if (value === "We help find accommodation") return "Dere hjelper med å finne bolig";
  return value;
}

function localTravelNb(value: string): string {
  if (value === "Covered") return "Dekket";
  if (value === "Not covered") return "Ikke dekket";
  return value;
}

function rotationNb(value: string): string {
  const m = value.match(/^(\d+) weeks on \/ (\S+) weeks off$/);
  if (m) return `${m[1]} uker på / ${m[2]} uker av`;
  return yesNoNb(value);
}

function startNb(value: string): string {
  return value === "Immediate" ? "Snarest" : value;
}

/**
 * The receipt's sections, in the order the office copy has them, with a
 * section for the role and one for the client's own note at the end. A section
 * with nothing answered is left out by the letter shell (letterFacts prints
 * only rows with a value).
 */
export function clientReceiptSections(r: ClientReceiptInput): ReceiptSection[] {
  return [
    {
      heading: "Forespørselen",
      rows: [
        { label: "Referanse", value: r.referenceId },
        { label: "Tjeneste", value: serviceNb(r.service) },
        { label: "Type virksomhet", value: requesterKindNb(r.requesterKind) },
        { label: "Kontakt på annonsen", value: r.adContactLine },
      ],
    },
    {
      heading: "Kontaktopplysninger",
      rows: [
        { label: "Firma", value: r.company },
        { label: "Org.nr", value: r.orgNumber },
        { label: "E-post", value: r.email },
        { label: "Navn", value: r.fullName },
        { label: "Rolle i firmaet", value: r.contactRole },
        { label: "Telefon", value: r.phone },
      ],
    },
    {
      heading: "Stillingen",
      rows: [
        { label: "Kategori", value: r.category },
        { label: "Stilling", value: r.position },
        { label: "Oppsummering", value: r.jobSummary },
        { label: "Kontraktstype", value: r.contractType },
        { label: "Kvalifikasjon", value: r.qualification },
        { label: "Antall kandidater", value: r.candidatesNeeded },
        { label: "Sertifiseringer", value: r.certifications },
        { label: "Førerkort", value: r.drivingLicence },
        { label: "D-nummer", value: dNumberNb(r.dNumber) },
        { label: "Arbeidsoppgaver", value: r.workTasks.join("; ") },
        { label: "Personlige egenskaper", value: r.personalQualities.join(", ") },
      ],
    },
    {
      heading: "Vilkår dere tilbyr",
      rows: [
        { label: "Lønn", value: r.salary },
        { label: "Lønnsperiode", value: salaryPeriodNb(r.salaryPeriod) },
        { label: "Overtid", value: yesNoNb(r.overtime) },
        { label: "Bolig", value: accommodationNb(r.accommodation) },
        { label: "Boligkostnad", value: r.accommodationCost },
        { label: "Lokal reise", value: localTravelNb(r.localTravel) },
        { label: "Internasjonal reise", value: travelNb(r.internationalTravel) },
        { label: "Rotasjon", value: rotationNb(r.rotation) },
        { label: "Dere tilbyr", value: r.weOffer.join(", ") },
        { label: "Ønsket oppstart", value: startNb(r.startDate) },
      ],
    },
    {
      heading: "Sted",
      rows: [
        { label: "By", value: r.city },
        { label: "Region", value: r.region },
      ],
    },
    { heading: "Om rollen", rows: r.roleDetails },
    { heading: "Deres merknad", rows: [{ label: "Merknad", value: r.clientNote }] },
  ];
}

/** Every value the receipt will print, for the test that checks nothing is left out. */
export function receiptValues(sections: ReceiptSection[]): string[] {
  return sections.flatMap((s) => s.rows.map((r) => r.value.trim()).filter(Boolean));
}
