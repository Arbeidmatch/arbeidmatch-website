import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideAnnonser from "./MinSideAnnonser";
import { annonserFrom, annonserHint, expiringWordsNo, safeLink, type Annonser } from "@/lib/min-side/annonser";
import { annonserFor, forgetAnnonser, jobbosConfig, orgOf, switchedOn } from "@/lib/min-side/annonser-server";
import { profileFrom, sectionHint, visibleSections } from "@/lib/min-side/profile";

/**
 * ORDER 276: Min side's section Annonser reads a firm's adverts from JobbOS
 * (GET /api/v1/min-side?org=, version 1). Invented firms and adverts only.
 */

const ORIGIN = "https://jobbos.example.invalid";
const KEY = "k".repeat(40);
const ORG = "999999999";
const env = (extra: Record<string, string> = {}) => ({ JOBBOS_MINSIDE_URL: `${ORIGIN}/`, JOBBOS_MINSIDE_KEY: KEY, JOBBOS_MINSIDE_ORGS: ORG, ...extra });

const advert = (extra: Record<string, unknown> = {}) => ({
  id: "a1b2c3d4-0000-4000-8000-000000000001",
  title: "Tømrer, fast stilling, Ålesund",
  status: "live",
  statusNo: "Live",
  group: "live",
  whenNo: "Utløper om 18 dager.",
  views: 1284,
  applyClicks: 131,
  publicUrl: `${ORIGIN}/annonse/tomrer-alesund`,
  ...extra,
});

/** JobbOS's own answer for a firm with adverts. */
const feed = (extra: Record<string, unknown> = {}) => ({
  ok: true,
  version: 1,
  firm: { name: "Eksempelbygg AS" },
  summary: { liveCount: 1, monthClicks: 186, lineNo: "1 live, 186 klikk på Søk denne måneden." },
  expiring: null,
  adverts: [advert(), advert({ id: "a1b2c3d4-0000-4000-8000-000000000002", title: "Elektriker", status: "in_review", statusNo: "Til kontroll", group: "pending", publicUrl: null, views: 0, applyClicks: 0 })],
  manageUrl: `${ORIGIN}/annonser`,
  newAdvertUrl: `${ORIGIN}/annonser/ny`,
  ...extra,
});

const okResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("reading JobbOS's answer", () => {
  it("keeps the summary, the adverts and the links on JobbOS's own origin", () => {
    const a = annonserFrom(feed(), ORIGIN);
    expect(a?.state).toBe("ok");
    if (a?.state !== "ok") return;
    expect(a.liveCount).toBe(1);
    expect(a.lineNo).toBe("1 live, 186 klikk på Søk denne måneden.");
    expect(a.adverts.map((x) => x.group)).toEqual(["live", "pending"]);
    expect(a.adverts[0].publicUrl).toBe(`${ORIGIN}/annonse/tomrer-alesund`);
    expect(a.manageUrl).toBe(`${ORIGIN}/annonser`);
  });

  it("drops a link to any other place, and refuses the answer when its own links are elsewhere", () => {
    const a = annonserFrom(feed({ adverts: [advert({ publicUrl: "https://evil.example.invalid/x" })] }), ORIGIN);
    expect(a?.state === "ok" && a.adverts[0].publicUrl).toBeNull();
    expect(annonserFrom(feed({ manageUrl: "https://evil.example.invalid/annonser" }), ORIGIN)).toBeNull();
    expect(annonserFrom(feed({ newAdvertUrl: "javascript:alert(1)" }), ORIGIN)).toBeNull();
    expect(safeLink("http://jobbos.example.invalid/x")).toBeNull();
    expect(safeLink("https://u:p@jobbos.example.invalid/x")).toBeNull();
  });

  it("never gives a public page to an advert that is not live", () => {
    const a = annonserFrom(feed({ adverts: [advert({ group: "pending", publicUrl: `${ORIGIN}/annonse/x` })] }), ORIGIN);
    expect(a?.state === "ok" && a.adverts[0].publicUrl).toBeNull();
  });

  it("is null for no firm, another version or a malformed answer", () => {
    expect(annonserFrom({ ok: true, version: 1, firm: null }, ORIGIN)).toBeNull();
    expect(annonserFrom(feed({ version: 2 }), ORIGIN)).toBeNull();
    expect(annonserFrom(feed({ adverts: "x" }), ORIGIN)).toBeNull();
    expect(annonserFrom("x")).toBeNull();
  });

  it("skips adverts of another shape and keeps counts whole", () => {
    const a = annonserFrom(feed({ adverts: [advert({ id: "<script>" }), advert({ group: "draft" }), advert({ title: "" }), advert({ views: -3, applyClicks: 1.5 })] }), ORIGIN);
    expect(a?.state === "ok" && a.adverts.length).toBe(1);
    expect(a?.state === "ok" && [a.adverts[0].views, a.adverts[0].applyClicks]).toEqual([0, 0]);
  });

  it("keeps the expiring card only for a live advert in the list, within seven days", () => {
    const id = advert().id;
    const kept = annonserFrom(feed({ expiring: { advertId: id, title: "Tømrer", days: 6 } }), ORIGIN);
    expect(kept?.state === "ok" && kept.expiring).toEqual({ advertId: id, title: "Tømrer, fast stilling, Ålesund", days: 6 });
    const other = annonserFrom(feed({ expiring: { advertId: "zzz", title: "X", days: 2 } }), ORIGIN);
    expect(other?.state === "ok" && other.expiring).toBeNull();
    expect(expiringWordsNo(1)).toBe("Utløper om 1 dag");
    expect(expiringWordsNo(6)).toBe("Utløper om 6 dager");
  });

  it("reads the page's own copy back the same", () => {
    const first = annonserFrom(feed(), ORIGIN);
    expect(annonserFrom(JSON.parse(JSON.stringify(first)))).toEqual(first);
    expect(annonserFrom({ state: "unavailable" })).toEqual({ state: "unavailable" });
  });
});

describe("the owner switch and the call to JobbOS", () => {
  beforeEach(() => forgetAnnonser());

  it("is off without URL, a long enough key or an organisation list", () => {
    expect(jobbosConfig({})).toBeNull();
    expect(jobbosConfig(env({ JOBBOS_MINSIDE_KEY: "short" }))).toBeNull();
    expect(jobbosConfig(env({ JOBBOS_MINSIDE_URL: "http://jobbos.example.invalid" }))).toBeNull();
    expect(jobbosConfig(env({ JOBBOS_MINSIDE_ORGS: "" }))).toBeNull();
    expect(jobbosConfig(env({ JOBBOS_MINSIDE_ORGS: "abc, 12" }))).toBeNull();
  });

  it("opens only for the listed firms, or for all with *", () => {
    const listed = jobbosConfig(env({ JOBBOS_MINSIDE_ORGS: " 999 999 999 , 888888888" }))!;
    expect(listed.origin).toBe(ORIGIN);
    expect(switchedOn(listed, ORG)).toBe(true);
    expect(switchedOn(listed, "777777777")).toBe(false);
    expect(switchedOn(jobbosConfig(env({ JOBBOS_MINSIDE_ORGS: "*" }))!, "777777777")).toBe(true);
  });

  it("takes the organisation number from the ATS's answer only", () => {
    expect(orgOf({ company: { org_number: "999 999 999" } })).toBe(ORG);
    expect(orgOf({ company: { org_number: "12345" } })).toBeNull();
    expect(orgOf({})).toBeNull();
  });

  it("asks nothing while the switch is off for the firm", async () => {
    const fetchImpl = vi.fn();
    expect(await annonserFor("777777777", { env: env(), fetchImpl })).toBeNull();
    expect(await annonserFor(null, { env: env(), fetchImpl })).toBeNull();
    expect(await annonserFor(ORG, { env: {}, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("asks JobbOS by number with the key and gives the section", async () => {
    const fetchImpl = vi.fn(async () => okResponse(feed()));
    const a = await annonserFor(ORG, { env: env(), fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(a?.state).toBe("ok");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${ORIGIN}/api/v1/min-side?org=${ORG}`);
    expect((init.headers as Record<string, string>)["x-jobbos-key"]).toBe(KEY);
    expect(init.redirect).toBe("error");
  });

  it("checks the links against the public board when the API has another address", async () => {
    const api = "https://jobbos-api.example.invalid";
    const fetchImpl = vi.fn(async () => okResponse(feed()));
    const a = await annonserFor(ORG, { env: env({ JOBBOS_MINSIDE_URL: api, JOBBOS_PUBLIC_URL: ORIGIN }), fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(a?.state).toBe("ok");
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0].startsWith(api)).toBe(true);
    forgetAnnonser();
    const wrong = await annonserFor(ORG, { env: env({ JOBBOS_MINSIDE_URL: api }), fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(wrong).toEqual({ state: "unavailable" });
  });

  it("keeps an answer a minute per firm, a failure 15 seconds", async () => {
    const fetchImpl = vi.fn(async () => okResponse(feed()));
    const f = fetchImpl as unknown as typeof fetch;
    await annonserFor(ORG, { env: env(), fetchImpl: f, now: 1_000 });
    await annonserFor(ORG, { env: env(), fetchImpl: f, now: 50_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await annonserFor(ORG, { env: env(), fetchImpl: f, now: 62_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    forgetAnnonser();
    const down = vi.fn(async () => okResponse({}, 503));
    const d = down as unknown as typeof fetch;
    await annonserFor(ORG, { env: env(), fetchImpl: d, now: 0 });
    await annonserFor(ORG, { env: env(), fetchImpl: d, now: 10_000 });
    await annonserFor(ORG, { env: env(), fetchImpl: d, now: 16_000 });
    expect(down).toHaveBeenCalledTimes(2);
  });

  it("is null for JobbOS's 'no such firm' and unavailable when JobbOS fails", async () => {
    const none = vi.fn(async () => okResponse({ ok: true, version: 1, firm: null }));
    expect(await annonserFor(ORG, { env: env(), fetchImpl: none as unknown as typeof fetch })).toBeNull();
    forgetAnnonser();
    const down = vi.fn(async () => okResponse({ ok: false, error: "not_configured" }, 503));
    expect(await annonserFor(ORG, { env: env(), fetchImpl: down as unknown as typeof fetch })).toEqual({ state: "unavailable" });
    forgetAnnonser();
    const thrown = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await annonserFor(ORG, { env: env(), fetchImpl: thrown as unknown as typeof fetch })).toEqual({ state: "unavailable" });
    forgetAnnonser();
    const odd = vi.fn(async () => okResponse({ ok: true, version: 9 }));
    expect(await annonserFor(ORG, { env: env(), fetchImpl: odd as unknown as typeof fetch })).toEqual({ state: "unavailable" });
  });
});

describe("the section on the page", () => {
  const page = { me: { email: "test@eksempel.invalid" }, company: { name: "Test AS" } };
  const ok = annonserFrom(feed(), ORIGIN) as Annonser;

  it("is in the list only with adverts on JobbOS, first, with its hint", () => {
    expect(visibleSections(profileFrom(page)!).some((s) => s.key === "annonser")).toBe(false);
    const p = profileFrom({ ...page, annonser: ok })!;
    expect(visibleSections(p)[0].key).toBe("annonser");
    expect(sectionHint("annonser", p)).toBe("1 live");
    expect(annonserHint({ state: "unavailable" })).toBe("Ikke tilgjengelig nå");
  });

  it("shows the line, the tabs with counts, the counts and Se annonsen, and never a form", () => {
    const html = renderToStaticMarkup(createElement(MinSideAnnonser, { annonser: ok }));
    expect(html).toContain("1 live, 186 klikk på Søk denne måneden.");
    expect(html).toContain("Live (1)");
    expect(html).toContain("Kontroll (1)");
    expect(html).toContain("Utløpt (0)");
    expect(html).toContain("1 284 visninger");
    expect(html).toContain("131 klikk på Søk");
    expect(html).toContain(`href="${ORIGIN}/annonse/tomrer-alesund"`);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
  });

  it("says so when JobbOS could not be asked", () => {
    const html = renderToStaticMarkup(createElement(MinSideAnnonser, { annonser: { state: "unavailable" } }));
    expect(html).toContain("Annonsene kunne ikke hentes akkurat nå.");
  });
});
