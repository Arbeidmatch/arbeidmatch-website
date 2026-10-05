import { describe, expect, it } from "vitest";

import { addressLine, alertsWords, freeAlertsFrom, isProfileToken, orgNumberNo, ownLink, profileFrom } from "./profile";

const answer = {
  me: { email: "kari@eksempelbygg.example", contact_id: "00000000-0000-4000-8000-0000000000d1" },
  company: { name: "Eksempel Bygg AS", org_number: "912345678", address: "Eksempelveien 1", postal_code: "7030", city: "Trondheim", billing_same_as_address: true, invoice_ehf: false },
  contacts: [{ id: "00000000-0000-4000-8000-0000000000d1", full_name: "Kari Eksempel", role: "Daglig leder", email: "kari@eksempelbygg.example", phone: null, mine: true }],
  alerts: { plan: { status: "free", until: "2027-04-30", nextInvoiceOn: "2027-05-01", cancelled: false, freeOnly: false, periodPrice: 6800, billing: "yearly", offer_url: "https://ats.arbeidmatch.no/offer/abc" }, free_until: null, projects_url: "https://www.arbeidmatch.no/prosjekter/00000000-0000-4000-8000-000000000001" },
  offers: [{ number: "AM-P-2026-001", title: "Tilbud prosjektvarsler", state: "Signert", open: false, sent_at: "2026-09-30T08:00:00Z", url: "https://ats.arbeidmatch.no/offer/abc" }],
  documents: [{ title: "Tilbud prosjektvarsler AM-P-2026-001", signed_at: "2026-10-02T09:14:00Z", pdf_url: "https://evil.example/steal" }],
};

describe("Min side: the ATS's answer, read defensively", () => {
  it("takes a page as it is sent", () => {
    const p = profileFrom(answer);
    expect(p?.company.name).toBe("Eksempel Bygg AS");
    expect(p?.contacts[0].mine).toBe(true);
    expect(p?.alerts?.plan?.periodPrice).toBe(6800);
    // Missing text fields are empty strings, not the word undefined on a page.
    expect(p?.company.phone).toBe("");
  });

  it("is not a page without a company", () => {
    expect(profileFrom({ me: {}, contacts: [] })).toBeNull();
    expect(profileFrom(null)).toBeNull();
    expect(profileFrom({ error: "Lenken er ikke gyldig lenger." })).toBeNull();
  });

  it("shows a link only when it leads to one of our own sites", () => {
    const p = profileFrom(answer);
    expect(p?.offers[0].url).toBe("https://ats.arbeidmatch.no/offer/abc");
    expect(p?.documents[0].pdf_url).toBeNull();
    expect(ownLink("http://ats.arbeidmatch.no/offer/abc")).toBeNull();
    expect(ownLink("javascript:alert(1)")).toBeNull();
    expect(ownLink("https://ats.arbeidmatch.no.evil.example/x")).toBeNull();
    expect(ownLink("/prosjekter/00000000-0000-4000-8000-000000000001")).toBe("/prosjekter/00000000-0000-4000-8000-000000000001");
  });

  it("knows a key from anything that could change a path", () => {
    expect(isProfileToken("00000000-0000-4000-8000-0000000000a1")).toBe(true);
    expect(isProfileToken("../admin")).toBe(false);
    expect(isProfileToken("")).toBe(false);
  });
});

describe("Min side: the words on the page", () => {
  it("says where the project alerts stand", () => {
    expect(alertsWords(null).title).toBe("Ingen prosjektvarsler ennå");
    const free = alertsWords(profileFrom(answer)!.alerts);
    expect(free.title).toBe("Gratis til 30. april 2027");
    expect(free.text).toContain("kr 6 800 per år");
    expect(free.text).toContain("første faktura 1. mai 2027");
    const cancelled = alertsWords({ plan: { ...profileFrom(answer)!.alerts!.plan!, status: "paid", until: "2028-04-30", cancelled: true }, free_until: null, projects_url: null });
    expect(cancelled.title).toBe("Abonnementet avsluttes 30. april 2028");
  });

  it("offers free alerts to a firm we worked with, and only whole months between 1 and 36 (ORDER 50)", () => {
    expect(alertsWords(null, 7).title).toBe("Gratis prosjektvarsler i 7 måneder");
    expect(alertsWords(null, 1).title).toBe("Gratis prosjektvarsler i 1 måned");
    expect(freeAlertsFrom({ months: 7 })).toEqual({ months: 7 });
    expect(freeAlertsFrom({ months: 0 })).toBeNull();
    expect(freeAlertsFrom({ months: 40 })).toBeNull();
    expect(freeAlertsFrom(null)).toBeNull();
  });

  it("never names where the projects come from", () => {
    for (const a of [null, profileFrom(answer)!.alerts, { plan: null, free_until: "2027-01-31", projects_url: null }]) {
      const w = alertsWords(a);
      expect(`${w.title} ${w.text}`.toLowerCase()).not.toContain("doffin");
    }
  });

  it("prints a number and an address as a Norwegian reads them", () => {
    expect(orgNumberNo("912345678")).toBe("912 345 678");
    expect(addressLine("Eksempelveien 1", "7030", "Trondheim")).toBe("Eksempelveien 1, 7030 Trondheim");
    expect(addressLine("", "", "")).toBe("");
  });
});

describe("Min side: one section at a time", () => {
  it("has nine sections in two groups, each with a name and a line that says what it is", async () => {
    const { SECTIONS, SECTION_GROUPS } = await import("./profile");
    expect(SECTIONS.map((s) => s.key)).toEqual(["firma", "fakturaopplysninger", "kontakter", "kandidater", "tilbud", "timelister", "fakturaer", "dokumenter", "varsler"]);
    expect(SECTION_GROUPS.map((g) => g.key)).toEqual(["firmaet", "samarbeidet"]);
    for (const s of SECTIONS) {
      expect(s.label.length).toBeGreaterThan(2);
      expect(s.about.endsWith(".")).toBe(true);
      expect(SECTION_GROUPS.some((g) => g.key === s.group)).toBe(true);
    }
    // Where invoices are sent and the invoices themselves are two different names.
    expect(new Set(SECTIONS.map((s) => s.label)).size).toBe(SECTIONS.length);
  });

  it("opens the section the address asks for, and leaves a dialog's hash alone", async () => {
    const { sectionFromHash } = await import("./profile");
    expect(sectionFromHash("#fakturaer")).toBe("fakturaer");
    expect(sectionFromHash("#faktura")).toBe("fakturaopplysninger");
    expect(sectionFromHash("#logg-inn")).toBeNull();
    expect(sectionFromHash("")).toBeNull();
  });

  it("says where each section stands in a few words", async () => {
    const { sectionHint } = await import("./profile");
    const p = profileFrom(answer)!;
    expect(sectionHint("firma", p)).toBe("Trondheim");
    expect(sectionHint("fakturaopplysninger", p)).toBe("Ikke oppgitt");
    expect(sectionHint("kontakter", p)).toBe("1 person");
    expect(sectionHint("varsler", p)).toBe("Gratis");
    expect(sectionHint("tilbud", p)).toBe("Ingen venter på svar");
    expect(sectionHint("dokumenter", p)).toBe("1 dokument");
    // An ATS that sends none of the three newer things gives empty sections, not a broken page.
    expect(sectionHint("timelister", p)).toBe("Ingen ennå");
    expect(sectionHint("kandidater", p)).toBe("Ingen ennå");
    expect(sectionHint("fakturaer", p)).toBe("For fakturaadressen");
  });

  it("reads timesheets, invoices and candidates, and counts what waits", async () => {
    const { sectionHint, kronerNo } = await import("./profile");
    const p = profileFrom({
      ...answer,
      timesheets: { waiting: [{ title: "Timeliste uke 40", sent_at: "2026-09-29T08:00:00Z", url: "https://ats.arbeidmatch.no/timeliste/abc" }], signed: [] },
      invoices: { allowed: true, rows: [{ id: 101, number: "1042", date: "2026-09-01", due: "2026-09-15", amount: 12500, outstanding: 12500, state: "Forfalt", state_key: "overdue" }, { id: "x" }] },
      candidates: [{ title: "Tømrere til Eksempelprosjektet", sent_at: "2026-09-20T08:00:00Z", state: "Venter på svar", url: "https://evil.example/x" }],
    })!;
    expect(sectionHint("timelister", p)).toBe("1 venter på signatur");
    expect(p.invoices.rows.length).toBe(1);
    expect(sectionHint("fakturaer", p)).toBe("1 ubetalt");
    expect(sectionHint("kandidater", p)).toBe("1 presentasjon");
    expect(p.candidates[0].url).toBeNull();
    expect(kronerNo(12500)).toBe("kr 12 500,00");
  });
});
