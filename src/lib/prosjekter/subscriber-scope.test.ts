import { describe, expect, it } from "vitest";
import { subscriberExplorer } from "./explorer";
import type { AlertProject } from "./format";
import { COUNTIES, countyView, project } from "./map";
import { subscriberMap } from "./subscriber-map";
import { inCounty, inScope, pointInScope, scopeLngLat, scopeName, scopeView, subscriptionCounties } from "./subscriber-scope";
import { unproject } from "./map";

const NOW = Date.parse("2026-11-25T12:00:00Z");

const base: AlertProject = {
  id: "p-1", project_no: 1, stage: "planned", title: "Test project", description: null, buyer_name: "Test Buyer AS",
  regions: ["NO0A2"], city: "Bergen", cpv_codes: ["45210000"], estimated_value_nok: 10_000_000, awarded_value_nok: null,
  published_on: "2026-10-01", deadline_at: null, start_on: null, end_on: null, winners: [], documents_url: null,
};
const vestland = { ...base, id: "p-vl", project_no: 1, regions: ["NO0A2"] };
const rogaland = { ...base, id: "p-ro", project_no: 2, regions: ["NO0A1"], city: "Stavanger" };
const oslo = { ...base, id: "p-os", project_no: 3, regions: ["NO081"], city: "Oslo" };
const both = { ...base, id: "p-both", project_no: 4, regions: ["NO081", "NO0A2"], city: null };
const all = [vestland, rogaland, oslo, both];

describe("the subscription's counties", () => {
  it("keeps known county codes, expands an old county into the new ones and drops the rest", () => {
    expect(subscriptionCounties(["NO0A2"])).toEqual(["NO0A2"]);
    expect(subscriptionCounties(["NO082"]).sort()).toEqual(["NO083", "NO084", "NO085"]);
    expect(subscriptionCounties(["XX999", "NO060"])).toEqual(["NO060"]);
    expect(subscriptionCounties([])).toEqual([]);
    expect(subscriptionCounties(null)).toEqual([]);
  });

  it("lets a project in when one of its counties is in scope, and everything in when there is no scope", () => {
    expect(inScope(["NO0A2"], ["NO0A2"])).toBe(true);
    expect(inScope(["NO081", "NO0A2"], ["NO0A2"])).toBe(true);
    expect(inScope(["NO0A1"], ["NO0A2"])).toBe(false);
    expect(inScope(["NO082"], ["NO084"])).toBe(true);
    expect(inScope([], ["NO0A2"])).toBe(false);
    expect(inScope(["NO0A1"], [])).toBe(true);
  });

  it("names the area: the county alone, several together, or the whole country", () => {
    expect(scopeName(["NO0A2"])).toBe("Vestland");
    expect(scopeName(["NO0A2", "NO0A1"])).toBe("Deres fylker");
    expect(scopeName([])).toBe("Hele Norge");
  });
});

describe("the frame the maps open on", () => {
  it("one county: the view a county click zooms to", () => {
    expect(scopeView(["NO0A2"])).toEqual(countyView("NO0A2"));
  });

  it("several counties: one view holding every one of them", () => {
    const v = scopeView(["NO0A2", "NO0A1"])!;
    for (const code of ["NO0A2", "NO0A1"]) {
      const [x0, y0, x1, y1] = COUNTIES[code].bb;
      expect(v[0]).toBeLessThanOrEqual(x0);
      expect(v[1]).toBeLessThanOrEqual(y0);
      expect(v[0] + v[2]).toBeGreaterThanOrEqual(x1);
      expect(v[1] + v[3]).toBeGreaterThanOrEqual(y1);
    }
    // Not the whole country: Finnmark's far corner is outside.
    const fm = COUNTIES.NO073.bb;
    expect(v[0] + v[2]).toBeLessThan(fm[2]);
  });

  it("no counties: no frame, so the whole country stays", () => {
    expect(scopeView([])).toBeNull();
    expect(scopeLngLat([])).toBeNull();
  });

  it("unproject is the inverse of project", () => {
    const [x, y] = project(5.32, 60.39);
    const [lon, lat] = unproject(x, y);
    expect(lon).toBeCloseTo(5.32, 6);
    expect(lat).toBeCloseTo(60.39, 6);
  });

  it("the 3D map's bounds hold Bergen for Vestland and both cities for Vestland and Rogaland, never Oslo", () => {
    const [[w, s], [e, n]] = scopeLngLat(["NO0A2"])!;
    expect(w).toBeLessThan(5.32);
    expect(e).toBeGreaterThan(5.32);
    expect(s).toBeLessThan(60.39);
    expect(n).toBeGreaterThan(60.39);
    expect(e).toBeLessThan(10.75);
    const [[w2, s2], [e2, n2]] = scopeLngLat(["NO0A2", "NO0A1"])!;
    expect(s2).toBeLessThan(58.97);
    expect(n2).toBeGreaterThan(60.39);
    expect(w2).toBeLessThan(5.32);
    expect(e2).toBeLessThan(10.75);
  });
});

describe("no point outside the counties", () => {
  const at = (lon: number, lat: number) => project(lon, lat);
  it("Bergen is in Vestland, Oslo is not, and a point off the coast inside the box belongs", () => {
    expect(inCounty(...at(5.32, 60.39), "NO0A2")).toBe(true);
    expect(pointInScope(...at(10.75, 59.91), ["NO0A2"])).toBe(false);
    expect(pointInScope(...at(10.75, 59.91), ["NO081"])).toBe(true);
    // West of Sotra, in the sea: in no county, inside Vestland's box.
    expect(pointInScope(...at(4.95, 60.3), ["NO0A2"])).toBe(true);
    expect(inCounty(...at(4.95, 60.3), "NO0A2")).toBe(false);
    expect(pointInScope(...at(10.75, 59.91), [])).toBe(true);
  });

  it("a Vestland project placed in Oslo is shown at Vestland's centre, marked approximate, on both maps", () => {
    const misplaced = { ...vestland, lat: 59.91, lon: 10.75 } as AlertProject;
    const m = subscriberMap([misplaced], null, NOW, ["NO0A2"]);
    expect(m.placed[0]).toMatchObject({ x: COUNTIES.NO0A2.cx, y: COUNTIES.NO0A2.cy });
    expect(m.approximate.has(1)).toBe(true);
    const [lon, lat] = subscriberExplorer([misplaced], null, ["NO0A2"])[0].coordinates!;
    expect(inCounty(...at(lon, lat), "NO0A2")).toBe(true);
    // Without a scope the point stays where it is.
    expect(subscriberExplorer([misplaced], null)[0].coordinates).toEqual([10.75, 59.91]);
  });
});

describe("only the subscription's projects reach the maps", () => {
  it("classic map, one county: Vestland's projects only, a two-county project placed in Vestland", () => {
    const m = subscriberMap(all, null, NOW, ["NO0A2"]);
    expect(m.placed.map((p) => p.no).sort()).toEqual([1, 4]);
    expect(m.placed.every((p) => p.r === "NO0A2")).toBe(true);
    expect(m.unplaced).toBe(0);
  });

  it("classic map, two counties: both counties' projects, nothing from Oslo", () => {
    const m = subscriberMap(all, null, NOW, ["NO0A2", "NO0A1"]);
    expect(m.placed.map((p) => p.no).sort()).toEqual([1, 2, 4]);
    expect(m.placed.some((p) => p.r === "NO081")).toBe(false);
  });

  it("classic map, no counties: every project, as before", () => {
    const m = subscriberMap(all, null, NOW);
    expect(m.placed.map((p) => p.no).sort()).toEqual([1, 2, 3, 4]);
  });

  it("3D explorer: the same rule, and a project's county is one in scope", () => {
    expect(subscriberExplorer(all, null, ["NO0A2"]).map((p) => [p.id, p.region])).toEqual([
      ["p-vl", "NO0A2"],
      ["p-both", "NO0A2"],
    ]);
    expect(subscriberExplorer(all, null, ["NO0A2", "NO0A1"]).map((p) => p.id)).toEqual(["p-vl", "p-ro", "p-both"]);
    expect(subscriberExplorer(all, null).map((p) => p.id)).toEqual(["p-vl", "p-ro", "p-os", "p-both"]);
  });
});
