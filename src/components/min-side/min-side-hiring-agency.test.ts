import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import MinSideHiring, { type ProjectsTrial } from "@/components/min-side/MinSideHiring";
import { hiringFrom, hiringIntentFromSearch, hiringRequest, type Hiring } from "@/lib/min-side/profile";

/**
 * ORDER 220: the adverts of staffing agencies sit in their own tab, "Via bemanningsbyrå",
 * never among the firms that hire directly. Invented org numbers, test data only.
 */

vi.mock("@/lib/prosjekter/ats", () => ({ callAts: vi.fn(), callAtsRaw: vi.fn() }));

const direct = {
  orgnr: "912345678",
  name: "Direktebygg AS",
  town: "Trondheim",
  county: "NO050",
  county_name: "Trøndelag",
  trades: ["carpenter"],
  trade_names: ["Tømrer"],
  positions: 2,
  published: "2026-11-01T08:00:00Z",
  status: "new",
  behov: "To tømrere fra november",
  english_ok: true,
  won: null,
  note: null,
  follow_up_on: null,
  opened: false,
};

const agency = (extra: Record<string, unknown> = {}) => ({
  orgnr: "888274022",
  name: "WORKSHOP BEMANNING & KOMPETANSE AS AVD OSLO",
  town: "Oslo",
  county_name: "Oslo",
  trade_names: ["Elektriker"],
  positions: 3,
  published: "2026-11-02T08:00:00Z",
  client_not_named: true,
  ...extra,
});

const raw = (extra: Record<string, unknown> = {}) => ({
  subscription: { status: "active", counties: ["Trøndelag"], trades: ["Tømrer"], free_until: "2026-12-31", tier: "premium", frequency: "weekly" },
  terms: { accepted: true, ready: true, title: "Vilkår", paragraphs: ["Første avsnitt."], version: "1", consent: "Jeg godtar" },
  rows: [direct],
  agency_rows: [agency(), agency({ orgnr: "934450744", name: "MANPOWER INDUSTRI AS AVD ELEKTRO", client_not_named: false })],
  last_viewed_at: "2026-10-10T00:00:00Z",
  filters: { counties: [{ code: "NO050", name: "Trøndelag" }], trades: [{ key: "carpenter", name: "Tømrer" }] },
  projects: null,
  ...extra,
});

const hiring = (extra: Record<string, unknown> = {}) => hiringFrom(raw(extra)) as Hiring;
const noTrial: ProjectsTrial = { start: () => {}, busy: false, error: null, dialog: null };
const props = (h: Hiring, more: Record<string, unknown> = {}) => ({
  token: "00000000-0000-4000-8000-0000000000a1",
  hiring: h,
  since: h.last_viewed_at,
  send: vi.fn(),
  sendData: vi.fn(),
  trial: noTrial,
  onAskPeople: () => {},
  ...more,
});

describe("the agency rows of the ATS's answer", () => {
  it("are typed apart from the firms, and a row that fits nothing is dropped", () => {
    const h = hiring({ agency_rows: [agency(), agency({ orgnr: "12" }), "x"] });
    expect(h.rows).toHaveLength(1);
    expect(h.agency_rows).toHaveLength(1);
    expect(h.agency_rows[0]).toMatchObject({ orgnr: "888274022", client_not_named: true, positions: 3, trade_names: ["Elektriker"] });
  });

  it("are an empty list from an older ATS", () => {
    const old = raw();
    delete (old as Record<string, unknown>).agency_rows;
    expect((hiringFrom(old) as Hiring).agency_rows).toEqual([]);
  });

  it("opens the tab from the letter's second button", () => {
    expect(hiringIntentFromSearch("?hiring=agency")).toBe("agency");
    expect(hiringIntentFromSearch("?hiring=projects")).toBe("projects");
    expect(hiringIntentFromSearch("?hiring=other")).toBeNull();
  });

  it("lets Om bedriften through to the ATS for an agency, with a nine-digit number only", () => {
    expect(hiringRequest({ action: "hiring_agency_card", orgnr: "888274022" })).toEqual({ action: "hiring_agency_card", orgnr: "888274022" });
    expect(hiringRequest({ action: "hiring_agency_card", orgnr: "12" })).toBeNull();
  });
});

describe("the two tabs", () => {
  it("shows both with their counts, and the firms that hire directly by default, none of the agencies", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring())));
    // ORDER 252: the firms tab counts the list the ATS answers, fetched once the page is in a browser.
    expect(html).toContain("Bedrifter som ansetter");
    expect(html).toContain("Via bemanningsbyrå (2)");
    expect(html).toContain("Nye denne uken");
    expect(html).not.toContain("WORKSHOP BEMANNING");
    expect(html).not.toContain("MANPOWER INDUSTRI");
  });

  it("shows the tab even when empty, with the count 0", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ agency_rows: [] }))));
    expect(html).toContain("Via bemanningsbyrå (0)");
  });

  it("the agency tab holds the agency under its register name, the not-named chip, and no lead controls", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring(), { openAgencyTab: true })));
    expect(html).toContain("WORKSHOP BEMANNING &amp; KOMPETANSE AS AVD OSLO");
    expect(html).toContain("Bemanningsbyrå, kunden ikke oppgitt");
    expect(html).toContain("Om bedriften");
    // The named agency carries no chip: one chip for the one anonymous advert, per layout (table and phone list).
    expect(html.match(/Bemanningsbyrå, kunden ikke oppgitt/g)).toHaveLength(2);
    expect(html).not.toContain("Direktebygg AS");
    expect(html).not.toContain("Nye denne uken");
    expect(html).not.toContain("Følg");
    expect(html).not.toMatch(/aria-label="Status/);
  });

  it("an empty agency tab says so in one line", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ agency_rows: [] }), { openAgencyTab: true })));
    expect(html).toContain("Ingen stillinger via bemanningsbyrå akkurat nå.");
  });
});
