import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checkAccessRequest, checkLoginEmail, isLoginToken, isSentProjectPath } from "@/lib/prosjekter/access";
import {
  clampView,
  clusterProjects,
  COUNTIES,
  countyCounts,
  filterProjects,
  FULL_VIEW,
  mapToScreen,
  MAX_ZOOM,
  mnok,
  panBy,
  placeProjects,
  project,
  screenToMap,
  staysOneGroup,
  viewAround,
  sortProjects,
  STAGES,
  wheelFactor,
  zoomAt,
  zoomOf,
  type PlacedProject,
  type View,
} from "@/lib/prosjekter/map";
import { deviceFrom, hintFor, isMacPlatform, wheelZooms } from "@/lib/prosjekter/mapHint";
import { isPortalPath, portalHeader } from "@/lib/prosjekter/portalNav";

/**
 * The project portal, version 2: the map's arithmetic (projection, clusters,
 * pan and zoom inside the country), the gesture helper's choice, the access
 * and login forms' checks, and the header the portal pages get.
 */

const inBox = ([x, y]: [number, number], bb: number[]) => x >= bb[0] && x <= bb[2] && y >= bb[1] && y <= bb[3];

function placed(no: number, x: number, y: number, v: number | null = null, st: PlacedProject["st"] = "tender"): PlacedProject {
  return { no, st, lat: 60, lon: 10, v, r: "NO081", d: ["buildings"], t: `P${no}`, c: null, k: null, x, y };
}

describe("the projection matches the county drawing", () => {
  it("puts towns inside their own county", () => {
    expect(inBox(project(10.746, 59.913), COUNTIES.NO081.bb)).toBe(true); // Oslo
    expect(inBox(project(5.324, 60.393), COUNTIES.NO0A2.bb)).toBe(true); // Bergen
    expect(inBox(project(10.395, 63.43), COUNTIES.NO060.bb)).toBe(true); // Trondheim
    expect(inBox(project(18.955, 69.649), COUNTIES.NO072.bb)).toBe(true); // Tromsø
  });

  it("keeps only well formed map rows and places them", () => {
    const rows = placeProjects([
      { no: 1, st: "tender", lat: 63.43, lon: 10.39, v: 5e6, r: "NO060", d: ["buildings"], t: " Ny skole ", c: "Trondheim", k: "Frist i oktober 2026" },
      { no: 2, st: "cancelled", lat: 63, lon: 10, t: "x" },
      { no: 3, st: "planned", lat: 10, lon: 10, t: "outside Norway" },
      { no: "4", st: "planned", lat: 60, lon: 10, t: "bad number" },
      null,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].t).toBe("Ny skole");
    expect(rows[0].x).toBeGreaterThan(0);
    expect(placeProjects("nope")).toEqual([]);
  });
});

describe("clusters", () => {
  const pts = [placed(1, 100, 100, 9e6), placed(2, 105, 102, 1e6), placed(3, 300, 300, 2e6)];

  it("groups dots closer than the threshold, anchored on the biggest", () => {
    const c = clusterProjects(pts, 20);
    expect(c).toHaveLength(2);
    const big = c.find((x) => x.members.length === 2)!;
    expect(big.members.map((p) => p.no)).toEqual([1, 2]);
    expect([big.x, big.y]).toEqual([100, 100]);
  });

  it("splits as the map zooms in (a smaller threshold)", () => {
    expect(clusterProjects(pts, 3)).toHaveLength(3);
  });

  it("does not depend on the order the rows arrive in", () => {
    const a = clusterProjects(pts, 20).map((c) => c.members.map((p) => p.no).sort());
    const b = clusterProjects([...pts].reverse(), 20).map((c) => c.members.map((p) => p.no).sort());
    expect(b.sort()).toEqual(a.sort());
  });
});

describe("the last tap on a group opens its list (29 September 2026)", () => {
  it("knows when zooming in would no longer split a group", () => {
    const samePlace = [placed(1, 200, 200, 1e6), placed(2, 200.2, 200.1, 2e6)];
    expect(staysOneGroup(samePlace, viewAround(200, 200, 200.2, 200.1, 70), 390, 500)).toBe(true);
    const apart = [placed(1, 100, 100, 1e6), placed(2, 160, 100, 2e6)];
    expect(staysOneGroup(apart, viewAround(100, 100, 160, 100, 70), 390, 500)).toBe(false);
  });
});

describe("pan and zoom stay inside Norway", () => {
  const [bx, by, bw, bh] = FULL_VIEW;

  it("never shows more than the whole country", () => {
    const v = clampView([bx - 500, by - 500, bw * 3, bh * 3]);
    expect(zoomOf(v)).toBeCloseTo(1, 5);
    expect(v[0]).toBeCloseTo(bx, 5);
    expect(v[1]).toBeCloseTo(by, 5);
  });

  it("never zooms deeper than the limit", () => {
    const v = clampView([400, 500, 1, 1]);
    expect(zoomOf(v)).toBeLessThanOrEqual(MAX_ZOOM + 1e-9);
  });

  it("never pans the country out of the frame", () => {
    const small: View = [bx + 10, by + 10, bw / 4, bh / 4];
    const far = panBy(small, 10_000, 10_000);
    expect(far[0]).toBeCloseTo(bx, 5);
    expect(far[1]).toBeCloseTo(by, 5);
    const other = panBy(small, -10_000, -10_000);
    expect(other[0] + other[2]).toBeCloseTo(bx + bw, 5);
    expect(other[1] + other[3]).toBeCloseTo(by + bh, 5);
  });

  it("at the whole country a drag does nothing", () => {
    expect(panBy(FULL_VIEW, 50, -80)).toEqual(FULL_VIEW);
  });

  it("zooms around the point under the cursor", () => {
    const v: View = [100, 200, 400, 500];
    const z = zoomAt(v, 300, 450, 2);
    expect(z[2]).toBeCloseTo(200, 5);
    // The anchor keeps its relative place in the view.
    expect((300 - z[0]) / z[2]).toBeCloseTo((300 - v[0]) / v[2], 5);
    expect((450 - z[1]) / z[3]).toBeCloseTo((450 - v[1]) / v[3], 5);
  });

  it("zooming out past the country stops at the country", () => {
    expect(zoomOf(zoomAt(FULL_VIEW, 400, 500, 0.25))).toBeCloseTo(1, 5);
  });

  it("maps screen pixels and drawing units both ways, with the margins of meet", () => {
    const v: View = [0, 0, 100, 200];
    const [x, y] = screenToMap(v, 400, 400, 200, 200);
    expect([x, y]).toEqual([50, 100]);
    const [sx, sy] = mapToScreen(v, 400, 400, x, y);
    expect(sx).toBeCloseTo(200, 5);
    expect(sy).toBeCloseTo(200, 5);
  });

  it("turns a wheel notch into a gentle zoom, in for up and out for down", () => {
    expect(wheelFactor(-100)).toBeGreaterThan(1.3);
    expect(wheelFactor(100)).toBeLessThan(0.76);
    expect(wheelFactor(-3, 1)).toBeCloseTo(wheelFactor(-48), 5);
    expect(wheelFactor(-100000)).toBeCloseTo(wheelFactor(-300), 5);
  });
});

describe("the gesture helper", () => {
  it("teaches two fingers on a phone, whatever went wrong", () => {
    expect(hintFor("touch", "one-finger").title).toBe("Bruk to fingre for å flytte kartet");
    expect(hintFor("touch", "idle").art).toBe("two-fingers");
  });

  it("teaches Ctrl and the wheel to a mouse that wheeled, Cmd on a Mac", () => {
    expect(hintFor("mouse", "wheel").title).toBe("Hold Ctrl og rull for å zoome");
    expect(hintFor("mouse", "wheel", true).title).toBe("Hold Cmd og rull for å zoome");
    expect(hintFor("mouse", "wheel", true).modifier).toBe("Cmd");
  });

  it("teaches a mouse that has not moved the map to zoom first, and to drag once zoomed in", () => {
    expect(hintFor("mouse", "idle")).toMatchObject({ title: "Hold Ctrl og rull for å zoome", art: "ctrl-wheel" });
    const h = hintFor("mouse", "idle", false, true);
    expect(h.title).toBe("Dra for å flytte kartet");
    expect(h.art).toBe("drag");
  });

  it("zooms on the wheel only with Ctrl or Cmd, or once the map was clicked", () => {
    expect(wheelZooms({ ctrlKey: false, metaKey: false }, false)).toBe(false);
    expect(wheelZooms({ ctrlKey: true, metaKey: false }, false)).toBe(true);
    expect(wheelZooms({ ctrlKey: false, metaKey: true }, false)).toBe(true);
    expect(wheelZooms({ ctrlKey: false, metaKey: false }, true)).toBe(true);
  });

  it("reads the device from the pointer media queries", () => {
    expect(deviceFrom(true, false)).toBe("touch");
    expect(deviceFrom(true, true)).toBe("mouse"); // a touch laptop with a mouse
    expect(deviceFrom(false, true)).toBe("mouse");
    expect(isMacPlatform("MacIntel")).toBe(true);
    expect(isMacPlatform("Win32")).toBe(false);
  });
});

describe("the list beside the map", () => {
  const rows = [
    { ...placed(1, 0, 0, 5e6, "awarded"), r: "NO060" },
    { ...placed(2, 0, 0, 9e6, "planned"), d: ["electrical"] },
    { ...placed(3, 0, 0, 1e6, "tender") },
    { ...placed(4, 0, 0, null, "tender") },
  ];

  it("puts open tenders first, then by value", () => {
    expect(sortProjects(rows, "rel").map((p) => p.no)).toEqual([3, 4, 2, 1]);
    expect(sortProjects(rows, "val").map((p) => p.no)).toEqual([2, 1, 3, 4]);
  });

  it("filters by stage, trade and county together", () => {
    const all = new Set(STAGES);
    expect(filterProjects(rows, { stages: all, domain: "electrical", county: null }).map((p) => p.no)).toEqual([2]);
    expect(filterProjects(rows, { stages: all, domain: "", county: "NO060" }).map((p) => p.no)).toEqual([1]);
    expect(filterProjects(rows, { stages: new Set(["tender"]), domain: "", county: null })).toHaveLength(2);
  });

  it("counts counties from the ATS, or from the dots when it sent none", () => {
    expect(countyCounts({ NO060: [1, 2, 3], XX: [9, 9, 9] }, rows).NO060).toEqual([1, 2, 3]);
    expect(countyCounts(undefined, rows).NO081).toEqual([1, 2, 0]);
  });

  it("writes values as millions, Norwegian style", () => {
    expect(mnok(60_000_000)).toBe("60");
    expect(mnok(2_450_000)).toBe("2,5");
    expect(mnok(250_000_000)).toBe("250");
    expect(mnok(null)).toBeNull();
  });
});

describe("the access form", () => {
  const good = {
    company: "Eksempel Bygg AS",
    orgnr: "935 667 089",
    email: "Post@Example.no",
    phone: "",
    regions: ["NO060", "NO071"],
    domains: ["electrical"],
    contact_name: "Ola Nordmann",
    contact_role: "Daglig leder",
    website_confirmed: true,
  };

  it("accepts a complete request and tidies it", () => {
    const c = checkAccessRequest(good);
    expect(c.ok).toBe(true);
    if (c.ok) {
      expect(c.value.orgnr).toBe("935667089");
      expect(c.value.email).toBe("post@example.no");
      expect(c.value.contact_role).toBe("Daglig leder");
    }
  });

  it("names the field that is wrong", () => {
    expect(checkAccessRequest({ ...good, company: " " })).toMatchObject({ ok: false, field: "company" });
    expect(checkAccessRequest({ ...good, orgnr: "12345" })).toMatchObject({ ok: false, field: "company" });
    expect(checkAccessRequest({ ...good, orgnr: "935667080" })).toMatchObject({ ok: false, field: "company" });
    expect(checkAccessRequest({ ...good, contact_name: "" })).toMatchObject({ ok: false, field: "contact_name" });
    expect(checkAccessRequest({ ...good, contact_role: " " })).toMatchObject({ ok: false, field: "contact_role" });
    expect(checkAccessRequest({ ...good, website_confirmed: false })).toMatchObject({ ok: false, field: "website_confirmed" });
    expect(checkAccessRequest({ ...good, email: "post@example" })).toMatchObject({ ok: false, field: "email" });
    expect(checkAccessRequest({ ...good, phone: "call me" })).toMatchObject({ ok: false, field: "phone" });
  });

  it("takes known county and trade codes only", () => {
    expect(checkAccessRequest({ ...good, regions: ["NO082"] })).toMatchObject({ ok: false, field: "regions" });
    expect(checkAccessRequest({ ...good, regions: "NO060" })).toMatchObject({ ok: false, field: "regions" });
    expect(checkAccessRequest({ ...good, domains: ["<script>"] })).toMatchObject({ ok: false, field: "domains" });
    expect(checkAccessRequest({ ...good, regions: undefined, domains: [] })).toMatchObject({ ok: true });
  });

  it("checks a login address and a login token", () => {
    expect(checkLoginEmail(" Ola@Firma.no ")).toEqual({ ok: true, email: "ola@firma.no" });
    expect(checkLoginEmail("ola")).toMatchObject({ ok: false });
    expect(isLoginToken("a".repeat(32))).toBe(true);
    expect(isLoginToken("../../api")).toBe(false);
    expect(isLoginToken("short")).toBe(false);
  });

  it("links a sent project only to a path on this site", () => {
    expect(isSentProjectPath("/prosjekt/1f0e9c7a-0000-4000-8000-000000000000")).toBe(true);
    expect(isSentProjectPath("https://evil.example/prosjekt/x")).toBe(false);
    expect(isSentProjectPath("//evil.example")).toBe(false);
    expect(isSentProjectPath("javascript:alert(1)")).toBe(false);
  });
});

describe("the header on the portal", () => {
  const token = "1f0e9c7a-0000-4000-8000-000000000000";

  it("is the site's own everywhere else", () => {
    expect(portalHeader("/")).toBeNull();
    expect(portalHeader("/for-employers")).toBeNull();
    expect(portalHeader("/prosjekterx")).toBeNull();
    expect(portalHeader("/prosjektx")).toBeNull();
    expect(isPortalPath(null)).toBe(false);
  });

  it("offers login and access on the map and its pages, as dialogs over the page", () => {
    // A presentation of one project is part of the portal too (29 September 2026).
    for (const p of ["/prosjekter", "/prosjekter/logg-inn", `/prosjekter/inn/${"a".repeat(32)}`, `/prosjekt/${token}`]) {
      expect(portalHeader(p)).toEqual({
        quiet: { label: "Logg inn", href: "#logg-inn" },
        gold: { label: "Få tilgang", href: "#tilgang" },
      });
    }
  });

  it("says Min side on a client's own page", () => {
    expect(portalHeader(`/prosjekter/${token}`)).toEqual({
      quiet: { label: "Min side", href: `/prosjekter/${token}` },
      gold: { label: "Prosjektkartet", href: "/prosjekter" },
    });
  });
});

describe("no en or em dash in the portal's files", () => {
  const root = path.resolve(__dirname, "..", "..");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(tsx?|css|json)$/.test(name)) files.push(full);
    }
  };
  for (const dir of ["app/prosjekter", "app/api/prosjekter", "components/prosjekter", "lib/prosjekter"]) walk(path.join(root, dir));
  const dashes = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);

  it.each(files.map((f) => [path.relative(root, f), f]))("%s", (_name, file) => {
    expect(dashes.test(readFileSync(file, "utf8"))).toBe(false);
  });
});
