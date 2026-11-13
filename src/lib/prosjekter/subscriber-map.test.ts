import { describe, expect, it } from "vitest";
import { COUNTIES } from "./map";
import { dotNumber, mapStageOf, subscriberMap } from "./subscriber-map";
import type { Overview } from "./types";
import type { AlertProject } from "./format";

const NOW = Date.parse("2026-11-09T12:00:00Z");

const overview: Overview = {
  counts: { planned: 0, tender: 1, awarded: 0 }, total: 1, page: 1, page_size: 60, regions: [], domains: [],
  projects: [],
  map: [{ no: 42, st: "tender", t: "", c: null, k: null, r: "NO060", d: ["buildings"], band: 50_000_000, lat: 63.43123, lon: 10.39567 }],
};

const base: AlertProject = {
  id: "p-42", project_no: 42, stage: "tender", title: "Test school", description: "Test description", buyer_name: "Test Buyer AS",
  regions: ["NO060"], city: "Trondheim", cpv_codes: ["45210000"], estimated_value_nok: 123_456_789, awarded_value_nok: null,
  published_on: "2026-10-01", deadline_at: "2027-01-10", start_on: null, end_on: null, winners: [], documents_url: "https://example.invalid/tender",
};

describe("a client's projects on the classic map", () => {
  it("takes the coordinate from the open map by project number and keeps the client's own facts on the dot", () => {
    const m = subscriberMap([base], overview, NOW);
    expect(m.placed).toHaveLength(1);
    const dot = m.placed[0];
    expect(dot).toMatchObject({ no: 42, st: "tender", r: "NO060", d: ["buildings"], t: "Test school", c: "Trondheim", v: 123_456_789, lat: 63.43123, lon: 10.39567 });
    expect(m.details.get(42)).toBe(base);
    expect(m.approximate.size).toBe(0);
    expect(m.unplaced).toBe(0);
  });

  it("takes the project's own point from the token page before the open map, which is county level (13 November 2026)", () => {
    const countyLevel: Overview = { ...overview, map: [{ no: 42, st: "tender", t: "", c: null, k: null, r: "NO060", d: ["buildings"], band: 50_000_000, lat: 63.72, lon: 11.38 }] };
    const m = subscriberMap([{ ...base, lat: 63.43123, lon: 10.39567 }], countyLevel, NOW);
    expect(m.placed[0]).toMatchObject({ no: 42, lat: 63.43123, lon: 10.39567, r: "NO060" });
    expect(m.approximate.size).toBe(0);
  });

  it("puts a project the map does not know on its county's centre, marked approximate, and counts one with no county at all", () => {
    const noMap: AlertProject = { ...base, id: "p-7", project_no: 7, regions: ["NO081"] };
    const nowhere: AlertProject = { ...base, id: "p-x", project_no: null, regions: [] };
    const m = subscriberMap([noMap, nowhere], null, NOW);
    expect(m.placed).toHaveLength(1);
    expect(m.placed[0]).toMatchObject({ no: 7, x: COUNTIES.NO081.cx, y: COUNTIES.NO081.cy, r: "NO081" });
    expect(m.approximate.has(7)).toBe(true);
    expect(m.unplaced).toBe(1);
  });

  it("gives a project without a number a negative dot number, so two of them never collide", () => {
    const a: AlertProject = { ...base, id: "a", project_no: null };
    const b: AlertProject = { ...base, id: "b", project_no: null };
    const m = subscriberMap([a, b], overview, NOW);
    expect(m.placed.map((p) => p.no)).toEqual([-1, -2]);
    expect(dotNumber(a, 0)).toBe(-1);
    expect(dotNumber(base, 5)).toBe(42);
  });

  it("stages: a tender past its deadline waits for award, a cancelled project has no dot", () => {
    expect(mapStageOf({ stage: "tender", deadline_at: "2026-01-01" }, NOW)).toBe("closed");
    expect(mapStageOf({ stage: "tender", deadline_at: "2027-01-01" }, NOW)).toBe("tender");
    expect(mapStageOf({ stage: "awarded", deadline_at: null }, NOW)).toBe("awarded");
    expect(mapStageOf({ stage: "cancelled", deadline_at: null }, NOW)).toBeNull();
    expect(subscriberMap([{ ...base, stage: "cancelled" }], overview, NOW).placed).toHaveLength(0);
  });

  it("never carries the open map's own fields onto the client's dot", () => {
    const leaky: Overview = { ...overview, map: [{ ...(overview.map as object[])[0], secret: "x" }] };
    const dot = subscriberMap([base], leaky, NOW).placed[0] as unknown as Record<string, unknown>;
    expect(dot.secret).toBeUndefined();
  });
});
