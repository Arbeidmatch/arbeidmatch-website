"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as TerrainMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ExplorerProject } from "@/lib/prosjekter/explorer";
import { STAGE_HEX, STAGE_LABEL, STAGES, dotRadius } from "@/lib/prosjekter/map";
import styles from "./explorer.module.css";

const mapStage = (p: ExplorerProject) => p.stage === "tender" && p.stageLabel === STAGE_LABEL.closed ? "closed" : p.stage;
const bubbleStages = [...STAGES, "cancelled"] as const;
const bubbleColors = { ...STAGE_HEX, cancelled: "#a47788" };
const bubbleLabels = { ...STAGE_LABEL, cancelled: "Avlyst" };

export default function ExplorerTerrain({ projects, selected, onSelect }: {
  projects: ExplorerProject[]; selected: ExplorerProject | null; onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const map = useRef<TerrainMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const clusters = useRef(new Map<number, Marker>());
  const props = useRef({ projects, selected, onSelect });
  props.current = { projects, selected, onSelect };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [north, setNorth] = useState(false);
  const [group, setGroup] = useState<string[]>([]);
  const [groupPage, setGroupPage] = useState(0);
  const groupProjects = projects.filter(p => group.includes(p.id));
  const counts = bubbleStages.map(stage => ({ stage, count: projects.filter(p => mapStage(p) === stage && p.coordinates).length }));

  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then(({ default: lib }) => {
      if (disposed || !container.current) return;
      const point = props.current.selected?.coordinates;
      const instance = new lib.Map({
        container: container.current, center: point ?? [13, 65], zoom: point ? 9.4 : 4.2,
        pitch: point ? 60 : 30, maxPitch: 78, maxZoom: 15, attributionControl: false,
        cooperativeGestures: false, scrollZoom: true, dragPan: true, dragRotate: true,
        canvasContextAttributes: { alpha: true, antialias: true },
        style: { version: 8, sources: {
          imagery: { type: "raster", tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" },
          reference: { type: "raster", tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 23, attribution: "Labels and boundaries © Esri, HERE, Garmin, OpenStreetMap contributors" },
          terrain: { type: "raster-dem", tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"], tileSize: 512, encoding: "terrarium", maxzoom: 14, attribution: '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noreferrer">© Mapterhorn</a>' },
        }, layers: [
          { id: "imagery", type: "raster", source: "imagery", paint: { "raster-saturation": -0.2, "raster-contrast": 0.02 } },
          { id: "reference", type: "raster", source: "reference" },
        ], terrain: { source: "terrain", exaggeration: 1 } },
      });
      map.current = instance;
      instance.addControl(new lib.NavigationControl({ visualizePitch: true }), "top-right");
      instance.addControl(new lib.AttributionControl({ compact: true }));
      const el = document.createElement("button");
      el.className = styles.pin;
      el.type = "button";
      el.onclick = () => { const p = props.current.selected; if (p) props.current.onSelect(p.id); };
      marker.current = new lib.Marker({ element: el, anchor: "bottom", offset: [0, -20] });
      instance.on("load", () => {
        if (disposed) return;
        instance.addSource("projects", {
          type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterRadius: 45, clusterMaxZoom: 14,
          clusterProperties: Object.fromEntries(bubbleStages.map(stage => [stage, ["+", ["case", ["==", ["get", "stage"], stage], 1, 0]]])),
        });
        instance.addLayer({ id: "project-points", type: "circle", source: "projects", filter: ["!", ["has", "point_count"]], paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": ["match", ["get", "stage"], "planned", STAGE_HEX.planned, "tender", STAGE_HEX.tender, "closed", STAGE_HEX.closed, "awarded", STAGE_HEX.awarded, bubbleColors.cancelled],
          "circle-stroke-width": 2, "circle-stroke-color": "#fff7df",
        } });
        instance.on("render", () => {
          if (!instance.isSourceLoaded("projects")) return;
          const present = new Set<number>();
          for (const feature of instance.querySourceFeatures("projects")) {
            const values = feature.properties;
            if (!values?.cluster || feature.geometry.type !== "Point") continue;
            const id = Number(values.cluster_id);
            if (present.has(id)) continue;
            present.add(id);
            const count = Number(values.point_count);
            const position = feature.geometry.coordinates as [number, number];
            const signature = JSON.stringify([position, count, ...bubbleStages.map(stage => values[stage])]);
            const existing = clusters.current.get(id);
            if (existing?.getElement().dataset.signature === signature) continue;
            existing?.remove();
            const button = document.createElement("button");
            button.type = "button";
            button.className = styles.clusterBubble;
            button.dataset.signature = signature;
            let angle = 0;
            const segments = bubbleStages.flatMap(stage => {
              const n = Number(values[stage] ?? 0);
              if (!n) return [];
              const start = angle;
              angle += 360 * n / count;
              return [`${bubbleColors[stage]} ${start}deg ${angle}deg`];
            });
            button.style.background = `conic-gradient(${segments.join(",")})`;
            button.style.width = button.style.height = `${Math.min(60, 42 + Math.sqrt(count))}px`;
            const number = document.createElement("span");
            number.textContent = count.toLocaleString("nb-NO");
            button.append(number);
            const breakdown = bubbleStages.filter(stage => values[stage]).map(stage => `${bubbleLabels[stage]}: ${values[stage]}`).join(", ");
            button.setAttribute("aria-label", `${count} prosjekter. ${breakdown}`);
            button.title = `${count} prosjekter. ${breakdown}`;
            button.onclick = () => {
              const source = instance.getSource("projects") as import("maplibre-gl").GeoJSONSource;
              void source.getClusterExpansionZoom(id).then(async zoom => {
                if (disposed) return;
                if (zoom <= 14 && instance.getZoom() < 14) {
                  instance.easeTo({ center: position, zoom, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700 });
                } else {
                  const leaves = await source.getClusterLeaves(id, count, 0);
                  if (disposed) return;
                  setGroup(leaves.map(f => String(f.properties?.id)));
                  setGroupPage(0);
                }
              }).catch(() => { /* A filter change can replace this cluster while it is being opened. */ });
            };
            clusters.current.set(id, new lib.Marker({ element: button }).setLngLat(position).addTo(instance));
          }
          for (const [id, bubble] of clusters.current) if (!present.has(id)) { bubble.remove(); clusters.current.delete(id); }
        });
        instance.on("click", "project-points", e => {
          const f = e.features?.[0];
          if (typeof f?.properties?.id === "string") props.current.onSelect(f.properties.id);
          else if (f?.geometry.type === "Point") instance.easeTo({ center: f.geometry.coordinates as [number, number], zoom: Math.min(instance.getZoom() + 2, 14) });
        });
        instance.on("mouseenter", "project-points", () => { instance.getCanvas().style.cursor = "pointer"; });
        instance.on("mouseleave", "project-points", () => { instance.getCanvas().style.cursor = ""; });
        setFailed(false);
        setReady(true);
      });
      instance.on("move", () => setNorth(instance.getCenter().lat >= 66.5));
      instance.on("error", () => { if (!disposed && !instance.isStyleLoaded()) setFailed(true); });
    }).catch(() => { if (!disposed) setFailed(true); });
    const bubbles = clusters.current;
    return () => { disposed = true; for (const bubble of bubbles.values()) bubble.remove(); bubbles.clear(); marker.current?.remove(); map.current?.remove(); marker.current = null; map.current = null; };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const source = instance.getSource("projects") as import("maplibre-gl").GeoJSONSource | undefined;
    for (const bubble of clusters.current.values()) bubble.remove();
    clusters.current.clear();
    source?.setData({ type: "FeatureCollection", features: projects.filter(p => p.coordinates).map(p => ({
      type: "Feature", properties: { id: p.id, stage: mapStage(p), radius: dotRadius(p.mapValue) }, geometry: { type: "Point", coordinates: p.coordinates! },
    })) });
  }, [projects, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !marker.current) return;
    if (!selected?.coordinates) { marker.current.remove(); return; }
    marker.current.getElement().textContent = `Område: ${selected.place}`;
    marker.current.getElement().setAttribute("aria-label", `Vis ${selected.title}`);
    marker.current.setLngLat(selected.coordinates).addTo(instance);
    instance.flyTo({ center: selected.coordinates, zoom: 9.4, pitch: 60, bearing: -20,
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 2400 });
  }, [selected, ready]);

  useEffect(() => {
    if (!north || !canvas.current) return;
    const element = canvas.current;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    let frame = 0, last = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (time: number) => {
      if (!reduced) frame = requestAnimationFrame(draw);
      if (document.hidden || time - last < 70) return;
      last = time;
      const w = element.clientWidth, h = element.clientHeight;
      if (element.width !== w || element.height !== h) { element.width = w; element.height = h; }
      ctx.clearRect(0, 0, w, h);
      const t = reduced ? 0 : time * 0.00008;
      for (let layer = 0; layer < 2; layer++) for (let x = 0; x < w; x += 2) {
        const u = x / w, y = h * (0.2 + layer * .06 + .07 * Math.sin(u * 7 + t) + .02 * Math.sin(u * 25 - t));
        const length = h * (.16 + .07 * Math.sin(u * 14 + t));
        const alpha = (.13 + .1 * Math.sin(u * 180 + t)) * Math.sin(Math.PI * u);
        const gradient = ctx.createLinearGradient(x, y - length, x, y + 8);
        gradient.addColorStop(0, "rgba(140,115,225,0)");
        gradient.addColorStop(.7, `rgba(100,190,180,${alpha * .6})`);
        gradient.addColorStop(.93, `rgba(115,245,185,${alpha})`);
        gradient.addColorStop(1, "rgba(90,215,170,0)");
        ctx.strokeStyle = gradient; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 10, y - length); ctx.lineTo(x, y + 8); ctx.stroke();
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [north]);

  return <div className={`${styles.terrain} ${north ? styles.north : ""}`}>
    <canvas className={styles.aurora} ref={canvas} aria-hidden="true" />
    <div className={styles.mapCanvas} ref={container} aria-label="Prosjektkart i 3D" />
    <button type="button" className={styles.overviewButton} disabled={!ready} onClick={() => map.current?.fitBounds([[4, 57.5], [31.5, 71.5]], { padding: 45, pitch: 25, bearing: 0, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200 })}>Hele Norge</button>
    <div className={styles.mapLegend} aria-label="Faser og antall på kartet">{counts.filter(c => c.count > 0).map(({ stage, count }) => <span key={stage}><i style={{ background: bubbleColors[stage] }} />{bubbleLabels[stage]} <b>{count.toLocaleString("nb-NO")}</b></span>)}<small>Størrelse = verdi · Ring = faser · Tall = prosjekter</small></div>
    {groupProjects.length > 0 ? <section className={styles.clusterList} aria-label="Prosjekter i kartgruppen"><header><strong>{groupProjects.length} prosjekter i området</strong><button type="button" onClick={() => setGroup([])}>Lukk</button></header>{groupProjects.slice(groupPage * 5, groupPage * 5 + 5).map(p => <button key={p.id} type="button" onClick={() => { onSelect(p.id); setGroup([]); }}>{p.title}<small>{p.stageLabel} · {p.value}</small></button>)}{groupProjects.length > 5 ? <footer><button type="button" disabled={groupPage === 0} onClick={() => setGroupPage(v => v - 1)}>Forrige</button><span>{groupPage + 1} / {Math.ceil(groupProjects.length / 5)}</span><button type="button" disabled={(groupPage + 1) * 5 >= groupProjects.length} onClick={() => setGroupPage(v => v + 1)}>Neste</button></footer> : null}</section> : null}
    {failed ? <p className={styles.mapMessage}>Kartet kunne ikke lastes. Prosjektdetaljene er fortsatt tilgjengelige.</p> : !ready ? <p className={styles.mapMessage}>Laster kart ...</p> : null}
    <span className={styles.mapCaption}>{selected?.locationLabel ?? "Velg et prosjekt"}{north ? " · Nordlysillustrasjon" : ""}</span>
  </div>;
}
