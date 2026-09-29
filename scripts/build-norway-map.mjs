/**
 * Builds src/lib/prosjekter/norway-map.json, the county shapes behind the map
 * on /prosjekter, from Kartverket's county polygons (CC BY 4.0, "Kartdata:
 * (c) Kartverket" is credited under the map).
 *
 *   node scripts/build-norway-map.mjs <fylker.geojson> [tolerance=0.5] [minArea=2]
 *
 * The input is a FeatureCollection of today's 15 counties with the property
 * `fylkesnavn`, in WGS84 longitude/latitude. The polygons are projected with a
 * Lambert conformal conic (standard parallels 60N and 68N, origin 65N 15E),
 * scaled so the longer side is 1000 units, simplified with Douglas-Peucker and
 * written as relative SVG paths at one decimal. The projection parameters go
 * into the file too, so src/lib/prosjekter/map.ts places a project's
 * latitude/longitude on exactly the same drawing.
 *
 * The geojson itself (640 KB) is not kept in the repository; only the output is.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , input, tolArg, minArg] = process.argv;
if (!input) {
  console.error("usage: node scripts/build-norway-map.mjs <fylker.geojson> [tolerance] [minArea]");
  process.exit(1);
}
const TOL = Number(tolArg) || 0.5;
const MIN_AREA = Number(minArg) || 2;

const NAME_TO_CODE = {
  Oslo: "NO081",
  Akershus: "NO084",
  Østfold: "NO083",
  Buskerud: "NO085",
  Vestfold: "NO093",
  Telemark: "NO094",
  Innlandet: "NO020",
  Agder: "NO092",
  Rogaland: "NO0A1",
  Vestland: "NO0A2",
  "Møre og Romsdal": "NO0A3",
  Trøndelag: "NO060",
  Nordland: "NO071",
  Troms: "NO072",
  Finnmark: "NO073",
};

const R = Math.PI / 180;
const p1 = 60 * R;
const p2 = 68 * R;
const p0 = 65 * R;
const l0 = 15 * R;
const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
const F = (Math.cos(p1) * Math.pow(Math.tan(Math.PI / 4 + p1 / 2), n)) / n;
const r0 = F / Math.pow(Math.tan(Math.PI / 4 + p0 / 2), n);
function lcc(lon, lat) {
  const r = F / Math.pow(Math.tan(Math.PI / 4 + (lat * R) / 2), n);
  const t = n * (lon * R - l0);
  return [r * Math.sin(t), -(r0 - r * Math.cos(t))];
}

const geo = JSON.parse(fs.readFileSync(input, "utf8"));
for (const f of geo.features) {
  if (f.geometry.type === "Polygon") {
    f.geometry.coordinates = [f.geometry.coordinates];
    f.geometry.type = "MultiPolygon";
  }
}

let mnx = Infinity;
let mny = Infinity;
let mxx = -Infinity;
let mxy = -Infinity;
for (const f of geo.features)
  for (const poly of f.geometry.coordinates)
    for (const ring of poly)
      for (const [lo, la] of ring) {
        const [x, y] = lcc(lo, la);
        mnx = Math.min(mnx, x);
        mxx = Math.max(mxx, x);
        mny = Math.min(mny, y);
        mxy = Math.max(mxy, y);
      }
const S = 1000 / Math.max(mxx - mnx, mxy - mny);
const PAD = 10;
const W = Math.round((mxx - mnx) * S + 2 * PAD);
const H = Math.round((mxy - mny) * S + 2 * PAD);
const proj = (lo, la) => {
  const [x, y] = lcc(lo, la);
  return [(x - mnx) * S + PAD, (y - mny) * S + PAD];
};

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0;
    let mi = -1;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L;
      if (d > md) {
        md = d;
        mi = i;
      }
    }
    if (md > tol) {
      keep[mi] = 1;
      stack.push([a, mi], [mi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = (ring) => {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
};

const counties = {};
for (const f of geo.features) {
  const name = String(f.properties.fylkesnavn).split(" - ")[0];
  const code = NAME_TO_CODE[name];
  if (!code) throw new Error(`unknown county ${name}`);
  const rings = [];
  let big = null;
  let bigArea = 0;
  for (const poly of f.geometry.coordinates) {
    // Outer rings only: the lakes are too small to see at this scale.
    const pr = poly[0].map(([lo, la]) => proj(lo, la));
    const A = Math.abs(area(pr));
    if (A > bigArea) {
      bigArea = A;
      big = pr;
    }
    if (A < MIN_AREA) continue;
    // Split the ring at its farthest point so both halves simplify well.
    let far = 0;
    let farD = 0;
    pr.forEach((p, i) => {
      const d = Math.hypot(p[0] - pr[0][0], p[1] - pr[0][1]);
      if (d > farD) {
        farD = d;
        far = i;
      }
    });
    const s = simplify(pr.slice(0, far + 1), TOL).concat(simplify(pr.slice(far), TOL).slice(1));
    if (s.length >= 4) rings.push(s);
  }
  // Label point: centroid of the largest ring.
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0; i < big.length; i++) {
    const [x1, y1] = big[i];
    const [x2, y2] = big[(i + 1) % big.length];
    const c = x1 * y2 - x2 * y1;
    a += c;
    cx += (x1 + x2) * c;
    cy += (y1 + y2) * c;
  }
  cx /= 3 * a;
  cy /= 3 * a;

  let d = "";
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const r of rings) {
    let px = Math.round(r[0][0] * 10);
    let py = Math.round(r[0][1] * 10);
    d += `M${px / 10} ${py / 10}l`;
    const parts = [];
    for (let i = 1; i < r.length - 1; i++) {
      const x = Math.round(r[i][0] * 10);
      const y = Math.round(r[i][1] * 10);
      const dx = x - px;
      const dy = y - py;
      if (!dx && !dy) continue;
      parts.push(`${dx / 10} ${dy / 10}`);
      px = x;
      py = y;
    }
    d += `${parts.join(" ").replace(/ -/g, "-")}z`;
    for (const [x, y] of r) {
      bb[0] = Math.min(bb[0], x);
      bb[1] = Math.min(bb[1], y);
      bb[2] = Math.max(bb[2], x);
      bb[3] = Math.max(bb[3], y);
    }
  }
  counties[code] = {
    n: name,
    d,
    cx: +cx.toFixed(1),
    cy: +cy.toFixed(1),
    bb: bb.map((v) => +v.toFixed(1)),
  };
}

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/lib/prosjekter/norway-map.json");
const ordered = Object.fromEntries(Object.keys(NAME_TO_CODE).filter((c) => counties[NAME_TO_CODE[c]]).map((name) => [NAME_TO_CODE[name], counties[NAME_TO_CODE[name]]]));
fs.writeFileSync(out, `${JSON.stringify({ W, H, proj: { mnx, mny, S, PAD }, counties: ordered })}\n`);
console.log(`wrote ${out}: W ${W} H ${H}, ${fs.statSync(out).size} bytes`);
