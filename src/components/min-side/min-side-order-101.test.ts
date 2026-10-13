import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideProjects from "@/components/min-side/MinSideProjects";
import { MinSideCityQuestion, MinSideContactCard } from "@/components/min-side/MinSideCityQuestion";
import { MinSideWhatsNew } from "@/components/min-side/MinSideWhatsNew";
import {
  alertsWords,
  profileFrom,
  projectCountLine,
  projectPrefill,
  telHref,
  visibleProjects,
  type Alerts,
  type MinSideProject,
} from "@/lib/min-side/profile";

/** ORDER 101 (13 October 2026): towns, the unknown-place toggle, the count, the trial text, the one-time question, What's new in the page. */

const callAts = vi.fn();
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...args: unknown[]) => callAts(...args) }));

const FAR = "2999-01-01T00:00:00Z";
const base: MinSideProject = {
  id: "p0",
  title: "Testprosjekt",
  stage: "tender",
  buyer_name: "Testkommune",
  regions: ["NO060"],
  city: null,
  domains: ["finishing"],
  description: null,
  estimated_value_nok: null,
  awarded_value_nok: null,
  published_on: "2026-10-01",
  deadline_at: FAR,
  documents_url: null,
  winners: [],
  place: null,
};
const projects: MinSideProject[] = [
  { ...base, id: "a", title: "Prosjekt Alfa", place: "Trondheim" },
  { ...base, id: "b", title: "Prosjekt Beta", place: "Malvik" },
  { ...base, id: "c", title: "Prosjekt Gamma", place: null },
  { ...base, id: "d", title: "Prosjekt Delta", place: "Trondheim", stage: "awarded", deadline_at: null },
];
const now = Date.parse("2026-10-13T12:00:00Z");
const ids = (list: MinSideProject[]) => list.map((p) => p.id);

describe("the list follows the towns and the unknown-place toggle", () => {
  it("no town chosen is the whole county; a chosen town keeps its projects and the ones without a place", () => {
    expect(ids(visibleProjects(projects, { cities: [], stages: [], showUnknown: true, now }))).toEqual(["a", "b", "c", "d"]);
    expect(ids(visibleProjects(projects, { cities: ["Trondheim"], stages: [], showUnknown: true, now }))).toEqual(["a", "c", "d"]);
    expect(ids(visibleProjects(projects, { cities: ["trondheim", "Malvik"], stages: [], showUnknown: true, now }))).toEqual(["a", "b", "c", "d"]);
  });

  it("the toggle hides the projects with no known place", () => {
    expect(ids(visibleProjects(projects, { cities: ["Trondheim"], stages: [], showUnknown: false, now }))).toEqual(["a", "d"]);
    expect(ids(visibleProjects(projects, { cities: [], stages: [], showUnknown: false, now }))).toEqual(["a", "b", "d"]);
  });

  it("the page shows the chosen town's projects, Sted ikke oppgitt for the unknown one, and the toggle", () => {
    const html = renderToStaticMarkup(createElement(MinSideProjects, { projects, cities: ["Trondheim"], cityOptions: [{ name: "Trondheim", count: 2 }, { name: "Malvik", count: 1 }] }));
    expect(html).toContain("Prosjekt Alfa");
    expect(html).toContain("Prosjekt Gamma");
    expect(html).not.toContain("Prosjekt Beta");
    expect(html).toContain("Sted ikke oppgitt");
    expect(html).toContain("Vis prosjekter uten oppgitt sted");
    expect(html).toContain("3 prosjekter i Trondheim");
    // The chosen town is a navy chip, the other a white one.
    expect(html).toMatch(/aria-pressed="true"[^>]*bg-\[#1B2B44\][^>]*>Trondheim ✓/);
    expect(html).toMatch(/aria-pressed="false"[^>]*border-\[#C9CFD8\][^>]*>Malvik/);
  });

  it("shows the top three towns and + flere for the rest, and when the towns may change again", () => {
    const cityOptions = ["Trondheim", "Stjørdal", "Malvik", "Orkland", "Melhus"].map((name, i) => ({ name, count: 10 - i }));
    const html = renderToStaticMarkup(createElement(MinSideProjects, { projects, cityOptions, nextCityChange: "2026-11-12" }));
    expect(html).toContain(">Malvik<");
    expect(html).not.toContain(">Orkland<");
    expect(html).toContain("+ flere");
    expect(html).toContain("Byene kan endres igjen fra 12. november 2026");
  });
});

describe("the count stays with a stage filter", () => {
  it("is computed from the filtered list and is never NaN", () => {
    const open = visibleProjects(projects, { cities: [], stages: ["tender"], showUnknown: true, now });
    expect(ids(open)).toEqual(["a", "b", "c"]);
    expect(projectCountLine(open.length, [])).toBe("3 prosjekter");
    const awarded = visibleProjects(projects, { cities: ["Trondheim"], stages: ["awarded"], showUnknown: true, now });
    expect(projectCountLine(awarded.length, ["Trondheim"])).toBe("1 prosjekt i Trondheim");
    expect(projectCountLine(Number.NaN, [])).toBe("0 prosjekter");
    expect(projectCountLine(0, ["Trondheim", "Malvik", "Melhus"])).toBe("0 prosjekter i Trondheim, Malvik og Melhus");
  });

  it("the count line is on the page even when no project is left", () => {
    const html = renderToStaticMarkup(createElement(MinSideProjects, { projects: [], cityOptions: [{ name: "Trondheim", count: 0 }], cities: ["Trondheim"] }));
    expect(html).toContain("0 prosjekter i Trondheim");
    expect(html).toContain("Ingen prosjekter passer filteret.");
  });
});

describe("the trial text", () => {
  const alerts = (extra: Partial<Alerts>): Alerts => ({ plan: null, free_until: "2026-12-31", projects_url: null, projects: [], ...extra });

  it("says the trial when trial_until is set, never the old thank-you words", () => {
    const w = alertsWords(alerts({ trial_until: "2026-12-31" }));
    expect(w.text).toContain("Gratis prøveperiode til og med 31. desember 2026");
    expect(`${w.title} ${w.text}`).not.toContain("takk for samarbeidet");
  });

  it("keeps the old words without a trial", () => {
    expect(alertsWords(alerts({})).text).toContain("takk for samarbeidet");
  });

  it("reads trial_until, towns, the question and the contact person from the ATS's answer", () => {
    const p = profileFrom({
      me: { email: "test@eksempel.invalid" },
      company: { name: "Test AS" },
      alerts: {
        plan: null,
        trial_until: "2026-12-31",
        cities: ["Trondheim", "<b>x</b>"],
        city_options: [{ name: "Trondheim", count: 93 }, { name: "javascript:alert(1)", count: 1 }],
        next_city_change: null,
        city_question: { cities: ["Trondheim"], county: "Trøndelag" },
        projects: [{ ...base, id: "x", place: "Trondheim" }],
      },
      contact_person: { name: "Test Kontakt", role: "Daglig leder", phone: "+47 000 00 000", avatar_url: "http://ikke-https.invalid/a.jpg" },
    })!;
    expect(p.alerts?.trial_until).toBe("2026-12-31");
    expect(p.alerts?.cities).toEqual(["Trondheim"]);
    expect(p.alerts?.city_options).toEqual([{ name: "Trondheim", count: 93 }]);
    expect(p.alerts?.city_question).toEqual({ cities: ["Trondheim"], county: "Trøndelag" });
    expect(p.alerts?.projects[0].place).toBe("Trondheim");
    expect(p.contact_person).toEqual({ name: "Test Kontakt", role: "Daglig leder", phone: "+47 000 00 000", avatar_url: null });
    expect(profileFrom({ me: {}, company: { name: "Test AS" } })!.contact_person).toBeNull();
  });
});

/** The buttons of a rendered tree, with their text, found without a DOM. */
function buttons(node: ReactNode): { text: string; onClick: () => void }[] {
  const found: { text: string; onClick: () => void }[] = [];
  const text = (n: ReactNode): string => (typeof n === "string" || typeof n === "number" ? String(n) : Array.isArray(n) ? n.map(text).join("") : isValidElement(n) ? text((n.props as { children?: ReactNode }).children) : "");
  const walk = (n: ReactNode) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!isValidElement(n)) return;
    const props = n.props as { children?: ReactNode; onClick?: () => void };
    if (n.type === "button" && props.onClick) found.push({ text: text(props.children), onClick: props.onClick });
    walk(props.children);
  };
  walk(node);
  return found;
}

describe("the one-time question", () => {
  const question = { cities: ["Trondheim"], county: "Trøndelag" };

  it("renders only with city_question", () => {
    expect(renderToStaticMarkup(createElement(MinSideCityQuestion, { question: null, busy: false, onAnswer: () => {} }))).toBe("");
    const html = renderToStaticMarkup(createElement(MinSideCityQuestion, { question, busy: false, onAnswer: () => {} }));
    expect(html).toContain("Vil dere bare få prosjekter i Trondheim?");
    expect(html).toContain("Dere ba om varsler for hele Trondheim. Vi kan begrense varslene til Trondheim, eller dere kan beholde hele Trøndelag.");
    expect(html).toContain("bg-[#FBF6E8]");
    expect(html).toContain("border-[#E9D9A6]");
  });

  it("answers yes with the navy button and no with the outlined one", () => {
    const onAnswer = vi.fn();
    const found = buttons(MinSideCityQuestion({ question, busy: false, onAnswer }));
    expect(found.map((b) => b.text)).toEqual(["Ja, bare Trondheim", "Nei, behold hele Trøndelag"]);
    found[0].onClick();
    found[1].onClick();
    expect(onAnswer.mock.calls).toEqual([["yes"], ["no"]]);
  });

  describe("the passthrough", () => {
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

    it("posts yes and no to the ATS, and nothing else", async () => {
      expect((await post({ action: "city_question", answer: "yes" })).status).toBe(200);
      expect((await post({ action: "city_question", answer: "no" })).status).toBe(200);
      expect(callAts.mock.calls.map((c) => c[1].body)).toEqual([
        { action: "city_question", answer: "yes" },
        { action: "city_question", answer: "no" },
      ]);
      expect((await post({ action: "city_question", answer: "maybe" })).status).toBe(400);
      expect(callAts).toHaveBeenCalledTimes(2);
    });

    it("passes the towns on as plain names, and the ATS's 409 back as it is", async () => {
      callAts.mockResolvedValueOnce({ status: 409, body: { error: "Byene kan endres igjen fra 12. november 2026." } });
      const res = await post({ action: "alert_cities", cities: ["Trondheim", "Malvik"] });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: "Byene kan endres igjen fra 12. november 2026." });
      expect(callAts.mock.calls[0][1].body).toEqual({ action: "alert_cities", cities: ["Trondheim", "Malvik"] });
      expect((await post({ action: "alert_cities", cities: ["<script>"] })).status).toBe(400);
      expect((await post({ action: "alert_cities", cities: "Trondheim" })).status).toBe(400);
    });
  });
});

describe("What's new is inline, never over the list", () => {
  it("renders as a small notice in the page, with no overlay", () => {
    const html = renderToStaticMarkup(
      createElement(MinSideWhatsNew, { entries: [{ id: "2026-10-13-test", title: "Ny funksjon", detail: "Kort forklaring.", variants: [], link: null }], onTick: async () => {} }),
    );
    expect(html).toContain("Nytt på Min side");
    expect(html).toContain("Lukk");
    expect(html).not.toMatch(/\bfixed\b|inset-0|aria-modal|role="dialog"/);
  });

  it("sits above the section in the content column, not over the page", () => {
    const client = readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8");
    const nav = client.indexOf('aria-label="Deler av Min side"');
    const notice = client.indexOf("<MinSideWhatsNew");
    const firstPanel = client.indexOf('section === "firma"');
    expect(nav).toBeGreaterThan(0);
    expect(notice).toBeGreaterThan(nav);
    expect(notice).toBeLessThan(firstPanel);
  });
});

describe("Be om folk and the contact card", () => {
  it("prefills trade, place and the project's title", () => {
    const p = { ...base, title: "Ny skole", place: "Trondheim", domains: ["finishing", "electrical"] };
    expect(projectPrefill(p, null)).toEqual({ trade: "Tømrer, gulv og maling, Elektro", place: "Trondheim", note: "Prosjekt: Ny skole" });
    const alerts: Alerts = { plan: null, free_until: null, projects_url: null, projects: [], choices: { domains: [], regions: ["NO060"] } };
    expect(projectPrefill({ ...p, place: null }, alerts).place).toBe("Trøndelag");
  });

  it("is left out without a contact person, and calls by tel: with one", () => {
    expect(renderToStaticMarkup(createElement(MinSideContactCard, { person: null }))).toBe("");
    const html = renderToStaticMarkup(createElement(MinSideContactCard, { person: { name: "Test Kontakt", role: "", phone: "+47 000 00 000", avatar_url: null } }));
    expect(html).toContain("Din kontakt hos oss");
    expect(html).toContain("Kontaktperson");
    expect(html).toContain("Vi svarer innen én arbeidsdag.");
    expect(html).toContain('href="tel:+4700000000"');
    expect(html).toContain("Ring meg");
    expect(telHref("abc")).toBeNull();
  });
});
