import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideHiring, { type ProjectsTrial } from "@/components/min-side/MinSideHiring";
import MinSideHiringSettings, { FirmsPanel, ReceivePanel, WhenPanel, type PremiumOffer, type Saver } from "@/components/min-side/MinSideHiringSettings";
import { hiringFrom, hiringLetterFrom, hiringPrefsFrom, hiringRequest, isHiringPrefsAction, type Hiring, type HiringPrefs } from "@/lib/min-side/profile";

/** ORDER 170: the client sets on Min side what the hiring alerts bring, when and to whom, and his own firms. */

const callAts = vi.fn();
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...args: unknown[]) => callAts(...args), callAtsRaw: vi.fn() }));

const source = (file: string) => readFileSync(path.resolve(__dirname, file), "utf8");

const ID1 = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";

const rawPrefs = (extra: Record<string, unknown> = {}) => ({
  set_by_client_at: "2026-10-29T10:00:00Z",
  receive: { counties: ["NO050"], trades: ["carpenter"], towns: ["Trondheim"], radius_km: null, base_known: true, min_employees: 5, max_employees: null, signal: "both", only_new: false },
  when: {
    frequency: "weekly",
    weekday: 1,
    hour: 7,
    language: "no",
    paused_until: null,
    recipients: [
      { id: ID1, email: "ekstra@eksempel.invalid", name: "Ekstra", primary: false },
      { id: null, email: "test@eksempel.invalid", name: null, primary: true },
    ],
  },
  firms: {
    watch: [{ orgnr: "912345678", name: "Eksempel Bygg AS", added_at: "2026-10-20T08:00:00Z" }],
    hidden: [{ orgnr: "998877665", name: "Annen Bygg AS", added_at: "2026-10-21T08:00:00Z" }],
    archive: [{ id: ID2, sent_at: "2026-10-27T07:00:00Z", firm_count: 12, kind: "weekly", subject: "12 bedrifter ansetter" }],
  },
  options: {
    counties: [{ code: "NO050", name: "Trøndelag" }, { code: "NO030", name: "Oslo" }],
    trades: [{ key: "carpenter", name: "Tømrer" }, { key: "mason", name: "Murer" }],
    towns: ["Trondheim", "Malvik", "Stjørdal"],
    radius_km: [10, 25, 50, 100, 200],
    hours: [6, 20],
    max_recipients: 5,
    pause_max_days: 90,
    county_limit: null,
  },
  matches: 7,
  ...extra,
});

const rawHiring = (prefs: unknown = rawPrefs()) => ({
  subscription: { status: "active", counties: ["Trøndelag"], trades: ["Tømrer"], free_until: "2026-12-31", tier: "premium", frequency: "weekly" },
  terms: { accepted: true, ready: true, title: "Vilkår", paragraphs: ["a"], version: "1", consent: "Ja" },
  rows: [
    { orgnr: "912345678", name: "Eksempel Bygg AS", county: "NO050", trades: ["carpenter"], trade_names: ["Tømrer"], positions: 1, status: "new", watched: true },
    { orgnr: "998877666", name: "Tredje Bygg AS", county: "NO050", trades: ["carpenter"], trade_names: ["Tømrer"], positions: 1, status: "new" },
  ],
  last_viewed_at: null,
  filters: { counties: [], trades: [] },
  projects: null,
  prefs,
});

const prefs = (extra: Record<string, unknown> = {}) => hiringPrefsFrom(rawPrefs(extra)) as HiringPrefs;
const saver = (extra: Partial<Saver> = {}): Saver => ({ busy: false, save: vi.fn(async () => ({ ok: true as const })), fieldError: () => null, ...extra });
const premium: PremiumOffer = { ask: () => {}, busy: false, sent: false, error: null };
const controls = (html: string) => (html.match(/data-control=""/g) ?? []).length;

describe("the settings as the ATS sends them", () => {
  it("parses prefs and the watched flag on each row", () => {
    const h = hiringFrom(rawHiring()) as Hiring;
    expect(h.rows.map((r) => r.watched)).toEqual([true, false]);
    const p = h.prefs!;
    expect(p.matches).toBe(7);
    expect(p.receive).toMatchObject({ counties: ["NO050"], trades: ["carpenter"], towns: ["Trondheim"], radius_km: null, min_employees: 5, max_employees: null, signal: "both" });
    // The primary address first, without an id.
    expect(p.when.recipients.map((r) => [r.email, r.primary, r.id])).toEqual([
      ["test@eksempel.invalid", true, null],
      ["ekstra@eksempel.invalid", false, ID1],
    ]);
    expect(p.firms.archive[0]).toEqual({ id: ID2, sent_at: "2026-10-27T07:00:00Z", firm_count: 12, kind: "weekly", subject: "12 bedrifter ansetter" });
    expect(p.options.hours).toEqual([6, 20]);
  });

  it("is null when absent, and bad values fall back instead of throwing", () => {
    expect(hiringFrom(rawHiring(null))!.prefs).toBeNull();
    expect(hiringFrom(rawHiring("x"))!.prefs).toBeNull();
    const p = hiringPrefsFrom({
      receive: { counties: ["Oslo", "NO030"], trades: ["<b>"], radius_km: -5, signal: "all", min_employees: 2.5 },
      when: { frequency: "hourly", weekday: 9, hour: 3, language: "de", paused_until: "snart", recipients: [{ email: "not-an-email" }, { id: "x", email: "a@b.invalid" }] },
      firms: { watch: [{ orgnr: "12", name: "x" }], archive: [{ id: "nope" }] },
      options: { hours: [20, 6], max_recipients: "5", county_limit: 1 },
      matches: "7",
    })!;
    expect(p.receive).toMatchObject({ counties: ["NO030"], trades: [], radius_km: null, signal: "both", min_employees: null });
    expect(p.when).toMatchObject({ frequency: "weekly", weekday: 1, hour: 6, language: "no", paused_until: null, recipients: [] });
    expect(p.firms).toEqual({ watch: [], hidden: [], archive: [] });
    expect(p.options).toMatchObject({ hours: [6, 20], max_recipients: 5, pause_max_days: 90, county_limit: 1 });
    expect(p.matches).toBe(0);
    expect(hiringPrefsFrom(null)).toBeNull();
  });

  it("reads a stored letter only in its shape", () => {
    expect(hiringLetterFrom({ id: ID2, sent_at: "2026-10-27T07:00:00Z", subject: "Uke 44", html: "<p>Hei</p>", firm_count: 3 })).toEqual({ id: ID2, sent_at: "2026-10-27T07:00:00Z", subject: "Uke 44", html: "<p>Hei</p>", firm_count: 3 });
    expect(hiringLetterFrom({ id: "x", html: "<p>" })).toBeNull();
    expect(hiringLetterFrom({ id: ID2 })).toBeNull();
  });
});

describe("the three tabs", () => {
  it("each has at most seven controls", () => {
    const receive = renderToStaticMarkup(createElement(ReceivePanel, { prefs: prefs(), saver: saver(), premium }));
    const when = renderToStaticMarkup(createElement(WhenPanel, { prefs: prefs(), saver: saver() }));
    const firms = renderToStaticMarkup(createElement(FirmsPanel, { prefs: prefs(), saver: saver(), sendData: vi.fn() }));
    expect(controls(receive)).toBe(6);
    expect(controls(when)).toBe(6);
    expect(controls(firms)).toBe(3);
    for (const html of [receive, when, firms]) expect(controls(html)).toBeLessThanOrEqual(7);
  });

  it("has no Save button: no Lagre in any tab", () => {
    for (const html of [
      renderToStaticMarkup(createElement(ReceivePanel, { prefs: prefs(), saver: saver(), premium })),
      renderToStaticMarkup(createElement(WhenPanel, { prefs: prefs(), saver: saver() })),
      renderToStaticMarkup(createElement(FirmsPanel, { prefs: prefs(), saver: saver(), sendData: vi.fn() })),
    ]) {
      expect(html).not.toMatch(/>\s*Lagre\s*</);
      expect(html).not.toMatch(/>\s*Save\s*</);
    }
    const src = source("MinSideHiringSettings.tsx");
    expect(src).not.toMatch(/>\s*Lagre\s*</);
    // The only submit is "Legg til", for a new recipient.
    expect(src.match(/type="submit"/g)).toHaveLength(1);
  });

  it("every control saves on change, with its own action", () => {
    const src = source("MinSideHiringSettings.tsx");
    expect(src).toContain('saver.save({ action: "hiring_prefs_receive", ...fields })');
    expect(src).toContain('saver.save({ action: "hiring_prefs_when", ...fields })');
    expect(src).toContain('onClick={() => save({ trades: toggled(r.trades, t.key) })}');
    expect(src).toContain('onClick={() => save({ counties: toggled(r.counties, c.code) })}');
    expect(src).toContain('onChange={(e) => save({ radius_km: e.target.value === "" ? null : Number(e.target.value) })}');
    expect(src).toContain("onChange={(e) => save({ only_new: e.target.checked })}");
    expect(src).toContain("onChange={(e) => save({ weekday: Number(e.target.value) })}");
    expect(src).toContain("onChange={(e) => save({ hour: Number(e.target.value) })}");
    expect(src).toContain('remove_recipient: p.id');
    expect(src).toContain('{ action: "hiring_prefs_firms", open_letter: id }');
    // A number field saves on blur or Enter.
    expect(src).toMatch(/e\.key === "Enter"/);
    expect(src).toContain("onBlur={onBlur}");
    // Controls are disabled while a save is in flight.
    expect(src.match(/<fieldset disabled=\{saver\.busy\}/g)).toHaveLength(3);
  });

  it("shows the 402 sentence with the Premium button, and the radius error beside its control", () => {
    const html = renderToStaticMarkup(
      createElement(ReceivePanel, { prefs: prefs(), saver: saver({ fieldError: (f) => (f === "premium" ? "Basis gjelder ett fylke." : f === "radius_km" ? "Vi kjenner ikke adressen deres." : null) }), premium }),
    );
    expect(html).toContain("Basis gjelder ett fylke.");
    expect(html).toMatch(/<button type="button"[^>]*>Premium<\/button>/);
    expect(html).toContain("Vi kjenner ikke adressen deres.");
  });

  it("says Basis: ett fylke when the county limit is one", () => {
    const html = renderToStaticMarkup(createElement(ReceivePanel, { prefs: prefs({ options: { ...rawPrefs().options, county_limit: 1 } }), saver: saver(), premium }));
    expect(html).toContain("Basis: ett fylke");
  });

  it("hides the towns when a distance is chosen, and the day unless weekly", () => {
    const withRadius = renderToStaticMarkup(createElement(ReceivePanel, { prefs: prefs({ receive: { ...rawPrefs().receive, radius_km: 25 } }), saver: saver(), premium }));
    expect(withRadius).not.toContain("Søk etter sted");
    expect(renderToStaticMarkup(createElement(ReceivePanel, { prefs: prefs(), saver: saver(), premium }))).toContain("Søk etter sted");
    const daily = renderToStaticMarkup(createElement(WhenPanel, { prefs: prefs({ when: { ...rawPrefs().when, frequency: "daily" } }), saver: saver() }));
    expect(daily).not.toContain("Mandag");
    expect(controls(daily)).toBe(5);
  });

  it("lists the recipients: the primary not removable, extras with Fjern, add stops at the limit", () => {
    const html = renderToStaticMarkup(createElement(WhenPanel, { prefs: prefs(), saver: saver() }));
    expect(html).toContain("Hovedadresse");
    expect(html.match(/>Fjern</g)).toHaveLength(1);
    expect(html).toContain("Legg til");
    const extras = Array.from({ length: 5 }, (_, i) => ({ id: `3333333${i}-3333-4333-8333-333333333333`, email: `e${i}@eksempel.invalid`, name: null, primary: false }));
    const full = renderToStaticMarkup(createElement(WhenPanel, { prefs: prefs({ when: { ...rawPrefs().when, recipients: [...extras, { id: null, email: "test@eksempel.invalid", name: null, primary: true }] } }), saver: saver() }));
    expect(full).not.toContain("Legg til");
  });

  it("Mine bedrifter: unfollow, undo a hidden firm, open a letter; empty states in one sentence", () => {
    const html = renderToStaticMarkup(createElement(FirmsPanel, { prefs: prefs(), saver: saver(), sendData: vi.fn() }));
    expect(html).toContain("Slutt å følge");
    expect(html).toContain("Angre");
    expect(html).toContain("Åpne");
    expect(html).toContain("12 bedrifter");
    const empty = renderToStaticMarkup(createElement(FirmsPanel, { prefs: prefs({ firms: { watch: [], hidden: [], archive: [] } }), saver: saver(), sendData: vi.fn() }));
    expect(empty).toContain("Du følger ingen bedrifter ennå.");
    expect(empty).toContain("Ingen skjulte bedrifter.");
    expect(empty).toContain("Ingen e-poster sendt ennå.");
    // The stored letter is shown in a sandboxed frame, never as markup in the page.
    const src = source("MinSideHiringSettings.tsx");
    expect(src).toContain('<iframe sandbox="" srcDoc={letter.html}');
    expect(src).not.toContain("dangerouslySetInnerHTML");
  });

  it("the card: one line with the matches above a tablist, collapsed behind Innstillinger", () => {
    const closed = renderToStaticMarkup(createElement(MinSideHiringSettings, { prefs: prefs(), send: vi.fn(), sendData: vi.fn() }));
    expect(closed).toMatch(/aria-live="polite"[^>]*>Treff nå: 7 bedrifter</);
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).not.toContain('role="tablist"');
    const open = renderToStaticMarkup(createElement(MinSideHiringSettings, { prefs: prefs(), send: vi.fn(), sendData: vi.fn(), initialOpen: true }));
    expect(open).toContain('role="tablist"');
    expect(open.match(/role="tab"/g)).toHaveLength(3);
    expect(open).toMatch(/role="tab"[^>]*aria-selected="true"[^>]*>Hva jeg får</);
    expect(open).toContain("Når og til hvem");
    expect(open).toContain("Mine bedrifter");
  });
});

describe("Følg and Ikke vis meg denne on the list", () => {
  const noTrial: ProjectsTrial = { start: () => {}, busy: false, error: null, dialog: null };
  it("shows Følger pressed for a followed firm, Følg for the others, and hide on each", () => {
    const h = hiringFrom(rawHiring()) as Hiring;
    const html = renderToStaticMarkup(createElement(MinSideHiring, { token: "00000000-0000-4000-8000-0000000000a1", hiring: h, since: null, send: vi.fn(), sendData: vi.fn(), trial: noTrial, onAskPeople: () => {} }));
    // Two rows, each in the desktop table and the phone list.
    expect(html.match(/aria-pressed="true"[^>]*>Følger</g)).toHaveLength(2);
    expect(html.match(/aria-pressed="false"[^>]*>Følg</g)).toHaveLength(2);
    expect(html.match(/>Ikke vis meg denne</g)).toHaveLength(4);
    expect(html).toContain("Treff nå: 7 bedrifter");
    const src = source("MinSideHiring.tsx");
    expect(src).toContain('send({ action: "hiring_prefs_firms", [key]: row.orgnr })');
    expect(src).toContain('act(row.watched ? "unwatch" : "watch")');
  });
});

describe("the passthrough of the settings actions", () => {
  const token = "00000000-0000-4000-8000-0000000000a1";
  const post = async (body: unknown) => {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/min-side/[token]/route");
    const req = new NextRequest(`https://www.arbeidmatch.no/api/min-side/${token}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.70" } });
    return POST(req, { params: Promise.resolve({ token }) });
  };
  beforeEach(() => {
    callAts.mockReset();
    callAts.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it("passes only the named fields", async () => {
    const cases: [Record<string, unknown>, Record<string, unknown>][] = [
      [
        { action: "hiring_prefs_receive", counties: ["NO050"], trades: ["carpenter"], towns: [" Trondheim "], radius_km: null, min_employees: 5, max_employees: null, signal: "won", only_new: true, extra: "x", token: "y" },
        { action: "hiring_prefs_receive", counties: ["NO050"], trades: ["carpenter"], towns: ["Trondheim"], radius_km: null, min_employees: 5, max_employees: null, signal: "won", only_new: true },
      ],
      [{ action: "hiring_prefs_receive", radius_km: 25 }, { action: "hiring_prefs_receive", radius_km: 25 }],
      [
        { action: "hiring_prefs_when", frequency: "weekly", weekday: 3, hour: 7, language: "en", paused_until: "", other: 1 },
        { action: "hiring_prefs_when", frequency: "weekly", weekday: 3, hour: 7, language: "en", paused_until: "" },
      ],
      [{ action: "hiring_prefs_when", paused_until: "2026-12-01" }, { action: "hiring_prefs_when", paused_until: "2026-12-01" }],
      [
        { action: "hiring_prefs_when", add_recipient: { email: "ny@eksempel.invalid", name: "Ny", role: "admin" } },
        { action: "hiring_prefs_when", add_recipient: { email: "ny@eksempel.invalid", name: "Ny" } },
      ],
      [{ action: "hiring_prefs_when", remove_recipient: ID1 }, { action: "hiring_prefs_when", remove_recipient: ID1 }],
      [{ action: "hiring_prefs_firms", watch: "912345678" }, { action: "hiring_prefs_firms", watch: "912345678" }],
      [{ action: "hiring_prefs_firms", unwatch: "912345678" }, { action: "hiring_prefs_firms", unwatch: "912345678" }],
      [{ action: "hiring_prefs_firms", hide: "912345678" }, { action: "hiring_prefs_firms", hide: "912345678" }],
      [{ action: "hiring_prefs_firms", unhide: "912345678" }, { action: "hiring_prefs_firms", unhide: "912345678" }],
      [{ action: "hiring_prefs_firms", open_letter: ID2 }, { action: "hiring_prefs_firms", open_letter: ID2 }],
    ];
    for (const [body] of cases) expect((await post(body)).status).toBe(200);
    expect(callAts.mock.calls.map((c) => c[1].body)).toEqual(cases.map(([, out]) => out));
  });

  it("refuses bad shapes before the ATS sees them", async () => {
    const bad: Record<string, unknown>[] = [
      { action: "hiring_prefs_receive" },
      { action: "hiring_prefs_receive", counties: ["Oslo"] },
      { action: "hiring_prefs_receive", counties: Array.from({ length: 21 }, () => "NO050") },
      { action: "hiring_prefs_receive", trades: ["Tømrer"] },
      { action: "hiring_prefs_receive", towns: ["<script>"] },
      { action: "hiring_prefs_receive", towns: ["x".repeat(61)] },
      { action: "hiring_prefs_receive", radius_km: 2.5 },
      { action: "hiring_prefs_receive", min_employees: -1 },
      { action: "hiring_prefs_receive", signal: "all" },
      { action: "hiring_prefs_receive", only_new: "yes" },
      { action: "hiring_prefs_when" },
      { action: "hiring_prefs_when", frequency: "hourly" },
      { action: "hiring_prefs_when", weekday: 8 },
      { action: "hiring_prefs_when", hour: 23 },
      { action: "hiring_prefs_when", language: "de" },
      { action: "hiring_prefs_when", paused_until: "i morgen" },
      { action: "hiring_prefs_when", add_recipient: { email: "ikke-en-adresse" } },
      { action: "hiring_prefs_when", add_recipient: { email: `${"a".repeat(250)}@b.no` } },
      { action: "hiring_prefs_when", add_recipient: { email: "ny@eksempel.invalid", name: "x".repeat(121) } },
      { action: "hiring_prefs_when", add_recipient: { email: "ny@eksempel.invalid" }, hour: 7 },
      { action: "hiring_prefs_when", remove_recipient: "1" },
      { action: "hiring_prefs_firms" },
      { action: "hiring_prefs_firms", watch: "12345" },
      { action: "hiring_prefs_firms", watch: "912345678", hide: "912345678" },
      { action: "hiring_prefs_firms", open_letter: "../x" },
    ];
    for (const body of bad) expect({ body, status: (await post(body)).status }).toEqual({ body, status: 400 });
    expect(callAts).not.toHaveBeenCalled();
  });

  it("gives the settings a rate-limit bucket of their own", () => {
    expect(isHiringPrefsAction("hiring_prefs_receive")).toBe(true);
    expect(isHiringPrefsAction("hiring_lead")).toBe(false);
    expect(hiringRequest({ action: "hiring_prefs_firms", unhide: "912345678" })).toEqual({ action: "hiring_prefs_firms", unhide: "912345678" });
    const route = readFileSync(path.resolve(__dirname, "../../app/api/min-side/[token]/route.ts"), "utf8");
    expect(route).toContain('getRateLimitResult(request, "min-side-prefs", 120, 10 * 60 * 1000)');
  });
});
