import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PortalMap from "./PortalMap";
import ProjectExplorer from "./ProjectExplorer";
import { subscriberExplorer } from "@/lib/prosjekter/explorer";
import type { AlertProject } from "@/lib/prosjekter/format";
import { COUNTY_CODES, FULL_VIEW, clampView } from "@/lib/prosjekter/map";
import { scopeView } from "@/lib/prosjekter/subscriber-scope";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("") }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

const counts = Object.fromEntries(COUNTY_CODES.map((c) => [c, [1, 2, 3] as [number, number, number]]));
const noop = () => {};

function render(scope?: string[]) {
  return renderToStaticMarkup(
    <PortalMap visible={[]} counts={counts} county={null} onPickCounty={noop} hover={null} onHover={noop} onSelect={noop} subscriber scope={scope} />,
  );
}

/** The counties a visitor can click: the paths with a county code. */
const clickable = (html: string) => [...html.matchAll(/data-code="([^"]+)"/g)].map((m) => m[1]);
const viewBox = (html: string) => html.match(/viewBox="([^"]+)"/)?.[1];

describe("ORDER 504: the classic map on a client's page", () => {
  it("one county: framed on Vestland, the only county to click, and its counts alone", () => {
    const html = render(["NO0A2"]);
    expect(clickable(html)).toEqual(["NO0A2"]);
    expect(viewBox(html)).toBe(clampView(scopeView(["NO0A2"])!).join(" "));
    expect(html).toContain("Vestland: 6 prosjekter");
    // The panel's total is Vestland's, not the country's 15 x 6.
    expect(html).toMatch(/<span class="[^"]*">6<\/span> prosjekter/);
    expect(html).not.toContain("Sør-Norge");
    expect(html).not.toContain("Hele landet");
    expect(html).not.toContain("Oslo:");
  });

  it("two counties: both framed together, both clickable, nothing else", () => {
    const html = render(["NO0A2", "NO0A1"]);
    expect(clickable(html).sort()).toEqual(["NO0A1", "NO0A2"]);
    expect(viewBox(html)).toBe(clampView(scopeView(["NO0A2", "NO0A1"])!).join(" "));
    expect(html).toContain("Deres fylker");
    expect(html).toMatch(/<span class="[^"]*">12<\/span> prosjekter/);
  });

  it("no counties: the whole country, as before", () => {
    const html = render([]);
    expect(clickable(html)).toHaveLength(COUNTY_CODES.length);
    expect(viewBox(html)).toBe(FULL_VIEW.join(" "));
    expect(html).toContain("Hele Norge");
    expect(html).toContain("Sør-Norge");
  });
});

const p = (id: string, no: number, regions: string[]): AlertProject => ({
  id, project_no: no, stage: "planned", title: `Test ${id}`, description: null, buyer_name: null, regions, city: null,
  cpv_codes: [], estimated_value_nok: null, awarded_value_nok: null, published_on: null, deadline_at: null, start_on: null,
  end_on: null, winners: [], documents_url: null,
});
const own = [p("vl", 1, ["NO0A2"]), p("ro", 2, ["NO0A1"]), p("os", 3, ["NO081"])];

describe("ORDER 504: the 3D explorer on a client's page", () => {
  const html = (scope: string[]) =>
    renderToStaticMarkup(<ProjectExplorer projects={subscriberExplorer(own, null, scope)} subscriber scope={scope} />);

  it("one county: its projects only and the area picker offers that county alone", () => {
    const out = html(["NO0A2"]);
    expect(out).toContain("1 prosjekter");
    expect(out).toContain('<option value="" selected="">Vestland</option></select>');
    expect(out).not.toContain('value="NO081"');
    expect(out).not.toContain("Hele Norge");
  });

  it("two counties: both in the picker, nothing outside them", () => {
    const out = html(["NO0A2", "NO0A1"]);
    expect(out).toContain("2 prosjekter");
    expect(out).toContain('value="NO0A2"');
    expect(out).toContain('value="NO0A1"');
    expect(out).not.toContain('value="NO081"');
  });

  it("no counties: every project and the whole country", () => {
    const out = html([]);
    expect(out).toContain("3 prosjekter");
    expect(out).toContain("Hele Norge");
  });
});
