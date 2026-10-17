import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectExplorer from "./ProjectExplorer";
import { publicExplorer } from "@/lib/prosjekter/explorer";

const navigation = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(navigation.query) }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

const projects = publicExplorer({
  counts: { planned: 2, tender: 1, awarded: 0 }, total: 999, page: 1, page_size: 20, regions: [], domains: [], projects: [],
  catalog: [
    { no: 1, st: "planned", rs: ["NO060"], d: ["buildings"], v: null },
    { no: 2, st: "tender", rs: ["NO081"], d: ["electrical"], v: null },
    { no: 3, st: "planned", rs: ["NO060", "NO081"], d: ["electrical"], v: null },
  ],
  map: [{ no: 1, st: "planned", r: "NO060", d: ["buildings"], t: "Placeholder", lat: 63.43, lon: 10.39, v: null }],
});
const render = () => renderToStaticMarkup(<ProjectExplorer projects={projects} syncFiltersToUrl />);
describe("public explorer URL filters and counts", () => {
  beforeEach(() => { navigation.query = "view=new"; });
  it("renders a filtered direct link, including projects without coordinates", () => {
    navigation.query += "&stage=planned&region=NO060";
    const html = render();
    expect(html).toContain('2 prosjekter');
    expect(html).toContain('av 3 totalt · 1 i utvalget på kartet');
    expect(html).toContain('<option selected="">Planlagt</option>');
    expect(html).toContain('value="NO060" selected=""');
  });
  it("combines canonical domain keys with region, stage and search", () => {
    navigation.query += "&stage=planned&region=NO081&domain=electrical&q=Elektro";
    const html = render();
    expect(html).toContain('1 prosjekter');
    expect(html).toContain('av 3 totalt · 0 i utvalget på kartet');
    expect(html).toContain('Kartposisjon ikke tilgjengelig');
  });
  it("shows zero mapped results for an empty selection", () => {
    navigation.query += "&stage=tender&region=NO060";
    expect(render()).toContain('0 i utvalget på kartet');
    expect(render()).toContain('Ingen prosjekter i utvalget');
  });
  it("ignores unsupported URL filters", () => {
    navigation.query += "&stage=__proto__&region=unknown&domain=unknown";
    expect(render()).toContain('3 prosjekter');
  });
  it("does not apply public URL filters to the subscriber explorer", () => {
    navigation.query += "&q=does-not-exist&region=NO081";
    const html = renderToStaticMarkup(<ProjectExplorer projects={projects} subscriber />);
    expect(html).toContain('3 prosjekter');
    expect(html).not.toContain('i utvalget på kartet');
  });
});
