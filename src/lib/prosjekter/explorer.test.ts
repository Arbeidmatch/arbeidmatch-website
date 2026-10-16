import { describe, expect, it } from "vitest";
import { nearbyProjects, publicExplorer, publicOverview, publicValue, safeDocumentLink, subscriberExplorer } from "./explorer";
import type { Overview } from "./types";
import type { AlertProject } from "./format";

const publicData: Overview = {
  counts: { planned: 0, tender: 1, awarded: 0 }, total: 1, page: 1, page_size: 60, regions: [], domains: [],
  projects: [{ project_no: 42, stage: "tender", stage_label: "Åpen konkurranse", title: "Private project name", place: "Exact place", value_label: "123456789", date_label: "Exact deadline", domains: ["buildings"] }],
  map: [{ no: 42, st: "tender", t: "Private project name", c: "Exact place", k: "Exact deadline", r: "NO060", d: ["buildings"], v: 123456789, lat: 63.43123, lon: 10.39567, secret: "never forwarded" }],
};
const privateProject: AlertProject = {
  id: "fixture-42", project_no: 42, stage: "tender", title: "Test school", description: "Test description", buyer_name: "Test Buyer AS",
  regions: ["NO060"], city: "Trondheim", cpv_codes: ["45210000"], estimated_value_nok: 123456789, awarded_value_nok: null,
  published_on: "2026-10-01", deadline_at: "2027-01-10", start_on: null, end_on: null, winners: [], documents_url: "https://example.invalid/tender",
};

describe("project explorer access boundary", () => {
  it("strips protected strings and exact values from every public payload, not just the UI", () => {
    const output = publicOverview(publicData);
    const json = JSON.stringify(output);
    for (const secret of ["Private project name", "Exact place", "123456789", "Exact deadline", "never forwarded", "63.43123"]) expect(json).not.toContain(secret);
    expect(publicOverview(output)).toEqual(output);
    expect(publicData.projects[0].title).toBe("Private project name");
    expect(publicExplorer(output)[0]).toMatchObject({ title: "Bygg", value: "100-500 MNOK", buyer: null, documents: null });
  });
  it.each([[9e6,5e6],[10e6,5e7],[1e8,2e8],[5e8,7e8],[1e9,1e9],[null,null]] as const)("retains the value band for %s", (value, expected) => {
    expect(publicValue(value)).toBe(expected);
  });
  it("keeps authorized details and never invents a location", () => {
    const [p] = subscriberExplorer([privateProject], null);
    expect(p.title).toBe("Test school");
    expect(p.buyer).toBe("Test Buyer AS");
    expect(p.value.replace(/\s/g, "")).toBe("123456789kr");
    expect(p.coordinates).toBeNull();
    expect(subscriberExplorer([privateProject], publicOverview(publicData))[0].coordinates).toEqual([10.4,63.4]);
  });
  it("blocks executable and non-HTTPS document links", () => {
    expect(safeDocumentLink("javascript:alert(1)")).toBeNull();
    expect(safeDocumentLink("data:text/html,anything")).toBeNull();
    expect(safeDocumentLink("https://example.invalid/tender")).toBe("https://example.invalid/tender");
  });
  it("still shows the project list if coordinates are unavailable", () => {
    const data = publicOverview({ ...publicData, map: undefined });
    expect(publicExplorer(data)).toHaveLength(1);
    expect(publicExplorer(data)[0].coordinates).toBeNull();
  });
  it("suggests only other projects in the same known region", () => {
    const [p] = subscriberExplorer([privateProject], null);
    const next = { ...p, id: "next" };
    expect(nearbyProjects(p, [p, next, { ...p, id: "elsewhere", region: "NO081" }])).toEqual([next]);
  });
});
