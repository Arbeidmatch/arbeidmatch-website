import { describe, expect, it } from "vitest";
import { clusterTargetZoom, MAP_DEMO } from "./map-preview";

describe("map bubble previews", () => {
  it("zooms in for co-located projects whose expansion exceeds map limits", () => {
    expect(clusterTargetZoom(4, 17, 15)).toBe(15);
    expect(clusterTargetZoom(12, 17, 15)).toBe(15);
  });
  it("always moves closer until the maximum zoom, including stale expansion levels", () => {
    expect(clusterTargetZoom(5, 4, 15)).toBe(7);
    expect(clusterTargetZoom(15, 17, 15)).toBe(15);
  });
  it("uses a fixed fictional example without project identifiers or contacts", () => {
    expect(MAP_DEMO).toEqual({
      title: "Eksempel: nytt næringsbygg", stage: "Planlagt",
      value: "85 MNOK", buyer: "Eksempelbyggherre (fiktiv)",
    });
  });
});
