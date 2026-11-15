"use client";

import { useEffect, useState } from "react";

type MapData = { counties: Record<string, { d: string }> };
type Live = { total: number | null; shade: Record<string, number> };

/**
 * The live parts of the front page's Forsprang card: how many projects the map
 * holds now, and the faint county map behind the card, shaded by where they
 * are. Both come from the same open overview the project page uses, asked for
 * once; nothing is shown until it answers, never a fixed number.
 */
let overview: Promise<Live> | null = null;
function liveOverview(): Promise<Live> {
  overview ??= fetch("/api/prosjekter/overview")
    .then((r) => (r.ok ? r.json() : null))
    .then((o: { total?: unknown; county_counts?: Record<string, number[]> } | null) => {
      const shade: Record<string, number> = {};
      for (const [code, counts] of Object.entries(o?.county_counts ?? {})) {
        const sum = Array.isArray(counts) ? counts.reduce((a, b) => a + (Number(b) || 0), 0) : 0;
        shade[code] = Math.min(1, sum / 190);
      }
      return { total: typeof o?.total === "number" && o.total > 0 ? o.total : null, shade };
    })
    .catch(() => ({ total: null, shade: {} }));
  return overview;
}

export function ForsprangMinimap() {
  const [map, setMap] = useState<MapData | null>(null);
  const [shade, setShade] = useState<Record<string, number>>({});
  useEffect(() => {
    let live = true;
    // The county outlines are a separate chunk, fetched after the page has painted.
    import("@/lib/prosjekter/norway-map.json")
      .then((m) => live && setMap((m.default ?? m) as MapData))
      .catch(() => {});
    void liveOverview().then((o) => live && setShade(o.shade));
    return () => {
      live = false;
    };
  }, []);
  if (!map) return null;
  return (
    <svg className="minimap" viewBox="-40 -10 901 1040" aria-hidden="true">
      {Object.entries(map.counties).map(([code, c]) => (
        <path key={code} d={c.d} style={{ ["--a" as string]: (shade[code] ?? 0).toFixed(2) }} />
      ))}
    </svg>
  );
}

export function ForsprangCount() {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void liveOverview().then((o) => live && setTotal(o.total));
    return () => {
      live = false;
    };
  }, []);
  if (total === null) return null;
  return (
    <span className="stat">
      <b>{total.toLocaleString("nb-NO")}</b>prosjekter på kartet nå
    </span>
  );
}
