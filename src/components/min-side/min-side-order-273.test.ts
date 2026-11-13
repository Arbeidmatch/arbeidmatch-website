import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideAlerts from "@/components/min-side/MinSideAlerts";
import MinSideAlertSettings from "@/components/min-side/MinSideAlertSettings";
import { alertSettingsFrom, alertSettingsRequest, fagChangeable, letterWords, summaryLine } from "@/lib/min-side/alert-settings";
import { decideKeyDialog, keyPromptAsked, withKeyPrompt, withoutKeyPrompt } from "@/lib/min-side/key-prompt";
import { companyReportFrom, projectDetailFrom, timelineOf } from "@/lib/min-side/project-detail";
import { INITIAL_LIST } from "@/lib/min-side/project-list";
import { profileFrom, sectionFromHash, type Alerts, type MinSideProject } from "@/lib/min-side/profile";

const callAts = vi.fn();
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...args: unknown[]) => callAts(...args) }));

const TOKEN = "00000000-0000-4000-8000-0000000000a1";
const A = "00000000-0000-4000-8000-0000000000aa";
const B = "00000000-0000-4000-8000-0000000000bb";

function project(id: string, title: string, part: Partial<MinSideProject> = {}): MinSideProject {
  return {
    id,
    title,
    stage: "awarded",
    buyer_name: "Trondheim kommune",
    regions: ["NO060"],
    city: "Trondheim",
    domains: ["finishing"],
    description: null,
    estimated_value_nok: 2_000_000,
    awarded_value_nok: null,
    published_on: "2026-10-02",
    deadline_at: null,
    documents_url: null,
    winners: ["Malerfirma Hansen AS"],
    place: "Trondheim",
    ...part,
  };
}

const rawSettings = {
  fag: "painting",
  several: false,
  fag_label: "Maling",
  next_fag_change: "2026-12-10T00:00:00Z",
  stages: [],
  include_general: false,
  regions: ["NO060"],
  cities: ["Trondheim"],
  next_city_change: null,
  include_unplaced: true,
  frequency: "weekly",
  send_weekday: 1,
  send_hour: 7,
  recipients: ["post@firma.invalid"],
  allowed: {
    fag: [
      { value: "painting", label: "Maling", group: "finishing", locked: false },
      { value: "carpentry", label: "Tømrer", group: "finishing", locked: false },
      { value: "electrical", label: "Elektro", group: "other", locked: true },
    ],
    stages: [
      { value: "planned", label: "Planlagt", locked: false },
      { value: "tender", label: "Åpen konkurranse", locked: false },
      { value: "awarded", label: "Tildelt", locked: false },
    ],
    regions: [{ value: "NO060", label: "Trøndelag", locked: false }],
    city_options: [{ name: "Trondheim", count: 3 }],
    frequencies: [
      { value: "daily", label: "Daglig", locked: true },
      { value: "weekly", label: "Ukentlig", locked: false },
    ],
    weekdays: [1, 2, 3, 4, 5],
    hours: [6, 7, 8],
    max_recipients: 3,
  },
  summary: { matching: 3, next_letter_at: "2026-11-16T06:00:00Z" },
};

function alerts(projects: MinSideProject[]): Alerts {
  return { plan: null, free_until: null, projects_url: "/prosjekter/00000000-0000-4000-8000-0000000000c1", projects, last_sent_at: "2026-11-09T06:00:00Z", settings: alertSettingsFrom(rawSettings) };
}

const alertsProps = (route: Parameters<typeof MinSideAlerts>[0]["route"], lastOpened: string | null = null) => ({
  token: TOKEN,
  alerts: alerts([project(A, "Prosjekt Alfa"), project(B, "Prosjekt Beta", { published_on: "2026-10-05", first_seen_at: "2026-11-10T08:00:00Z" })]),
  route,
  go: () => undefined,
  list: INITIAL_LIST,
  setList: () => undefined,
  lastOpened,
  scrollBack: null,
  onScrolledBack: () => undefined,
  onPlan: () => undefined,
  saveSettings: async () => ({ ok: true as const }),
  stopAlerts: async () => ({ ok: true as const }),
  onStopped: () => undefined,
});

describe("Prosjektvarsler on Min side (ORDER 273)", () => {
  it("is the table of six columns with the search, the Innstillinger and Kart pills", () => {
    const html = renderToStaticMarkup(createElement(MinSideAlerts, alertsProps({ view: "list" })));
    for (const col of ["Prosjekt", "Fase", "Verdi", "Dato", "Entreprenør"]) expect(html).toContain(col);
    expect(html).toContain("data-projects-table");
    expect(html).toContain('placeholder="Søk i prosjekt, byggherre eller entreprenør"');
    expect(html).toContain(">Innstillinger<");
    expect(html).toContain(">Kart<");
    expect(html).toContain("1 nye siden siste brev");
    // Newest first: Beta (5 Oct) before Alfa (2 Oct).
    expect(html.indexOf("Prosjekt Beta")).toBeLessThan(html.indexOf("Prosjekt Alfa"));
    expect(html).not.toContain("Be om folk");
  });

  it("holds one detail at a time: open A, then B, and only B is on screen", () => {
    const a = renderToStaticMarkup(createElement(MinSideAlerts, alertsProps({ view: "project", id: A })));
    expect(a).toContain("data-project-detail");
    expect(a).toContain("Prosjekt Alfa");
    const b = renderToStaticMarkup(createElement(MinSideAlerts, alertsProps({ view: "project", id: B })));
    expect(b).toContain("Prosjekt Beta");
    expect(b).not.toContain("Prosjekt Alfa");
    expect(b).not.toContain("data-projects-table");
    expect(b).toContain("Alle prosjekter");
    expect(b).toContain("Planlegg bemanning");
    expect(b).not.toContain("Be om folk");
  });

  it("marks the last opened row when the list comes back", () => {
    const html = renderToStaticMarkup(createElement(MinSideAlerts, alertsProps({ view: "list" }, B)));
    expect(html).toMatch(new RegExp(`data-row-id="${B}" data-marked=""`));
    expect(html).not.toMatch(new RegExp(`data-row-id="${A}" data-marked=""`));
  });

  it("opens the settings from the address, with the summary and the grouped lists", () => {
    const html = renderToStaticMarkup(createElement(MinSideAlerts, alertsProps({ view: "settings", level: null })));
    expect(html).toContain("data-alert-settings");
    expect(html).toContain("3 prosjekter passer nå · Neste brev mandag kl. 07");
    for (const word of ["Hva", "Hvor", "Når og hvem", "Fag", "Faser", "Store prosjekter", "Vis også disse", "Fylker", "Byer", "Uten oppgitt sted", "Brev", "Mottakere", "Stopp varslene"]) expect(html).toContain(word);
  });

  it("keeps #varsler/<id> in the alerts section", () => {
    expect(sectionFromHash(`#varsler/${A}`)).toBe("varsler");
    expect(sectionFromHash("#varsler/innstillinger/fag")).toBe("varsler");
    expect(sectionFromHash("#innlogging")).toBe("innlogging");
  });
});

describe("the settings (ORDER 273)", () => {
  const s = alertSettingsFrom(rawSettings)!;
  const render = (level: Parameters<typeof MinSideAlertSettings>[0]["level"], settings = s) =>
    renderToStaticMarkup(createElement(MinSideAlertSettings, { settings, level, onLevel: () => undefined, save: async () => ({ ok: true as const }), stop: async () => ({ ok: true as const }), onStopped: () => undefined }));

  it("reads the ATS's answer and refuses anything else", () => {
    expect(s.fag).toBe("painting");
    expect(s.allowed.fag.map((f) => f.group)).toEqual(["finishing", "finishing", "other"]);
    expect(alertSettingsFrom(null)).toBeNull();
    expect(alertSettingsFrom({ fag: "x" })).toBeNull();
    expect(letterWords(s)).toBe("Ukentlig, mandag kl. 07");
    expect(summaryLine({ matching: 1, next_letter_at: null })).toBe("1 prosjekt passer nå");
  });

  it("is one fag, the finishing four first, read-only until the next change, locked ones with Spør oss", () => {
    const html = render("fag");
    expect(html).toContain("Tømrer, gulv og maling");
    expect(html).toContain("Andre fag");
    expect(html.indexOf("Maling")).toBeLessThan(html.indexOf("Elektro"));
    expect(html).toContain("Ett fag i abonnementet. Det kan byttes én gang i måneden, neste gang fra 10. desember 2026.");
    expect(html).toContain("Spør oss");
    expect(fagChangeable(s, Date.parse("2026-11-12T00:00:00Z"))).toBe(false);
    expect(fagChangeable(s, Date.parse("2026-12-11T00:00:00Z"))).toBe(true);
    expect(fagChangeable({ ...s, several: true, next_fag_change: null }, Date.now())).toBe(false);
  });

  it("builds one-field bodies and refuses what is not a setting", () => {
    expect(alertSettingsRequest({ fag: "painting" })).toEqual({ action: "alert_settings", fag: "painting" });
    expect(alertSettingsRequest({ stages: ["tender", "lost"] })).toEqual({ action: "alert_settings", stages: ["tender"] });
    expect(alertSettingsRequest({ send_hour: 7, frequency: "weekly" })).toEqual({ action: "alert_settings", send_hour: 7, frequency: "weekly" });
    expect(alertSettingsRequest({ recipients: ["a@firma.invalid", "<b>"] })).toBeNull();
    expect(alertSettingsRequest({ fag: "../x", token: "x" })).toBeNull();
    expect(alertSettingsRequest({})).toBeNull();
  });
});

describe("the key dialog: one window per visit (ORDER 273)", () => {
  const base = { asked: true, hasPasskey: false, supported: true, dismissedUntil: null, now: Date.parse("2026-11-12T12:00:00Z"), shownThisVisit: null };

  it("opens only after an e-mail login, with no key, a browser that can make one, and no Senere in force", () => {
    expect(decideKeyDialog(base)).toBe(true);
    expect(decideKeyDialog({ ...base, asked: false })).toBe(false);
    expect(decideKeyDialog({ ...base, hasPasskey: true })).toBe(false);
    expect(decideKeyDialog({ ...base, hasPasskey: null })).toBe(false);
    expect(decideKeyDialog({ ...base, supported: false })).toBe(false);
    expect(decideKeyDialog({ ...base, dismissedUntil: "2026-12-01T00:00:00Z" })).toBe(false);
    expect(decideKeyDialog({ ...base, dismissedUntil: "2026-11-01T00:00:00Z" })).toBe(true);
  });

  it("never opens after another window had the visit, and goes before the install prompt", () => {
    expect(decideKeyDialog({ ...base, shownThisVisit: "install_app" })).toBe(false);
    const client = readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8");
    expect(client).toContain('window.sessionStorage.setItem(VISIT_POPUP_KEY, "key_dialog")');
    expect(client).toContain("{profile && !keyDialog && !keyShown ? <MinSideAppPrompt");
  });

  it("is asked for by the login link only, and the question leaves the address", () => {
    expect(withKeyPrompt(`/min-side/${TOKEN}`, true)).toBe(`/min-side/${TOKEN}?nokkel=1`);
    expect(withKeyPrompt(`/min-side/${TOKEN}?plan=1`, true)).toBe(`/min-side/${TOKEN}?plan=1&nokkel=1`);
    expect(withKeyPrompt(`/min-side/${TOKEN}#varsler/${A}`, true)).toBe(`/min-side/${TOKEN}?nokkel=1#varsler/${A}`);
    expect(withKeyPrompt(`/min-side/${TOKEN}`, false)).toBe(`/min-side/${TOKEN}`);
    expect(withKeyPrompt(`/prosjekter/${TOKEN}`, true)).toBe(`/prosjekter/${TOKEN}`);
    expect(keyPromptAsked("?nokkel=1")).toBe(true);
    expect(withoutKeyPrompt("?plan=1&nokkel=1")).toBe("?plan=1");
    expect(withoutKeyPrompt("?nokkel=1")).toBe("");
  });

  it("reads the key state strictly from the profile", () => {
    const base = { me: { email: "a@b.invalid" }, company: { name: "Test AS" } };
    expect(profileFrom({ ...base, security: { has_passkey: false, prompt_dismissed_until: null } })?.security).toEqual({ has_passkey: false, prompt_dismissed_until: null });
    expect(profileFrom({ ...base, security: { has_passkey: "no" } })?.security).toBeNull();
    expect(profileFrom(base)?.security).toBeNull();
  });
});

describe("the project detail and the register report, read defensively", () => {
  it("keeps the facts and the firms, and drops a project without an id", () => {
    const p = projectDetailFrom({
      project: {
        id: A,
        title: "Ny skole",
        stage: "awarded",
        stage_label: "Tildelt",
        winners: [{ name: "Bygg AS", orgnr: "912345678", town: "Trondheim", industry: "Oppføring av bygninger" }, { name: "" }],
        buyer: { name: "Trondheim kommune", orgnr: "942110464" },
        published_on: "2026-09-01",
        deadline_at: "2026-10-01T10:00:00Z",
        start_on: "2027-01-10",
        tender_open: false,
      },
    });
    expect(p?.winners).toEqual([{ name: "Bygg AS", orgnr: "912345678", town: "Trondheim", industry: "Oppføring av bygninger" }]);
    expect(p?.buyer?.orgnr).toBe("942110464");
    expect(timelineOf(p!).map((t) => t.label)).toEqual(["Kunngjort", "Tilbudsfrist", "Byggestart"]);
    expect(projectDetailFrom({ project: { id: "x", title: "y" } })).toBeNull();
  });

  it("renders the report's groups as they come, and nothing that is not one", () => {
    const r = companyReportFrom({ report: { updated_at: "2026-11-01", groups: [{ title: "Registrert", rows: [{ label: "Stiftet", value: "2019" }, { label: 1 }] }] } });
    expect(r?.groups[0].rows).toEqual([{ label: "Stiftet", value: "2019" }]);
    expect(companyReportFrom({})).toBeNull();
  });
});

describe("the proxies (ORDER 273)", () => {
  beforeEach(() => callAts.mockReset());
  const ctx = (token: string, id: string) => ({ params: Promise.resolve({ token, id }) });

  it("the Min side detail refuses a bad key or id before the ATS is asked, and passes the answer on privately", async () => {
    const { NextRequest } = await import("next/server");
    const { GET, POST } = await import("@/app/api/min-side/[token]/project/[id]/route");
    const req = (t: string, id: string, method = "GET") => new NextRequest(`https://www.arbeidmatch.no/api/min-side/${t}/project/${id}`, { method });
    expect((await GET(req("bad", A), ctx("bad", A))).status).toBe(404);
    expect((await GET(req(TOKEN, "..%2F"), ctx(TOKEN, "../x"))).status).toBe(404);
    expect((await POST(req("bad", A, "POST"), ctx("bad", A))).status).toBe(404);
    expect(callAts).not.toHaveBeenCalled();
    callAts.mockResolvedValue({ status: 200, body: { project: { id: A, title: "Ny skole" } } });
    const res = await GET(req(TOKEN, A), ctx(TOKEN, A));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("private");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(callAts.mock.calls[0][0]).toBe(`/api/public/client-profile/${TOKEN}/project/${A}`);
    callAts.mockResolvedValue({ status: 404, body: { error: "x" } });
    expect((await GET(req(TOKEN, B), ctx(TOKEN, B))).status).toBe(404);
  });

  it("the map page detail does the same with the subscription's key", async () => {
    const { NextRequest } = await import("next/server");
    const { GET, POST } = await import("@/app/api/prosjekter/alerts/[token]/project/[id]/route");
    const req = (t: string, id: string, method = "GET") => new NextRequest(`https://www.arbeidmatch.no/api/prosjekter/alerts/${t}/project/${id}`, { method });
    expect((await GET(req("not-a-token", A), ctx("not-a-token", A))).status).toBe(404);
    expect((await POST(req(TOKEN, "1"), ctx(TOKEN, "1"))).status).toBe(404);
    expect(callAts).not.toHaveBeenCalled();
    callAts.mockResolvedValue({ status: 200, body: { url: "https://tender.invalid/x" } });
    const res = await POST(req(TOKEN, A, "POST"), ctx(TOKEN, A));
    expect(res.status).toBe(200);
    expect(callAts.mock.calls[0][0]).toBe(`/api/public/project-alerts/${TOKEN}/project/${A}`);
    expect(callAts.mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it("the profile route passes alert_settings checked, and the three bare actions as the word alone", async () => {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/min-side/[token]/route");
    const post = (body: unknown, t = TOKEN) =>
      POST(new NextRequest(`https://www.arbeidmatch.no/api/min-side/${t}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.73" } }), { params: Promise.resolve({ token: t }) });
    callAts.mockResolvedValue({ status: 200, body: { ok: true } });
    expect((await post({ action: "alert_settings", fag: "painting", secret: "x" })).status).toBe(200);
    expect(callAts.mock.calls[0][1].body).toEqual({ action: "alert_settings", fag: "painting" });
    expect((await post({ action: "alert_settings", recipients: ["<x>"] })).status).toBe(400);
    for (const action of ["alert_stop", "passkey_prompt_dismiss", "company_report"]) {
      callAts.mockClear();
      expect((await post({ action, extra: 1 })).status).toBe(200);
      expect(callAts.mock.calls[0][1].body).toEqual({ action });
    }
    expect((await post({ action: "alert_stop" }, "bad")).status).toBe(404);
  });

  it("the login link carries the key question to Min side only when the ATS asks for it", async () => {
    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/prosjekter/inn/[token]/route");
    const login = "a".repeat(43);
    const go = async () => GET(new NextRequest(`https://www.arbeidmatch.no/api/prosjekter/inn/${login}`), { params: Promise.resolve({ token: login }) });
    callAts.mockResolvedValue({ status: 200, body: { profile: TOKEN, passkey_prompt: true } });
    const asked = await go();
    expect(asked.headers.get("location") ?? "").toMatch(/\/min-side\/[0-9a-f-]{36}\?nokkel=1$/);
    callAts.mockResolvedValue({ status: 200, body: { profile: TOKEN, passkey_prompt: false } });
    expect((await go()).headers.get("location") ?? "").not.toContain("nokkel");
  });

  it("the login request shows the ATS's company e-mail sentence under the field", async () => {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/prosjekter/login/route");
    const sentence = "Bruk e-postadressen i firmaet deres, ikke en privat adresse.";
    callAts.mockResolvedValue({ status: 400, body: { error: sentence, field: "email" } });
    const res = await POST(new NextRequest("https://www.arbeidmatch.no/api/prosjekter/login", { method: "POST", body: JSON.stringify({ email: "ola@gmail.com" }), headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.74" } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: sentence, field: "email" });
  });
});
