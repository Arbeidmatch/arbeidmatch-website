import { COUNTIES, countyView, project, unproject, viewAround, type View } from "./map";
import { expandRegions } from "./regions";

/**
 * The counties of a client's subscription, as the maps on the subscriber page
 * use them (ORDER 504, his words of 25 November 2026: "kartul sa deschida
 * numai zona pe care o are"). Pure: the subscription's regions become the
 * counties drawn on the map, the frame the map opens on and the test a project
 * must pass to be shown. No counties means the whole country, as before.
 */

/** The subscription's counties as map codes: old counties become the new ones; unknown codes are dropped. */
export function subscriptionCounties(regions: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(regions) || !regions.length) return [];
  return expandRegions(regions.filter((r): r is string => typeof r === "string")).filter((code) => Boolean(COUNTIES[code]));
}

/** Whether a project with these counties belongs on a map scoped to `scope`; an empty scope takes everything. */
export function inScope(regions: readonly string[], scope: readonly string[]): boolean {
  if (!scope.length) return true;
  return expandRegions([...regions]).some((r) => scope.includes(r));
}

/** The drawing box [x0, y0, x1, y1] around the counties, or null for none. */
function scopeBox(scope: readonly string[]): [number, number, number, number] | null {
  const boxes = scope.map((code) => COUNTIES[code]?.bb).filter((bb): bb is [number, number, number, number] => Boolean(bb));
  if (!boxes.length) return null;
  return [
    Math.min(...boxes.map((b) => b[0])),
    Math.min(...boxes.map((b) => b[1])),
    Math.max(...boxes.map((b) => b[2])),
    Math.max(...boxes.map((b) => b[3])),
  ];
}

/** The classic map's opening view: one county as a county click frames it, several framed together; null for the whole country. */
export function scopeView(scope: readonly string[]): View | null {
  if (scope.length === 1) return countyView(scope[0]);
  const box = scopeBox(scope);
  if (!box) return null;
  const [x0, y0, x1, y1] = box;
  const pad = Math.max(x1 - x0, y1 - y0) * 0.14 + 12;
  return viewAround(x0, y0, x1, y1, pad);
}

/** The 3D map's opening bounds, [[west, south], [east, north]] in degrees; null for the whole country. */
export function scopeLngLat(scope: readonly string[]): [[number, number], [number, number]] | null {
  const box = scopeBox(scope);
  if (!box) return null;
  const [x0, y0, x1, y1] = box;
  // The projection is conic, so a straight box edge is not a parallel: every corner and edge middle is read.
  const xs = [x0, (x0 + x1) / 2, x1];
  const ys = [y0, (y0 + y1) / 2, y1];
  const points = xs.flatMap((x) => ys.map((y) => unproject(x, y)));
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

/** What the map calls the whole of the client's area: the county's name, or "Deres fylker" for several. */
export function scopeName(scope: readonly string[]): string {
  if (scope.length === 1) return COUNTIES[scope[0]]?.n ?? "Deres fylker";
  return scope.length ? "Deres fylker" : "Hele Norge";
}

/** A county's outline as polygons of drawing points, read once from its path (only M, l and z are used). */
const outlines = new Map<string, [number, number][][]>();
function outline(code: string): [number, number][][] {
  const known = outlines.get(code);
  if (known) return known;
  const rings: [number, number][][] = [];
  for (const part of (COUNTIES[code]?.d ?? "").split(/(?=M)/)) {
    const nums = (part.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (nums.length < 6) continue;
    let x = nums[0];
    let y = nums[1];
    const ring: [number, number][] = [[x, y]];
    for (let i = 2; i + 1 < nums.length; i += 2) {
      x += nums[i];
      y += nums[i + 1];
      ring.push([x, y]);
    }
    rings.push(ring);
  }
  outlines.set(code, rings);
  return rings;
}

/** Whether a drawing point lies inside a county's outline (even-odd over all its rings). */
export function inCounty(x: number, y: number, code: string): boolean {
  let inside = false;
  for (const ring of outline(code)) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/**
 * Whether a drawing point belongs to the counties; with no scope, anywhere. The
 * outlines are simplified, so a point by the coast may fall in the sea just off
 * them: it belongs when it is inside one of the counties, or inside their box
 * and in no other county.
 */
export function pointInScope(x: number, y: number, scope: readonly string[]): boolean {
  if (!scope.length || scope.some((code) => inCounty(x, y, code))) return true;
  const box = scopeBox(scope);
  if (!box || x < box[0] || y < box[1] || x > box[2] || y > box[3]) return false;
  return !Object.keys(COUNTIES).some((code) => !scope.includes(code) && inCounty(x, y, code));
}

/** Whether a longitude/latitude lies inside one of the counties; with no scope, anywhere. */
export function lngLatInScope(lon: number, lat: number, scope: readonly string[]): boolean {
  if (!scope.length) return true;
  const [x, y] = project(lon, lat);
  return pointInScope(x, y, scope);
}

/** A county's centre as [longitude, latitude], where a project whose own point falls outside the scope is shown. */
export function countyCentreLngLat(code: string): [number, number] | null {
  const c = COUNTIES[code];
  return c ? unproject(c.cx, c.cy) : null;
}
