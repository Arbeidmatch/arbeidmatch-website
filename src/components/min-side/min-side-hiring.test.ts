import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideHiring, { ContactBlock, FirmsView, PREMIUM_OPENS, ProjectsTeaser, TABLE_COLUMNS, TermsForm, type FirmsViewProps, type ProjectsTrial } from "@/components/min-side/MinSideHiring";
import {
  NO_HIRING_QUERY,
  TABLE_LOCKS,
  clientTableFrom,
  hiringCardFrom,
  hiringContactFrom,
  hiringCsvHref,
  hiringCsvQuery,
  hiringFrom,
  hiringRequest,
  hiringTableHref,
  hiringTableQuery,
  leadAction,
  leadCardText,
  needWords,
  nextHiringStatus,
  profileFrom,
  sectionHint,
  showsProjectsTeaser,
  visibleSections,
  type ClientTable,
  type Hiring,
  type HiringRow,
} from "@/lib/min-side/profile";

/** ORDER 157: Bedrifter som ansetter on Min side, and the projects teaser. */

const callAts = vi.fn();
const callAtsRaw = vi.fn();
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...args: unknown[]) => callAts(...args), callAtsRaw: (...args: unknown[]) => callAtsRaw(...args) }));

const source = (file: string) => readFileSync(path.resolve(__dirname, file), "utf8");

const row = (extra: Partial<HiringRow> = {}): Record<string, unknown> => ({
  orgnr: "912345678",
  name: "Eksempel Bygg AS",
  town: "Trondheim",
  county: "NO050",
  county_name: "Trøndelag",
  trades: ["carpenter"],
  trade_names: ["Tømrer"],
  positions: 2,
  published: "2026-10-20T08:00:00Z",
  status: "new",
  behov: "To tømrere fra november",
  english_ok: true,
  won: null,
  note: null,
  follow_up_on: null,
  opened: false,
  ...extra,
});

const rawHiring = (extra: Record<string, unknown> = {}) => ({
  subscription: { status: "active", counties: ["Trøndelag"], trades: ["Tømrer"], free_until: "2026-12-31", tier: "premium", frequency: "weekly" },
  terms: { accepted: true, ready: true, title: "Vilkår for Bedrifter som ansetter", paragraphs: ["Første avsnitt."], version: "1", consent: "Jeg har lest og godtar vilkårene på vegne av Test AS" },
  rows: [row(), row({ orgnr: "998877665", name: "Annen Bygg AS", county: "NO030", county_name: "Oslo", trades: ["mason"], trade_names: ["Murer"], english_ok: null, published: "2026-10-01T08:00:00Z" })],
  last_viewed_at: "2026-10-10T00:00:00Z",
  filters: { counties: [{ code: "NO050", name: "Trøndelag" }, { code: "NO030", name: "Oslo" }, { code: "<script>", name: "x" }], trades: [{ key: "carpenter", name: "Tømrer" }] },
  projects: null,
  ...extra,
});

const hiring = (extra: Record<string, unknown> = {}) => hiringFrom(rawHiring(extra)) as Hiring;
const page = { me: { email: "test@eksempel.invalid" }, company: { name: "Test AS" } };

const noTrial: ProjectsTrial = { start: () => {}, busy: false, error: null, dialog: null };
const props = (h: Hiring) => ({ token: "00000000-0000-4000-8000-0000000000a1", hiring: h, since: h.last_viewed_at, send: vi.fn(), sendData: vi.fn(), trial: noTrial, onAskPeople: () => {} });

/** ORDER 252: one page of the list as the ATS answers it. Invented firms, test data only. */
const tableRow = (extra: Record<string, unknown> = {}) => ({
  rank: 1,
  orgnr: "912345678",
  name: "Eksempel Bygg AS",
  town: "Trondheim",
  county_name: "Trøndelag",
  trades: ["Tømrer"],
  label: "Ny bedrift",
  need: { urgent: true, adverts30: 3, openDays: 12, positions: 2 },
  found_at: "2026-11-02T08:00:00Z",
  english_ok: true,
  recommended: null,
  status: "new",
  note: null,
  follow_up_on: null,
  watched: false,
  ...extra,
});
const rawTable = (extra: Record<string, unknown> = {}) => ({
  tier: "premium",
  rows: [tableRow(), tableRow({ rank: 2, orgnr: "998877665", name: "Annen Bygg AS", need: { urgent: false, adverts30: 1, openDays: 47, positions: 1 }, label: null })],
  total: 2,
  all: 128,
  page: 1,
  size: 20,
  pages: 1,
  tiles: { newThisWeek: 9, urgent: 4, englishOk: 6, recommended: 1 },
  locks: [],
  filters: { counties: [{ code: "NO050", name: "Trøndelag" }], occupations: [{ key: "carpenter", name: "Tømrer" }] },
  ...extra,
});
const table = (extra: Record<string, unknown> = {}) => clientTableFrom(rawTable(extra)) as ClientTable;
const view = (t: ClientTable | null, more: Partial<FirmsViewProps> = {}) =>
  renderToStaticMarkup(createElement(FirmsView, { table: t, loading: false, error: null, locks: t?.locks ?? [], busyOrg: null, onOpen: () => {}, onCycle: () => {}, onPage: () => {}, ...more }));

describe("the hiring part of the ATS's answer", () => {
  it("is null when absent or malformed", () => {
    expect(profileFrom(page)!.hiring).toBeNull();
    expect(profileFrom({ ...page, hiring: "x" })!.hiring).toBeNull();
    expect(profileFrom({ ...page, hiring: { subscription: {} } })!.hiring).toBeNull();
    expect(hiringFrom(null)).toBeNull();
  });

  it("types the rows and drops what does not fit", () => {
    const h = hiringFrom(rawHiring({ rows: [row(), row({ orgnr: "12" }), row({ county: "Oslo", status: "weird" as never, positions: "3" as never }), "x"] }))!;
    expect(h.rows).toHaveLength(2);
    expect(h.rows[0]).toMatchObject({ orgnr: "912345678", name: "Eksempel Bygg AS", county: "NO050", trades: ["carpenter"], positions: 2, status: "new", english_ok: true });
    expect(h.rows[1]).toMatchObject({ county: null, status: "new", positions: 0 });
    expect(h.subscription.tier).toBe("premium");
    expect(h.terms.accepted).toBe(true);
    expect(h.filters.counties.map((c) => c.code)).toEqual(["NO050", "NO030"]);
    expect(h.projects).toBeNull();
  });

  it("reads the projects teaser with only the fields that are sent", () => {
    const h = hiring({ projects: { count: 42, won_count: 3, counties: ["Trøndelag"], rows: [{ id: "p1", title: "Ny skole", county: "Trøndelag", stage: "tender", buyer: "x" }], request: null, terms: { title: "Vilkår", paragraphs: ["a"], version: "1", consent: "Ja" }, terms_accepted: false, email: "test@eksempel.invalid" } });
    expect(h.projects?.rows).toEqual([{ id: "p1", title: "Ny skole", county: "Trøndelag", stage: "tender" }]);
    expect(h.projects?.count).toBe(42);
  });
});

describe("the section is there only with hiring alerts", () => {
  it("leaves it out of the list without hiring, and shows it with", () => {
    const without = profileFrom(page)!;
    const withHiring = profileFrom({ ...page, hiring: rawHiring() })!;
    expect(visibleSections(without).some((s) => s.key === "ansetter")).toBe(false);
    expect(visibleSections(withHiring).some((s) => s.key === "ansetter")).toBe(true);
  });

  it("says where it stands in the list", () => {
    expect(sectionHint("ansetter", profileFrom({ ...page, hiring: rawHiring() })!)).toBe("2 bedrifter");
    expect(sectionHint("ansetter", profileFrom({ ...page, hiring: rawHiring({ terms: { ...rawHiring().terms, accepted: false } }) })!)).toBe("Godta vilkårene");
    expect(sectionHint("ansetter", profileFrom({ ...page, hiring: rawHiring({ subscription: { ...rawHiring().subscription, tier: "basis" } }) })!)).toBe("Basis");
  });

  it("the client filters the list and falls back to the firm for an old link", () => {
    const client = source("MinSideClient.tsx");
    expect(client).toContain("visibleSections(profile)");
    expect(client).toContain('chosen === "ansetter" && !hiring ? "firma"');
  });
});

describe("the terms gate", () => {
  it("Godta is disabled until the box is ticked", () => {
    const html = renderToStaticMarkup(createElement(TermsForm, { terms: { title: "Vilkår", paragraphs: ["Avsnitt"], version: "1", consent: "Jeg godtar" }, onAccept: async () => ({ ok: true as const }), onCancel: () => {} }));
    expect(html).toMatch(/<button type="submit"[^>]*disabled=""[^>]*>Godta<\/button>/);
    expect(html).toContain("Jeg godtar");
    expect(source("MinSideHiring.tsx")).toContain("disabled={!ticked}");
  });

  it("shows nothing of the list before acceptance, and only one line when the terms are not ready", () => {
    const pending = hiring({ terms: { ...rawHiring().terms, accepted: false } });
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(pending)));
    expect(html).toContain("Les vilkår");
    expect(html).not.toContain("Eksempel Bygg AS");
    const notReady = hiring({ terms: { ...rawHiring().terms, accepted: false, ready: false } });
    expect(renderToStaticMarkup(createElement(MinSideHiring, props(notReady)))).toBe("<p class=\"text-sm text-[#6B7584]\">Tjenesten åpnes snart.</p>");
  });
});

describe("Premium and Basis", () => {
  it("Premium shows the open filters, the tiles and the download", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring())));
    expect(html).toContain('href="/api/min-side/00000000-0000-4000-8000-0000000000a1/hiring-csv"');
    expect(html).not.toContain("data-locked");
    expect(html).toContain('placeholder="Bedrift, fag eller sted"');
    expect(html).toContain('aria-label="Fylke"');
    expect(html).toContain('aria-label="Fag"');
    expect(html).toContain(">Nye siden sist<");
    expect(html).toContain(">Flere filtre<");
    for (const tile of ["Nye denne uken", "Haster", "Engelsk ok", "Anbefalt av ArbeidMatch"]) expect(html).toContain(tile);
    expect(html).not.toContain(PREMIUM_OPENS);
  });

  // ORDER 252: Basis is the same page with the Premium parts locked, and one row under the table toward Premium.
  it("Basis locks Haster, Engelsk ok, Anbefalt, Fag, Nye siden sist, Last ned and Behov, and asks for Premium in one place", () => {
    const basis = hiring({ subscription: { ...rawHiring().subscription, tier: "basis" } });
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(basis)));
    expect(html).toContain("Fag · Premium");
    expect(html).toContain("Nye siden sist · Premium");
    expect(html).toContain("Last ned · Premium");
    expect(html).not.toContain("hiring-csv");
    expect(html).not.toContain('aria-label="Fag"');
    // Three locked tiles, Nye denne uken open.
    expect(html.match(/data-tile=""[^>]*aria-disabled="true"/g)).toHaveLength(3);
    expect(html).toContain("data-premium-row");
    expect(html).toContain(PREMIUM_OPENS);
    // The one way to Premium (ORDER 181): closed plans say the one quiet line, no second button.
    expect(html).toContain("data-plans-closed");
    expect(html).toContain("Hvor nyttig er listen?");
    expect(leadAction("basis")).toBe("premium");
    expect(leadAction("premium")).toBe("card");
    expect(source("MinSideHiring.tsx")).toContain('title="Bedriftskortet er Premium"');
    expect(source("MinSideHiring.tsx").match(/send\(\{ action: "hiring_premium"/g)).toHaveLength(2);
    // Behov locked in the table and on the phone card.
    const locked = view(table({ tier: "basis", locks: [...TABLE_LOCKS], rows: [tableRow({ need: null, english_ok: null })] }));
    expect(locked).toContain("data-locked");
    expect(locked).toContain("Behov · Premium");
    expect(locked).not.toContain("data-haster");
  });
});

describe("the list never points to where a position was announced", () => {
  it("has no NAV and no advert link in the component", () => {
    const src = source("MinSideHiring.tsx");
    expect(src).not.toMatch(/\bNAV\b/);
    expect(src).not.toMatch(/nav\.no|arbeidsplassen|annonse_url|ad_url|advert_url/i);
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring())));
    expect(html).not.toMatch(/\bNAV\b/);
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(view(table())).not.toContain("<a ");
  });
});

describe("a firm hiring on Indeed (ORDER 249)", () => {
  const link = "https://to.indeed.com/aa1bb2cc3dd4";

  it("keeps only an https link on Indeed in the profile", () => {
    const h = hiring({ rows: [row({ indeed_link: link }), row({ orgnr: "998877665", indeed_link: "https://evil.example/x" as never }), row({ orgnr: "998877666", indeed_link: "http://to.indeed.com/x" as never })] });
    expect(h.rows.map((r) => r.indeed_link)).toEqual([link, null, null]);
  });

  // ORDER 252: the list page carries no source by design, so the table has no Indeed chip.
  it("is no chip on the firms table", () => {
    expect(source("MinSideHiring.tsx")).not.toContain("data-indeed");
    const html = view(table({ rows: [tableRow({ indeed_link: link })] }));
    expect(html).not.toContain("Indeed");
    expect(html).not.toContain(link);
  });
});

describe("the list query and the CSV link (ORDER 252)", () => {
  const token = "00000000-0000-4000-8000-0000000000a1";

  it("builds the list address from the choice on screen", () => {
    expect(hiringTableHref(token, NO_HIRING_QUERY)).toBe(`/api/min-side/${token}/hiring`);
    expect(hiringTableHref(token, { ...NO_HIRING_QUERY, q: " tømrer ", county: "NO0A2", occupation: "carpenter", onlyNew: true, english: true, status: "called", sort: "newest", page: 3, size: 10 })).toBe(
      `/api/min-side/${token}/hiring?q=t%C3%B8mrer&county=NO0A2&occupation=carpenter&new=1&english=1&status=called&sort=newest&page=3&size=10`,
    );
    expect(hiringTableHref(token, { ...NO_HIRING_QUERY, county: "Oslo", q: "<b>" })).toBe(`/api/min-side/${token}/hiring`);
  });

  it("carries the filters in the CSV link, without the page", () => {
    expect(hiringCsvHref(token, { ...NO_HIRING_QUERY, county: "NO0A2", occupation: "carpenter", english: true, onlyNew: true, status: "won", q: "bygg", page: 4 })).toBe(
      `/api/min-side/${token}/hiring-csv?q=bygg&county=NO0A2&occupation=carpenter&new=1&english=1&status=won`,
    );
    expect(hiringCsvHref(token, NO_HIRING_QUERY)).toBe(`/api/min-side/${token}/hiring-csv`);
  });

  it("the CSV proxy accepts only the filter shapes, the older trade included", () => {
    expect(hiringCsvQuery(new URLSearchParams("county=NO0A2&trade=carpenter&english=1&new=1"))).toBe("county=NO0A2&trade=carpenter&english=1&new=1");
    expect(hiringCsvQuery(new URLSearchParams("occupation=carpenter&status=meeting&q=bygg&sort=name"))).toBe("occupation=carpenter&status=meeting&q=bygg&sort=name");
    expect(hiringCsvQuery(new URLSearchParams(""))).toBe("");
    expect(hiringCsvQuery(new URLSearchParams("county=Oslo"))).toBeNull();
    expect(hiringCsvQuery(new URLSearchParams("english=yes"))).toBeNull();
    expect(hiringCsvQuery(new URLSearchParams("status=lost"))).toBeNull();
    expect(hiringCsvQuery(new URLSearchParams("page=2"))).toBeNull();
    expect(hiringCsvQuery(new URLSearchParams("token=x"))).toBeNull();
  });

  it("the list proxy accepts the filters, a page and the three sizes, each once", () => {
    expect(hiringTableQuery(new URLSearchParams("q=bygg&county=NO050&occupation=carpenter&new=1&english=1&status=new&sort=default&page=2&size=50"))).toBe(
      "q=bygg&county=NO050&occupation=carpenter&new=1&english=1&status=new&sort=default&page=2&size=50",
    );
    for (const bad of ["size=30", "page=0", "page=x", "sort=random", "status=lost", "trade=carpenter", "county=NO050&county=NO030", `q=${"x".repeat(101)}`, "q=%3Cscript%3E", "token=x"]) {
      expect(hiringTableQuery(new URLSearchParams(bad))).toBeNull();
    }
  });

  it("moves the status chip on in the order a call goes", () => {
    expect(["new", "called", "meeting", "won", "not_relevant"].map((s) => nextHiringStatus(s as never))).toEqual(["called", "meeting", "won", "not_relevant", "new"]);
    expect(nextHiringStatus("contacted")).toBe("called");
  });
});

describe("the list page of the ATS's answer (ORDER 252)", () => {
  it("types the rows, keeps only known locks, and puts recommended firms first", () => {
    const t = table({
      rows: [tableRow(), tableRow({ orgnr: "12" }), tableRow({ orgnr: "911111111", name: "Anbefalt AS", recommended: { reason: "x".repeat(400) } })],
      locks: ["download", "nope"],
    });
    expect(t.rows.map((r) => r.orgnr)).toEqual(["911111111", "912345678"]);
    expect(t.rows[0].recommended?.reason.length).toBeLessThanOrEqual(160);
    expect(t.locks).toEqual(["download"]);
    expect(t.all).toBe(128);
    expect(clientTableFrom({ rows: "x" })).toBeNull();
    expect(clientTableFrom(null)).toBeNull();
  });

  it("says the need in words: urgent with the adverts of 30 days, else how long it has been open", () => {
    expect(needWords({ urgent: true, adverts30: 3, openDays: 12, positions: 2 })).toBe("3 utlysninger på 30 dager");
    expect(needWords({ urgent: true, adverts30: 1, openDays: null, positions: 1 })).toBe("1 utlysning på 30 dager");
    expect(needWords({ urgent: false, adverts30: 1, openDays: 47, positions: 1 })).toBe("Åpen i 47 dager");
  });
});

describe("the firms table and the phone cards (ORDER 252)", () => {
  it("has exactly seven column headers: #, Bedrift, Sted, Fag, Behov, Funnet, Status", () => {
    const html = view(table());
    const thead = html.slice(html.indexOf("<thead>"), html.indexOf("</thead>"));
    const heads = [...thead.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]);
    expect(heads).toEqual([...TABLE_COLUMNS]);
    expect(heads).toEqual(["#", "Bedrift", "Sted", "Fag", "Behov", "Funnet", "Status"]);
    expect(html.match(/<tr data-row=""[^>]*>[\s\S]*?<\/tr>/)![0].match(/<td/g)).toHaveLength(7);
  });

  it("shows Haster and the adverts, or how long it has been open, and the status as a chip", () => {
    const html = view(table());
    expect(html).toContain(">Haster<");
    expect(html).toContain("3 utlysninger på 30 dager");
    expect(html).toContain("Åpen i 47 dager");
    expect(html).toContain("Trøndelag");
    expect(html.match(/data-status-chip=""/g)).toHaveLength(4);
    expect(html).not.toMatch(/<select/);
    // Følg and Skjul live in the firm card, not on the rows.
    expect(html).not.toContain("Følg");
    expect(html).not.toContain("Skjul");
  });

  it("puts a recommended firm first on a pale gold row, with our reason under the name", () => {
    const html = view(table({ rows: [tableRow(), tableRow({ orgnr: "911111111", name: "Anbefalt Bygg AS", label: "Anbefalt av ArbeidMatch", recommended: { reason: "2 tømrere, engelsk er ok." } })] }));
    expect(html.indexOf("Anbefalt Bygg AS")).toBeLessThan(html.indexOf("Eksempel Bygg AS"));
    expect(html).toContain("2 tømrere, engelsk er ok.");
    expect(html.match(/data-recommended=""/g)).toHaveLength(2);
    expect(html).toMatch(/<tr data-row=""[^>]*bg-\[#FBF6E8\]/);
  });

  it("stacks the phone cards and gives them nothing wider than the screen", () => {
    const html = view(table());
    expect(html).toMatch(/<ul class="[^"]*flex-col[^"]*sm:hidden[^"]*" data-firms-cards="" data-hiring-table="" data-tier="premium">/);
    expect(html).toMatch(/<table class="hidden[^"]*sm:table/);
    const cards = html.slice(html.indexOf("data-firms-cards"));
    expect(cards).not.toMatch(/\b(min-w|w)-\[\d+px\]/);
    expect(cards).not.toMatch(/whitespace-nowrap[^"]*"[^>]*>[^<]{30,}/);
    expect(cards.match(/min-w-0/g)!.length).toBeGreaterThan(3);
  });

  it("pages twenty at a time with Forrige and Neste, and asks for ten on a phone", () => {
    const html = view(table({ page: 2, pages: 7 }));
    expect(html).toContain(">Forrige<");
    expect(html).toContain(">Neste<");
    expect(html).toContain("Side 2 av 7");
    expect(view(table())).not.toContain("Forrige");
    const src = source("MinSideHiring.tsx");
    expect(src).toContain("size: narrow ? 10 : 20");
    expect(src).toContain('matchMedia("(max-width: 639px)")');
  });

  it("says when nothing fits, and says an error", () => {
    expect(view(table({ rows: [], total: 0 }))).toContain("Ingen bedrifter passer filteret.");
    expect(view(null, { error: "Listen ble ikke funnet." })).toContain("Listen ble ikke funnet.");
  });
});

describe("the Kontakt block of the firm card (ORDER 252)", () => {
  const contact = { phone: "+47 73 00 00 00", email: "post@eksempel.invalid", website: "https://eksempel.invalid/", address: "Eksempelveien 1, 7030 Trondheim" };
  const render = (c: typeof contact | null) => renderToStaticMarkup(createElement(ContactBlock, { name: "Eksempel Bygg AS", contact: c, onContacted: async () => {} }));

  it("offers Ring as a tel: link and Skriv as a mailto: link, the website and the visiting address", () => {
    const html = render(contact);
    expect(html).toMatch(/href="tel:\+4773000000"[^>]*>Ring</);
    expect(html).toMatch(/href="mailto:post@eksempel.invalid"[^>]*>Skriv</);
    expect(html).toContain('href="https://eksempel.invalid/"');
    expect(html).toContain("Eksempelveien 1, 7030 Trondheim");
  });

  it("says Ingen kontaktinfo registrert without a phone and an e-mail, with the website when there is one", () => {
    const html = render({ ...contact, phone: null as never, email: null as never });
    expect(html).toContain("Ingen kontaktinfo registrert");
    expect(html).toContain('href="https://eksempel.invalid/"');
    expect(html).not.toContain("tel:");
    expect(render(null)).toContain("Ingen kontaktinfo registrert");
  });

  it("never carries a person: no name field is read or drawn", () => {
    const parsed = hiringContactFrom({ ...contact, name: "Ola Nordmann", person: "Ola Nordmann", contact_name: "Ola Nordmann" });
    expect(Object.keys(parsed!).sort()).toEqual(["address", "email", "phone", "website"]);
    expect(render(parsed as typeof contact)).not.toContain("Ola Nordmann");
    expect(hiringContactFrom({ phone: "ring meg", email: "x@y", website: "javascript:alert(1)" })).toEqual({ phone: null, email: null, website: null, address: null });
    const card = hiringCardFrom({ ...row(), contact: { ...contact, name: "Ola Nordmann" } });
    expect(card?.contact).toEqual(contact);
    const src = source("MinSideHiring.tsx");
    const block = src.slice(src.indexOf("export function ContactBlock"), src.indexOf("function LockedContact"));
    expect(block).not.toMatch(/\.name\b(?!\s*=)|contact\??\.(person|name|full_name)/);
  });

  it("asks before Ring and Skriv, then sets Kontaktet through hiring_lead; Basis sees it locked", () => {
    const src = source("MinSideHiring.tsx");
    expect(src).toContain('role="alertdialog"');
    expect(src).not.toContain("window.confirm");
    expect(src).toContain('send({ action: "hiring_lead", orgnr, status: "contacted" })');
    expect(src).toContain("<LockedContact />");
    expect(src).toContain('data-contact-locked=""');
  });
});

describe("the lead card copied as text", () => {
  it("lists the fields that are known", () => {
    const card = { ...hiring().rows[0], address: "Eksempelveien 1, 7030 Trondheim", website: "https://eksempel.invalid/", industry: "Oppføring av bygninger", employees: 12, recruits: "Rekrutterer selv", firm: null, contact: null };
    const text = leadCardText(card, "Ring mandag", "2026-11-02");
    expect(text.split("\n")[0]).toBe("Eksempel Bygg AS");
    expect(text).toContain("Org.nr: 912 345 678");
    expect(text).toContain("Språk: Aksepterer engelsk");
    expect(text).toContain("Følg opp: 2. november 2026");
    expect(text).toContain("Notat: Ring mandag");
    expect(text).not.toContain("Offentlig kontrakt");
  });
});

describe("the projects teaser", () => {
  const projects = { count: 42, won_count: 3, counties: ["Trøndelag"], rows: [{ id: "p1", title: "Ny skole", county: "Trøndelag", stage: "tender" }], request: null, terms: { title: "Vilkår", paragraphs: ["a"], version: "1", consent: "Ja" }, terms_accepted: false, email: "test@eksempel.invalid" };

  it("replaces the empty state only without alerts and free months", () => {
    const h = hiring({ projects });
    expect(showsProjectsTeaser({ alerts: null, free_alerts: null, hiring: h })).toBe(true);
    expect(showsProjectsTeaser({ alerts: null, free_alerts: { months: 3 }, hiring: h })).toBe(false);
    expect(showsProjectsTeaser({ alerts: null, free_alerts: null, hiring: hiring() })).toBe(false);
  });

  it("shows title, county and stage, and locks the rest", () => {
    const html = renderToStaticMarkup(createElement(ProjectsTeaser, { projects: hiring({ projects }).projects!, trades: ["Tømrer"], trial: noTrial }));
    expect(html).toContain("42 prosjekter i deres fylker og fag akkurat nå.");
    expect(html).toContain("Ny skole");
    expect(html).toContain("Åpen konkurranse");
    expect(html).toContain("Oppdragsgiver");
    expect(html).toContain("Fylke · Premium");
    expect(html).toContain("Prøv gratis");
  });

  it("turns green with the date once the request is sent", () => {
    const sent = hiring({ projects: { ...projects, terms_accepted: true, request: { sent_at: "2026-10-28T09:00:00Z", status: "pending" } } }).projects!;
    const html = renderToStaticMarkup(createElement(ProjectsTeaser, { projects: sent, trades: ["Tømrer"], trial: noTrial }));
    expect(html).toContain("Forespørselen er sendt. Vi behandler den så snart som mulig. Dere får e-post til test@eksempel.invalid når prøveperioden for prosjektvarsler er aktiv for Trøndelag, Tømrer.");
    expect(html).toMatch(/disabled="">Sendt 28\. oktober 2026/);
  });
});

describe("the passthrough of the hiring actions", () => {
  const token = "00000000-0000-4000-8000-0000000000a1";
  const post = async (body: unknown) => {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/min-side/[token]/route");
    const req = new NextRequest(`https://www.arbeidmatch.no/api/min-side/${token}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
    return POST(req, { params: Promise.resolve({ token }) });
  };
  beforeEach(() => {
    callAts.mockReset();
    callAts.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it("passes each action with only its named fields", async () => {
    for (const body of [
      { action: "hiring_terms", service: "hiring", extra: 1 },
      { action: "hiring_viewed", x: "y" },
      { action: "hiring_card", orgnr: "912345678" },
      { action: "hiring_lead", orgnr: "912345678", status: "contacted" },
      { action: "hiring_lead", orgnr: "912345678", note: "Ring", follow_up_on: "" },
      { action: "hiring_feedback", score: 4, text: "Bra" },
      { action: "hiring_stop" },
      { action: "hiring_premium" },
      { action: "projects_trial" },
      { action: "close_account" },
    ]) {
      expect((await post(body)).status).toBe(200);
    }
    expect(callAts.mock.calls.map((c) => c[1].body)).toEqual([
      { action: "hiring_terms", service: "hiring" },
      { action: "hiring_viewed" },
      { action: "hiring_card", orgnr: "912345678" },
      { action: "hiring_lead", orgnr: "912345678", status: "contacted" },
      { action: "hiring_lead", orgnr: "912345678", note: "Ring", follow_up_on: "" },
      { action: "hiring_feedback", score: 4, text: "Bra" },
      { action: "hiring_stop" },
      { action: "hiring_premium" },
      { action: "projects_trial" },
      { action: "close_account" },
    ]);
  });

  it("refuses what is out of shape", async () => {
    for (const body of [
      { action: "hiring_terms", service: "other" },
      { action: "hiring_card", orgnr: "../x" },
      { action: "hiring_lead", orgnr: "912345678" },
      { action: "hiring_lead", orgnr: "912345678", status: "lost" },
      { action: "hiring_lead", orgnr: "912345678", status: "called", from: "list" },
      { action: "hiring_daily_alert", on: "yes" },
      { action: "hiring_lead", orgnr: "912345678", note: "x".repeat(2001) },
      { action: "hiring_lead", orgnr: "912345678", follow_up_on: "i morgen" },
      { action: "hiring_feedback", score: 6 },
      { action: "hiring_feedback" },
    ]) {
      expect((await post(body)).status).toBe(400);
    }
    expect(callAts).not.toHaveBeenCalled();
    expect(hiringRequest({ action: "nope" })).toBeNull();
  });
});

describe("the CSV proxy", () => {
  const token = "00000000-0000-4000-8000-0000000000a1";
  const get = async (query: string, t = token) => {
    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/min-side/[token]/hiring-csv/route");
    return GET(new NextRequest(`https://www.arbeidmatch.no/api/min-side/${t}/hiring-csv${query}`), { params: Promise.resolve({ token: t }) });
  };
  beforeEach(() => callAtsRaw.mockReset());

  it("streams the ATS's CSV back as an attachment with the filters passed on", async () => {
    callAtsRaw.mockResolvedValue(new Response("Bedrift;Sted\n", { status: 200, headers: { "content-type": "text/csv" } }));
    const res = await get("?county=NO0A2&new=1");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment;/);
    expect(await res.text()).toBe("Bedrift;Sted\n");
    expect(callAtsRaw.mock.calls[0][0]).toBe(`/api/public/client-profile/${token}/hiring-csv?county=NO0A2&new=1`);
  });

  it("refuses a bad key or bad filter, and passes a 404 on", async () => {
    expect((await get("", "not-a-token")).status).toBe(404);
    expect((await get("?county=Oslo")).status).toBe(400);
    expect(callAtsRaw).not.toHaveBeenCalled();
    callAtsRaw.mockResolvedValue(new Response("{}", { status: 404, headers: { "content-type": "application/json" } }));
    expect((await get("")).status).toBe(404);
  });

  it("passes occupation, status and search on to the ATS", async () => {
    callAtsRaw.mockResolvedValue(new Response("Bedrift;Sted\n", { status: 200, headers: { "content-type": "text/csv" } }));
    expect((await get("?occupation=carpenter&status=called&q=bygg")).status).toBe(200);
    expect(callAtsRaw.mock.calls[0][0]).toBe(`/api/public/client-profile/${token}/hiring-csv?occupation=carpenter&status=called&q=bygg`);
  });
});

describe("the list proxy (ORDER 252)", () => {
  const token = "00000000-0000-4000-8000-0000000000a1";
  const get = async (query: string, t = token) => {
    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/min-side/[token]/hiring/route");
    return GET(new NextRequest(`https://www.arbeidmatch.no/api/min-side/${t}/hiring${query}`), { params: Promise.resolve({ token: t }) });
  };
  beforeEach(() => callAts.mockReset());

  it("passes the page on as JSON, private and never stored, with the query checked", async () => {
    callAts.mockResolvedValue({ status: 200, body: rawTable() });
    const res = await get("?county=NO050&occupation=carpenter&new=1&page=2&size=10");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(res.headers.get("cache-control")).toContain("private");
    expect(clientTableFrom(await res.json())?.all).toBe(128);
    expect(callAts.mock.calls[0][0]).toBe(`/api/public/client-profile/${token}/hiring?county=NO050&occupation=carpenter&new=1&page=2&size=10`);
    expect(callAts.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("refuses a bad key or a bad parameter before the ATS is asked", async () => {
    expect((await get("", "not-a-token")).status).toBe(404);
    expect((await get("", "../../etc")).status).toBe(404);
    for (const q of ["?county=Oslo", "?size=1000", "?page=-1", "?status=lost", "?sort=x", "?token=x", "?q=%3Cb%3E"]) expect((await get(q)).status).toBe(400);
    expect(callAts).not.toHaveBeenCalled();
  });

  it("passes a 404 on, and says 503 for anything else that is not a page", async () => {
    callAts.mockResolvedValue({ status: 404, body: { error: "x" } });
    expect((await get("")).status).toBe(404);
    callAts.mockResolvedValue({ status: 200, body: { nope: true } });
    expect((await get("")).status).toBe(503);
    callAts.mockResolvedValue({ status: 504, body: { error: "x" } });
    expect((await get("")).status).toBe(503);
  });
});

// ORDER 235: Ring i dag first on the page, Ikke fylt on rows and cards, the outcome marks.
describe("Ring i dag", () => {
  const ring = (cards: Record<string, unknown>[]) => ({ title: "Ring i dag", day: "2026-11-09", source: "Egne annonser fra 11.09.2026", daily_alert: false, cards });
  const card = (extra: Record<string, unknown> = {}) => ({ orgnr: "912345678", name: "Eksempel Bygg AS", town: "Trondheim", county_name: "Trøndelag", trade_names: ["Tømrer"], reason: "åpen i 47 dager · 2 stillinger", ikke_fylt: "åpen i 47 dager", opener: "Hei! Jeg ser at dere har søkt etter tømrer i Trondheim i 47 dager. Har dere fått dekket behovet?", status: "new", rank: 1, ...extra });

  it("shows three cards at most, before the list, with the reason, the chip, the line and the source", () => {
    const h = hiring({ ring: ring([card(), card({ orgnr: "998877665", rank: 2 }), card({ orgnr: "923456789", rank: 3 }), card({ orgnr: "934567890", rank: 3 })]) });
    expect(h.ring?.cards).toHaveLength(3);
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(h)));
    expect(html.match(/data-ring-card=""/g)).toHaveLength(3);
    expect(html.indexOf("data-ring-today")).toBeLessThan(html.indexOf("Bedrifter som ansetter"));
    expect(html).toContain(">Ikke fylt<");
    // The fact in numbers is said once, in the reason beside the chip.
    expect(html.split("åpen i 47 dager · 2 stillinger")).toHaveLength(4);
    expect(html).toContain("Egne annonser fra 11.09.2026");
    expect(html).toContain(">Kopier<");
    expect(html).toContain(">Ringt<");
    expect(html).toContain(">Ikke aktuell<");
  });

  it("renders a card without its line when none held, and offers the next mark after the one set", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ ring: ring([card({ opener: null, status: "called" })]) }))));
    expect(html).not.toContain("data-ring-opener");
    expect(html).not.toContain(">Kopier<");
    expect(html).toContain(">Møte avtalt<");
  });

  it("is left out in Basis, when absent, and for a card out of shape", () => {
    const basis = hiring({ subscription: { status: "active", counties: [], trades: [], free_until: null, tier: "basis", frequency: "weekly" }, ring: ring([card()]) });
    expect(renderToStaticMarkup(createElement(MinSideHiring, props(basis)))).not.toContain("data-ring-today");
    expect(hiring().ring).toBeNull();
    expect(hiring({ ring: ring([card({ orgnr: "../x" }), card({ status: "sold" })]) }).ring?.cards.map((c) => c.status)).toEqual(["new"]);
  });

  it("passes the marks and Daglig varsel on, and nothing else", () => {
    expect(hiringRequest({ action: "hiring_lead", orgnr: "912345678", status: "meeting", from: "ring" })).toEqual({ action: "hiring_lead", orgnr: "912345678", status: "meeting", from: "ring" });
    expect(hiringRequest({ action: "hiring_daily_alert", on: true })).toEqual({ action: "hiring_daily_alert", on: true });
    expect(hiringRequest({ action: "hiring_daily_alert" })).toBeNull();
  });
});

// ORDER 252: the stable marks the live check reads.
describe("the live-check marks", () => {
  it("are on the table, the cards, the rows, the tiles, the count, the locks, the Premium row and the Kontakt block", () => {
    const html = view(table());
    expect(html.match(/data-hiring-table="" data-tier="premium"/g)).toHaveLength(2);
    expect(html.match(/data-hiring-row="" data-orgnr="912345678"/g)).toHaveLength(2);
    const basisPage = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ subscription: { ...rawHiring().subscription, tier: "basis" } }))));
    for (const tile of ["newThisWeek", "urgent", "englishOk", "recommended"]) expect(basisPage).toContain(`data-hiring-tile="${tile}"`);
    for (const lock of ["tile_urgent", "tile_english", "tile_recommended", "filter_occupation", "filter_new", "download"]) expect(basisPage).toContain(`data-hiring-locked="${lock}"`);
    expect(basisPage).toContain("data-hiring-total");
    expect(basisPage).toContain("data-hiring-premium-row");
    expect(view(table({ tier: "basis", locks: [...TABLE_LOCKS] }))).toContain('data-hiring-locked="column_need"');
    expect(renderToStaticMarkup(createElement(ContactBlock, { name: "X", contact: null, onContacted: async () => {} }))).toContain("data-hiring-contact");
    expect(source("MinSideHiring.tsx")).toMatch(/data-contact-locked="" data-hiring-contact=""[\s\S]{0,400}lock="contact"/);
  });
});
