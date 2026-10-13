import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MinSideProjects from "@/components/min-side/MinSideProjects";
import { PLAN_CONFIRMATION, PROJECT_SOURCE_LINE, intentFromSearch, profileFrom, staffingPrefill, type MinSideProject } from "@/lib/min-side/profile";

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

  it("the page has the card, the button and the Norwegian confirmation", () => {
    const client = readFileSync(path.join(__dirname, "MinSideClient.tsx"), "utf8");
    expect(client).toContain("Trenger dere folk de neste månedene?");
    expect(client).toContain("Fortell oss fag, antall og når. Vi setter sammen et lag som er klart når prosjektet starter.");
    expect(client).toContain("Planlegg bemanning med oss");
    expect(client).toContain('send({ action: "staffing_request", ...request })');
    expect(PLAN_CONFIRMATION).toBe("Takk. Vi har fått forespørselen og tar kontakt innen én arbeidsdag.");
  });
});
