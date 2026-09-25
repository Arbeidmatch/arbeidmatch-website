import { describe, expect, it } from "vitest";
import { letterFacts } from "./arbeidmatchEmailShell";
import {
  clientReceiptSections,
  receiptValues,
  REQUEST_RECEIPT_FROM,
  REQUEST_RECEIPT_REPLY_TO,
  requesterKindNb,
  serviceNb,
  type ClientReceiptInput,
} from "./request-client-receipt";

/** His correction of 25 September 2026: the receipt carries the whole order, and comes from an address that takes a reply. */
const ORDER: ClientReceiptInput = {
  referenceId: "AM-ER-2026-00042",
  service: "recruitment",
  requesterKind: "own_operation",
  adContactLine: "",
  company: "Bekken Bygg AS",
  orgNumber: "912345678",
  email: "post@bekken.invalid",
  fullName: "Ola Nordmann",
  contactRole: "Daglig leder",
  phone: "+47 900 00 000",
  category: "Construction",
  position: "Tømrer",
  jobSummary: "Tømrere til et boligprosjekt",
  contractType: "Permanent employment",
  qualification: "Skilled worker with trade certificate",
  candidatesNeeded: "3",
  certifications: "Trade certificate preferred",
  drivingLicence: "B",
  dNumber: "we_handle",
  workTasks: ["Innvendig snekring", "Montering av vinduer"],
  personalQualities: ["Nøyaktig", "Selvstendig"],
  salary: "280-320",
  salaryPeriod: "Per hour",
  overtime: "true",
  accommodation: "We help find accommodation",
  accommodationCost: "6000",
  localTravel: "Covered",
  internationalTravel: "company_covered",
  rotation: "4 weeks on / 2 weeks off",
  weOffer: ["Arbeidsklær", "Verktøy"],
  startDate: "Immediate",
  city: "Trondheim",
  region: "Trøndelag",
  roleDetails: [
    { label: "Trade certificate (fagbrev) required?", value: "Yes" },
    { label: "Type of work", value: "New build" },
  ],
  clientNote: "Oppstart helst før jul.",
};

describe("the receipt a client gets for a request", () => {
  const sections = clientReceiptSections(ORDER);

  it("prints every answer the office copy carries, none left out", () => {
    const values = receiptValues(sections);
    for (const given of [
      ORDER.referenceId,
      ORDER.company,
      "912 345 678",
      ORDER.email,
      ORDER.fullName,
      ORDER.contactRole,
      ORDER.phone,
      ORDER.category,
      ORDER.position,
      ORDER.jobSummary,
      ORDER.contractType,
      ORDER.qualification,
      ORDER.candidatesNeeded,
      ORDER.certifications,
      ORDER.drivingLicence,
      ORDER.salary,
      ORDER.accommodationCost,
      ORDER.city,
      ORDER.region,
      ORDER.clientNote,
      "Innvendig snekring; Montering av vinduer",
      "Nøyaktig, Selvstendig",
      "Arbeidsklær, Verktøy",
      "Yes",
      "New build",
    ]) {
      expect(values).toContain(given);
    }
  });

  it("says our labels and the coded answers in Norwegian, and leaves what they chose as they chose it", () => {
    const flat = sections.flatMap((s) => [s.heading, ...s.rows.map((r) => `${r.label}: ${r.value}`)]);
    expect(flat).toContain("Kontaktopplysninger");
    expect(flat).toContain("Vilkår dere tilbyr");
    expect(flat).toContain("Tjeneste: Rekruttering");
    expect(flat).toContain("Type virksomhet: Egen virksomhet");
    expect(flat).toContain("D-nummer: Vi ordner prosedyren");
    expect(flat).toContain("Lønnsperiode: Per time");
    expect(flat).toContain("Overtid: Ja");
    expect(flat).toContain("Bolig: Dere hjelper med å finne bolig");
    expect(flat).toContain("Lokal reise: Dekket");
    expect(flat).toContain("Internasjonal reise: Dekkes av firmaet");
    expect(flat).toContain("Rotasjon: 4 uker på / 2 uker av");
    expect(flat).toContain("Ønsket oppstart: Snarest");
    // Their own choices from the wizard's lists are not rewritten.
    expect(flat).toContain("Kontraktstype: Permanent employment");
    expect(flat).toContain("Trade certificate (fagbrev) required?: Yes");
    expect(JSON.stringify(flat)).not.toMatch(/company_covered|has_d_number|we_handle/);
  });

  it("prints the org number as an org number, spaced and not as a link a mail client would dial", () => {
    const org = sections.flatMap((s) => s.rows).find((r) => r.label === "Org.nr");
    expect(org?.value).toBe("912 345 678");
    expect(org?.noLink).toBe(true);
    const html = letterFacts([org!]);
    expect(html).toContain('<a href="#" style="color:');
    expect(html).toContain("912 345 678</a>");
  });

  it("keeps the order the office copy has, with the role and their note at the end", () => {
    expect(sections.map((s) => s.heading)).toEqual([
      "Forespørselen",
      "Kontaktopplysninger",
      "Stillingen",
      "Vilkår dere tilbyr",
      "Sted",
      "Om rollen",
      "Deres merknad",
    ]);
  });

  it("knows every service and both kinds of firm", () => {
    expect(serviceNb("staffing")).toBe("Bemanning");
    expect(serviceNb("sourcing")).toBe("Sourcing");
    expect(serviceNb("advertising")).toBe("Stillingsannonse");
    expect(requesterKindNb("agency")).toBe("Bemannings- eller rekrutteringsbyrå");
    expect(requesterKindNb("")).toBe("");
  });

  it("leaves from the mailbox the server lets the site send as, and every reply goes to the office", () => {
    // post@ as the from was refused by the server (550 5.7.1, 25 September 2026).
    expect(REQUEST_RECEIPT_FROM).toBe('"ArbeidMatch Norge AS" <no-reply@arbeidmatch.no>');
    expect(REQUEST_RECEIPT_REPLY_TO).toBe("post@arbeidmatch.no");
  });
});
