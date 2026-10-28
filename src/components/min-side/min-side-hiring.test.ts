import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideHiring, { ProjectsTeaser, TermsForm, type ProjectsTrial } from "@/components/min-side/MinSideHiring";
import {
  hiringCsvHref,
  hiringCsvQuery,
  hiringFrom,
  hiringRequest,
  leadAction,
  leadCardText,
  profileFrom,
  sectionHint,
  showsProjectsTeaser,
  visibleHiringRows,
  visibleSections,
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
  it("Premium shows the need, the open filters and the download", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring())));
    expect(html).toContain("To tømrere fra november");
    expect(html).toContain('href="/api/min-side/00000000-0000-4000-8000-0000000000a1/hiring-csv"');
    expect(html).not.toContain("data-locked");
    expect(html).toContain("Åpne lead");
  });

  it("Basis locks Behov, the language and new-only filters and Last ned, and Åpne lead asks for Premium", () => {
    const basis = hiring({ subscription: { ...rawHiring().subscription, tier: "basis" }, rows: [row({ behov: null, english_ok: null })] });
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(basis)));
    expect(html).toContain("Prøveperioden er over");
    expect(html).toContain("Aksepterer engelsk · Premium");
    expect(html).toContain("Bare nye siden sist · Premium");
    expect(html).toContain("Last ned · Premium");
    expect(html).not.toContain("hiring-csv");
    expect(html).toContain("data-locked");
    // The status and the feedback stay usable.
    expect(html).toMatch(/<button type="button"[^>]*aria-label="Status Ny/);
    expect(html).toContain("Hvor nyttig er listen?");
    expect(leadAction("basis")).toBe("premium");
    expect(leadAction("premium")).toBe("card");
    expect(source("MinSideHiring.tsx")).toContain('title="Bedriftskortet er Premium"');
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
  });
});

describe("filters and the CSV link", () => {
  const rows = hiring().rows;

  it("filters by county, trade, language and new since the last visit", () => {
    const f = { county: "", trade: "", english: false, onlyNew: false };
    expect(visibleHiringRows(rows, { ...f, county: "NO050" }, null, "premium").map((r) => r.orgnr)).toEqual(["912345678"]);
    expect(visibleHiringRows(rows, { ...f, trade: "mason" }, null, "premium").map((r) => r.orgnr)).toEqual(["998877665"]);
    expect(visibleHiringRows(rows, { ...f, english: true }, null, "premium").map((r) => r.orgnr)).toEqual(["912345678"]);
    expect(visibleHiringRows(rows, { ...f, onlyNew: true }, "2026-10-10T00:00:00Z", "premium").map((r) => r.orgnr)).toEqual(["912345678"]);
    expect(visibleHiringRows(rows, { ...f, onlyNew: true }, null, "premium")).toHaveLength(2);
    // Locked in Basis: they never narrow the list.
    expect(visibleHiringRows(rows, { ...f, english: true, onlyNew: true }, "2026-10-10T00:00:00Z", "basis")).toHaveLength(2);
  });

  it("carries the filters in the CSV link, and the proxy accepts only their shapes", () => {
    const token = "00000000-0000-4000-8000-0000000000a1";
    expect(hiringCsvHref(token, { county: "NO0A2", trade: "carpenter", english: true, onlyNew: true })).toBe(`/api/min-side/${token}/hiring-csv?county=NO0A2&trade=carpenter&english=1&new=1`);
    expect(hiringCsvHref(token, { county: "", trade: "", english: false, onlyNew: false })).toBe(`/api/min-side/${token}/hiring-csv`);
    expect(hiringCsvQuery(new URLSearchParams("county=NO0A2&trade=carpenter&english=1&new=1"))).toBe("county=NO0A2&trade=carpenter&english=1&new=1");
    expect(hiringCsvQuery(new URLSearchParams(""))).toBe("");
    expect(hiringCsvQuery(new URLSearchParams("county=Oslo"))).toBeNull();
    expect(hiringCsvQuery(new URLSearchParams("english=yes"))).toBeNull();
    expect(hiringCsvQuery(new URLSearchParams("token=x"))).toBeNull();
  });
});

describe("the lead card copied as text", () => {
  it("lists the fields that are known", () => {
    const card = { ...hiring().rows[0], address: "Eksempelveien 1, 7030 Trondheim", website: "https://eksempel.invalid/", industry: "Oppføring av bygninger", employees: 12, recruits: "Rekrutterer selv" };
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
      { action: "hiring_lead", orgnr: "912345678", status: "won" },
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
});
