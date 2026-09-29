import NORWAY from "@/lib/prosjekter/norway-map.json";

/**
 * The project map on /prosjekter, as pure functions: where a project sits on
 * the drawing, how the dots group into clusters at a given zoom, and the view
 * arithmetic behind pan, zoom and "keep Norway on screen".
 *
 * The county shapes in norway-map.json were drawn with the same Lambert
 * conformal conic (standard parallels 60N and 68N, origin 65N 15E) and the
 * same offset and scale as `project` below; scripts/build-norway-map.mjs
 * writes both. A view is an SVG viewBox, [x, y, width, height], in drawing
 * units; the SVG shows it with preserveAspectRatio "xMidYMid meet".
 */

export type MapStage = "planned" | "tender" | "closed" | "awarded";

/** One project on the map, as the ATS sends it in `map` (see types.ts). */
export type MapProject = {
  no: number;
  st: MapStage;
  lat: number;
  lon: number;
  /** Value in NOK, or null when the notice gives none. */
  v: number | null;
  /** County code, e.g. NO060. */
  r: string;
  /** Domain keys. */
  d: string[];
  t: string;
  c: string | null;
  k: string | null;
};

/** A project placed on the drawing. */
export type PlacedProject = MapProject & { x: number; y: number };

export type View = [number, number, number, number];

export type County = { n: string; d: string; cx: number; cy: number; bb: [number, number, number, number] };

export const MAP_W: number = NORWAY.W;
export const MAP_H: number = NORWAY.H;
export const COUNTIES = NORWAY.counties as unknown as Record<string, County>;
export const COUNTY_CODES = Object.keys(COUNTIES);

export const STAGES: MapStage[] = ["planned", "tender", "closed", "awarded"];
export const STAGE_LABEL: Record<MapStage, string> = {
  planned: "Planlagt",
  tender: "Åpen konkurranse",
  closed: "Venter på tildeling",
  awarded: "Tildelt",
};
export const STAGE_HEX: Record<MapStage, string> = {
  planned: "#5d8fe8",
  tender: "#b8860b",
  closed: "#8792a6",
  awarded: "#3fa87b",
};

/* ---------- projection ---------- */

const R = Math.PI / 180;
const P1 = 60 * R;
const P2 = 68 * R;
const P0 = 65 * R;
const L0 = 15 * R;
const N = Math.log(Math.cos(P1) / Math.cos(P2)) / Math.log(Math.tan(Math.PI / 4 + P2 / 2) / Math.tan(Math.PI / 4 + P1 / 2));
const F = (Math.cos(P1) * Math.pow(Math.tan(Math.PI / 4 + P1 / 2), N)) / N;
const R0 = F / Math.pow(Math.tan(Math.PI / 4 + P0 / 2), N);
const { mnx, mny, S, PAD } = NORWAY.proj;

/** Longitude/latitude (degrees) to drawing units, as the county paths were drawn. */
export function project(lon: number, lat: number): [number, number] {
  const r = F / Math.pow(Math.tan(Math.PI / 4 + (lat * R) / 2), N);
  const t = N * (lon * R - L0);
  return [(r * Math.sin(t) - mnx) * S + PAD, (-(R0 - r * Math.cos(t)) - mny) * S + PAD];
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Keeps only well formed map rows from whatever the ATS sent, and places them. */
export function placeProjects(raw: unknown): PlacedProject[] {
  if (!Array.isArray(raw)) return [];
  const out: PlacedProject[] = [];
  for (const item of raw) {
    const p = item as Partial<MapProject> | null;
    if (!p || typeof p !== "object") continue;
    if (typeof p.no !== "number" || !Number.isFinite(p.no)) continue;
    if (p.st !== "planned" && p.st !== "tender" && p.st !== "closed" && p.st !== "awarded") continue;
    if (typeof p.lat !== "number" || typeof p.lon !== "number") continue;
    if (p.lat < 57 || p.lat > 72 || p.lon < 3 || p.lon > 33) continue;
    if (typeof p.t !== "string" || !p.t.trim()) continue;
    const [x, y] = project(p.lon, p.lat);
    out.push({
      no: p.no,
      st: p.st,
      lat: p.lat,
      lon: p.lon,
      v: typeof p.v === "number" && Number.isFinite(p.v) && p.v > 0 ? p.v : null,
      r: typeof p.r === "string" ? p.r : "",
      d: Array.isArray(p.d) ? p.d.filter((x): x is string => typeof x === "string") : [],
      t: p.t.trim(),
      c: typeof p.c === "string" && p.c.trim() ? p.c.trim() : null,
      k: typeof p.k === "string" && p.k.trim() ? p.k.trim() : null,
      x: round1(x),
      y: round1(y),
    });
  }
  return out;
}

/** County counts as [planned, open tender, awarded], from the ATS or, when it sent none, from the dots. */
export function countyCounts(raw: unknown, projects: PlacedProject[]): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {};
  for (const code of COUNTY_CODES) out[code] = [0, 0, 0];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    let any = false;
    for (const [code, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!out[code] || !Array.isArray(v)) continue;
      out[code] = [0, 1, 2].map((i) => (Number.isFinite(Number(v[i])) ? Math.max(0, Math.round(Number(v[i]))) : 0)) as [
        number,
        number,
        number,
      ];
      any = true;
    }
    if (any) return out;
  }
  for (const p of projects) {
    const c = out[p.r];
    if (!c) continue;
    if (p.st === "planned") c[0]++;
    else if (p.st === "awarded") c[2]++;
    else if (p.st === "tender") c[1]++;
  }
  return out;
}

/** A county's fill: darker navy for few projects, lighter for many (square root, so small counties still show). */
export function countyFill(total: number, max: number): string {
  const t = max > 0 ? Math.sqrt(Math.max(0, total) / max) : 0;
  const a = [19, 42, 68];
  const b = [36, 62, 98];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, t))).join(",")})`;
}

/* ---------- values ---------- */

const nf = new Intl.NumberFormat("nb-NO");

/** A value in NOK as millions for the map ("60", "2,5"), or null. */
export function mnok(v: number | null): string | null {
  if (v === null || !(v > 0)) return null;
  const m = v / 1_000_000;
  if (m >= 100) return nf.format(Math.round(m));
  if (m >= 0.1) return nf.format(Math.round(m * 10) / 10);
  return nf.format(Math.round(m * 100) / 100);
}

/** Dot radius in screen pixels: bigger for bigger projects, within 4.5 to 15. */
export function dotRadius(v: number | null): number {
  const m = v && v > 0 ? v / 1_000_000 : 0;
  return Math.max(4.5, Math.min(15, 3.5 + Math.sqrt(m) * 0.62));
}

/* ---------- filtering and order ---------- */

export type MapFilter = { stages: ReadonlySet<MapStage>; domain: string; county: string | null };

export function filterProjects(projects: PlacedProject[], f: MapFilter): PlacedProject[] {
  return projects.filter(
    (p) => f.stages.has(p.st) && (!f.domain || p.d.includes(f.domain)) && (!f.county || p.r === f.county),
  );
}

const ORDER: Record<MapStage, number> = { tender: 0, planned: 1, closed: 2, awarded: 3 };

/** "rel": open tenders first, then planned, waiting and awarded, each by value. "val": by value. */
export function sortProjects(projects: PlacedProject[], sort: "rel" | "val"): PlacedProject[] {
  const v = (p: PlacedProject) => p.v ?? -1;
  return [...projects].sort((a, b) => (sort === "val" ? 0 : ORDER[a.st] - ORDER[b.st]) || v(b) - v(a) || a.no - b.no);
}

/* ---------- clusters ---------- */

export type Cluster = { x: number; y: number; members: PlacedProject[] };

/**
 * Groups dots closer than `threshold` drawing units. The biggest project
 * anchors a cluster and the smaller ones join the first anchor within reach,
 * so the grouping does not depend on the order the ATS sent them in. A grid of
 * threshold-sized cells keeps it linear, so it can run on every zoom step.
 */
export function clusterProjects(projects: PlacedProject[], threshold: number): Cluster[] {
  const byValue = [...projects].sort((a, b) => (b.v ?? -1) - (a.v ?? -1) || a.no - b.no);
  if (!(threshold > 0)) return byValue.map((p) => ({ x: p.x, y: p.y, members: [p] }));
  const clusters: Cluster[] = [];
  const grid = new Map<string, Cluster[]>();
  const key = (gx: number, gy: number) => `${gx}:${gy}`;
  for (const p of byValue) {
    const gx = Math.floor(p.x / threshold);
    const gy = Math.floor(p.y / threshold);
    let hit: Cluster | null = null;
    let best = threshold;
    for (let i = -1; i <= 1 && !hit; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const c of grid.get(key(gx + i, gy + j)) ?? []) {
          const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (d < best) {
            best = d;
            hit = c;
          }
        }
      }
    }
    if (hit) hit.members.push(p);
    else {
      const c: Cluster = { x: p.x, y: p.y, members: [p] };
      clusters.push(c);
      const cell = grid.get(key(gx, gy));
      if (cell) cell.push(c);
      else grid.set(key(gx, gy), [c]);
    }
  }
  return clusters;
}

/** How many of each stage a cluster holds, for the ring around it. */
export function clusterStages(c: Cluster): Record<MapStage, number> {
  const out: Record<MapStage, number> = { planned: 0, tender: 0, closed: 0, awarded: 0 };
  for (const p of c.members) out[p.st]++;
  return out;
}

/* ---------- views ---------- */

/** The whole country, with room for the graticule labels on the left. */
export const FULL_VIEW: View = [-40, -10, MAP_W + 80, MAP_H + 20];
/** The deepest zoom: an eighteenth of the country's width. */
export const MAX_ZOOM = 18;

export function southView(): View {
  const a = project(4.6, 62.6);
  const b = project(12.4, 57.9);
  return [Math.min(a[0], b[0]) - 10, a[1] - 10, Math.abs(b[0] - a[0]) + 20, b[1] - a[1] + 20];
}

/** A view around a box of drawing units, with padding, never smaller than 90 units a side. */
export function viewAround(x0: number, y0: number, x1: number, y1: number, pad: number): View {
  let w = x1 - x0 + 2 * pad;
  let h = y1 - y0 + 2 * pad;
  const min = 90;
  if (w < min) {
    x0 -= (min - w) / 2;
    w = min;
  }
  if (h < min) {
    y0 -= (min - h) / 2;
    h = min;
  }
  return [x0 - pad, y0 - pad, w, h];
}

export function countyView(code: string): View | null {
  const c = COUNTIES[code];
  if (!c) return null;
  const [x0, y0, x1, y1] = c.bb;
  const pad = Math.max(x1 - x0, y1 - y0) * 0.14 + 12;
  return viewAround(x0, y0, x1, y1, pad);
}

/** How a view sits in a box of cw x ch pixels: drawing units per pixel, and the empty margins "meet" leaves. */
export function viewGeometry(v: View, cw: number, ch: number): { k: number; ox: number; oy: number } {
  const w = Math.max(1, cw);
  const h = Math.max(1, ch);
  const k = Math.max(v[2] / w, v[3] / h);
  return { k, ox: (w - v[2] / k) / 2, oy: (h - v[3] / k) / 2 };
}

/** A pixel inside the map box to drawing units. */
export function screenToMap(v: View, cw: number, ch: number, sx: number, sy: number): [number, number] {
  const g = viewGeometry(v, cw, ch);
  return [v[0] + (sx - g.ox) * g.k, v[1] + (sy - g.oy) * g.k];
}

/** Drawing units to a pixel inside the map box. */
export function mapToScreen(v: View, cw: number, ch: number, x: number, y: number): [number, number] {
  const g = viewGeometry(v, cw, ch);
  return [g.ox + (x - v[0]) / g.k, g.oy + (y - v[1]) / g.k];
}

/** How far in a view is, 1 being the whole country. */
export function zoomOf(v: View, bounds: View = FULL_VIEW): number {
  return Math.min(bounds[2] / v[2], bounds[3] / v[3]);
}

/**
 * Keeps a view inside the country: never wider than the whole map, never
 * deeper than MAX_ZOOM, and never panned so far that Norway leaves the frame.
 * When the view is smaller than the bounds it may move only inside them; when
 * it is wider (a tall phone showing a wide box) it is centred.
 */
export function clampView(v: View, bounds: View = FULL_VIEW, maxZoom = MAX_ZOOM): View {
  let [x, y, w, h] = v;
  // Out: at most the bounds, scaled as one so the shape of the view is kept.
  const over = Math.max(w / bounds[2], h / bounds[3]);
  if (over > 1) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    w /= over;
    h /= over;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  // In: at least 1/maxZoom of the bounds in the larger direction.
  const under = Math.max(w / bounds[2], h / bounds[3]) * maxZoom;
  if (under < 1) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    w /= under;
    h /= under;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  const fit = (pos: number, size: number, b0: number, bSize: number) =>
    size >= bSize ? b0 + (bSize - size) / 2 : Math.min(Math.max(pos, b0), b0 + bSize - size);
  return [fit(x, w, bounds[0], bounds[2]), fit(y, h, bounds[1], bounds[3]), w, h];
}

/** Zooms by `factor` (above 1 is in) keeping the drawing point (px, py) where it is on screen, then clamps. */
export function zoomAt(v: View, px: number, py: number, factor: number, bounds: View = FULL_VIEW): View {
  const f = factor > 0 && Number.isFinite(factor) ? factor : 1;
  const w = v[2] / f;
  const h = v[3] / f;
  return clampView([px - (px - v[0]) / f, py - (py - v[1]) / f, w, h], bounds);
}

/** Moves the view by drawing units (a drag to the right moves the map right, so the view left). */
export function panBy(v: View, dx: number, dy: number, bounds: View = FULL_VIEW): View {
  return clampView([v[0] - dx, v[1] - dy, v[2], v[3]], bounds);
}

/** Zoom factor for a wheel step: a notch of about 100 pixels is 1.35x; a trackpad's small deltas are smooth. */
export function wheelFactor(deltaY: number, deltaMode = 0): number {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  const clamped = Math.max(-300, Math.min(300, px));
  return Math.exp(-clamped * 0.003);
}

/** Ease in-out cubic, for the zoom animation. */
export function ease(t: number): number {
  const p = Math.min(1, Math.max(0, t));
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function lerpView(a: View, b: View, t: number): View {
  return a.map((v, i) => v + (b[i] - v) * t) as View;
}

/* ---------- decoration ---------- */

/** Lines of latitude and longitude, and the Arctic Circle, as SVG paths with label points. */
export function graticule(): {
  lat: { d: string; label: string; lx: number; ly: number }[];
  lon: string[];
  polar: { d: string; lx: number; ly: number };
} {
  const line = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const lat: { d: string; label: string; lx: number; ly: number }[] = [];
  for (let la = 58; la <= 71; la += 2) {
    const pts: [number, number][] = [];
    for (let lo = 2; lo <= 33; lo += 0.5) pts.push(project(lo, la));
    const [lx, ly] = project(3.2, la);
    lat.push({ d: line(pts), label: `${la}°N`, lx: round1(lx), ly: round1(ly - 4) });
  }
  const lon: string[] = [];
  for (let lo = 5; lo <= 30; lo += 5) {
    const pts: [number, number][] = [];
    for (let la = 57; la <= 72; la += 0.5) pts.push(project(lo, la));
    lon.push(line(pts));
  }
  const pp: [number, number][] = [];
  for (let lo = 2; lo <= 33; lo += 0.5) pp.push(project(lo, 66.5628));
  const [px, py] = project(4.2, 66.5628);
  return { lat, lon, polar: { d: line(pp), lx: round1(px), ly: round1(py - 5) } };
}

/**
 * Whether zooming to a group's own view would still show it as one group.
 * HIS ASK, 29 September 2026 ("pe mobil ... cand se da ultimul click pe
 * proiecte ... sa deschida direct"): on the last tap, where a zoom no longer
 * splits the group, the phone opens its list at once, without the "Vis N
 * prosjekter i listen" bar in between. The threshold is the one the map
 * clusters by (20 screen pixels in drawing units).
 */
export function staysOneGroup(members: PlacedProject[], target: View, cw: number, ch: number): boolean {
  if (members.length < 2) return true;
  const { k } = viewGeometry(clampView(target), cw, ch);
  return clusterProjects(members, 20 * k).length === 1;
}
