import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import MinSideProjects from "@/components/min-side/MinSideProjects";
import { planConfirmation, planWords, PROJECT_SOURCE_LINE, SOURCING_TEXT_NO, intentFromSearch, profileFrom, staffingPrefill, type MinSideProject } from "@/lib/min-side/profile";
import MinSideAlerts from "@/components/min-side/MinSideAlerts";

// ORDER 302: the numbers RecOS answers, without reaching it.
vi.mock("@/components/NumbersProvider", async () => (await import("@/test/numbers")).mockedNumbersProvider);

/** ORDER 100 (13 October 2026): the source under the projects in small print, and "Planlegg bemanning med oss". */

const project: MinSideProject = {
  id: "p1",
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
  deadline_at: "2999-01-01T00:00:00Z",
  documents_url: null,
  winners: [],
  place: null,
};

describe("the source on Min side", () => {
  it("the project list ends with the small disclaimer, Doffin in its middle, 11px, light grey, not a link", () => {
    expect(PROJECT_SOURCE_LINE).toContain("hentet fra Doffin");
    expect(PROJECT_SOURCE_LINE).not.toContain("Kilde:");
    const html = renderToStaticMarkup(createElement(MinSideProjects, { projects: [project] }));
    const at = html.indexOf("hentet fra Doffin");
    expect(at).toBeGreaterThan(0);
    const line = html.slice(html.lastIndexOf("<p", at), at);
    expect(line).toContain("text-[11px]");
    expect(line).toContain("text-[#9AA3AF]");
    expect(line).toContain("font-normal");
    expect(line).not.toContain("<a");
    expect(html.match(/Doffin/g)).toHaveLength(1);
  });
});

describe("Planlegg bemanning med oss", () => {
  it("reads ?plan=1 and ?alerts=1, and nothing else", () => {
    expect(intentFromSearch("?plan=1")).toBe("plan");
    expect(intentFromSearch("?alerts=1")).toBe("alerts");
    expect(intentFromSearch("?plan=1&alerts=1")).toBe("plan");
    expect(intentFromSearch("?plan=yes")).toBeNull();
    expect(intentFromSearch("")).toBeNull();
  });

  it("presets trade and place from the subscription's choices, in Norwegian", () => {
    const p = profileFrom({
      me: { email: "test@eksempel.invalid", contact_id: null },
      company: { name: "Test AS" },
      alerts: { plan: null, free_until: null, projects_url: null, choices: { domains: ["finishing", "nonsense"], regions: ["NO060", "<script>"] } },
    })!;
    expect(p.alerts?.choices).toEqual({ domains: ["finishing", "nonsense"], regions: ["NO060"] });
    expect(staffingPrefill(p.alerts)).toEqual({ trade: "Tømrer, gulv og maling", place: "Trøndelag" });
    expect(staffingPrefill(null)).toEqual({ trade: "", place: "" });
  });

  it("the page has the header button, the form and the Norwegian confirmation (ORDER 273: no separate card under Prosjektvarsler)", () => {
    const client = readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8");
    expect(client).not.toContain("Trenger dere folk de neste månedene?");
    expect(client).not.toContain("Be om folk");
    // ORDER 476: the words and the request come from the firm's service, never written into the page twice.
    expect(client).toContain('planWords(profile?.service ?? "staffing")');
    expect(client).toContain("send({ action: ask.action, ...request })");
    expect(planWords("staffing")).toEqual({ button: "Planlegg bemanning", title: "Planlegg bemanning med oss", intro: null, action: "staffing_request" });
    expect(planConfirmation(1)).toBe("Takk. Vi har fått forespørselen og tar kontakt innen én arbeidsdag.");
    // ORDER 302: the time is RecOS's; without it the sentence ends at "tar kontakt".
    expect(planConfirmation(null)).toBe("Takk. Vi har fått forespørselen og tar kontakt.");
  });
});

describe("a recruitment or staffing firm is offered sourcing (ORDER 476)", () => {
  const minimal = { me: { email: "test@eksempel.invalid", contact_id: null }, company: { name: "Test Bemanning AS" } };

  it("reads the firm's service from the ATS, staffing when an older ATS says nothing", () => {
    expect(profileFrom({ ...minimal, forsprang_service: "sourcing" })!.service).toBe("sourcing");
    expect(profileFrom({ ...minimal, forsprang_service: "staffing" })!.service).toBe("staffing");
    expect(profileFrom({ ...minimal, forsprang_service: "<script>" })!.service).toBe("staffing");
    expect(profileFrom(minimal)!.service).toBe("staffing");
  });

  it("Be om kandidater with the sourcing text and a sourcing request, never Planlegg bemanning", () => {
    const w = planWords("sourcing");
    expect(w).toEqual({ button: "Be om kandidater", title: "Be om kandidater", intro: SOURCING_TEXT_NO, action: "sourcing_request" });
    expect(SOURCING_TEXT_NO).toBe("Trenger dere flere folk til prosjektet, finner og presenterer vi kandidater for dere. Dere intervjuer og ansetter dem selv.");
    expect(JSON.stringify(w)).not.toMatch(/bemanning/i);
  });

  it("the route passes the sourcing request on to the ATS", () => {
    const route = readFileSync(path.join(__dirname, "../../app/api/min-side/[token]/route.ts"), "utf8");
    expect(route).toContain('action !== "sourcing_request"');
    expect(route).toContain('action === "staffing_request" || action === "sourcing_request"');
  });

  it("the project detail's ask and the hiring card take the firm's label", () => {
    expect(readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8")).toContain("planLabel={ask.button}");
    expect(readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8")).toContain("askLabel={ask.button}");
    expect(typeof MinSideAlerts).toBe("function");
  });
});
