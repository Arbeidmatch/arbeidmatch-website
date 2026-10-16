"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as TerrainMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ExplorerProject } from "@/lib/prosjekter/explorer";
import styles from "./explorer.module.css";

export default function ExplorerTerrain({ projects, selected, onSelect }: {
  projects: ExplorerProject[]; selected: ExplorerProject | null; onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const map = useRef<TerrainMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const props = useRef({ projects, selected, onSelect });
  props.current = { projects, selected, onSelect };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [north, setNorth] = useState(false);

  useEffect(() => {
    let disposed = false;
    void import("maplibre-gl").then(({ default: lib }) => {
      if (disposed || !container.current) return;
      const point = props.current.selected?.coordinates;
      const instance = new lib.Map({
        container: container.current, center: point ?? [13, 65], zoom: point ? 10.8 : 4.2,
        pitch: point ? 68 : 30, maxPitch: 78, maxZoom: 15, attributionControl: false, cooperativeGestures: true,
        canvasContextAttributes: { alpha: true, antialias: true },
        style: { version: 8, sources: {
          imagery: { type: "raster", tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" },
          terrain: { type: "raster-dem", tiles: ["https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"], tileSize: 512, encoding: "terrarium", maxzoom: 14, attribution: '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noreferrer">© Mapterhorn</a>' },
        }, layers: [{ id: "imagery", type: "raster", source: "imagery", paint: { "raster-saturation": -0.2, "raster-contrast": 0.02 } }], terrain: { source: "terrain", exaggeration: 1 } },
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
        instance.addSource("projects", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterRadius: 35 });
        instance.addLayer({ id: "project-points", type: "circle", source: "projects", paint: { "circle-radius": ["case", ["has", "point_count"], 13, 6], "circle-color": "#c9a84c", "circle-stroke-width": 2, "circle-stroke-color": "#fff7df" } });
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
    return () => { disposed = true; marker.current?.remove(); map.current?.remove(); marker.current = null; map.current = null; };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const source = instance.getSource("projects") as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData({ type: "FeatureCollection", features: projects.filter(p => p.coordinates).map(p => ({
      type: "Feature", properties: { id: p.id }, geometry: { type: "Point", coordinates: p.coordinates! },
    })) });
  }, [projects, ready]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !marker.current) return;
    if (!selected?.coordinates) { marker.current.remove(); return; }
    marker.current.getElement().textContent = selected.title;
    marker.current.getElement().setAttribute("aria-label", `Vis ${selected.title}`);
    marker.current.setLngLat(selected.coordinates).addTo(instance);
    instance.flyTo({ center: selected.coordinates, zoom: 11.2, pitch: 70, bearing: -20,
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
    {failed ? <p className={styles.mapMessage}>Kartet kunne ikke lastes. Prosjektdetaljene er fortsatt tilgjengelige.</p> : !ready ? <p className={styles.mapMessage}>Laster kart ...</p> : null}
    <span className={styles.mapCaption}>{selected?.locationLabel ?? "Velg et prosjekt"}{north ? " · Nordlysillustrasjon" : ""}</span>
  </div>;
}
