"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";

import styles from "@/components/prosjekter/portal.module.css";
import {
  clampView,
  clusterProjects,
  clusterStages,
  COUNTIES,
  COUNTY_CODES,
  countyFill,
  countyView,
  dotRadius,
  ease,
  FULL_VIEW,
  graticule,
  lerpView,
  MAX_ZOOM,
  mapToScreen,
  mnok,
  panBy,
  screenToMap,
  southView,
  STAGE_HEX,
  staysOneGroup,
  STAGE_LABEL,
  STAGES,
  viewAround,
  viewGeometry,
  wheelFactor,
  zoomAt,
  zoomOf,
  type Cluster,
  type PlacedProject,
  type View,
} from "@/lib/prosjekter/map";
import {
  deviceFrom,
  HINT_FLASH_MS,
  HINT_IDLE_MS,
  HINT_SEEN_KEY,
  hintFor,
  isMacPlatform,
  wheelZooms,
  type HintDevice,
  type HintReason,
  type MapHint,
} from "@/lib/prosjekter/mapHint";

/**
 * The map of Norway on /prosjekter: counties shaded by how many projects they
 * hold, a panel with a county's counts on hover, a click on a county to zoom
 * and filter, and the projects as dots coloured by stage and sized by value,
 * grouped into clusters that split as the map zooms in.
 *
 * Moving it: drag with the mouse; zoom with Ctrl (Cmd) and the wheel, or with
 * the plain wheel once the visitor has clicked into the map; on a phone two
 * fingers pan and pinch while one finger keeps scrolling the page; and the
 * + and - buttons, or the arrow keys and + / - on the focused map. A small
 * helper teaches the gesture for the device when the visitor seems not to
 * know it (see mapHint.ts).
 */

export type PortalMapHandle = {
  /** Zoom to a project and show its card, as a click in the list does. */
  focusProject: (no: number) => void;
  /** Filter to a county and zoom to it, or back to the whole country with null. */
  pickCounty: (code: string | null) => void;
};

const GRATICULE = graticule();
const LOCK_TEXT = "Byggherre, entreprenør, frister og konkurransegrunnlag: for kunder";
const nf = new Intl.NumberFormat("nb-NO");

/** The line under a project saying what clients see; with an action (the way to ask for access) at its end. */
export function LockLine({ action }: { action?: React.ReactNode } = {}) {
  return (
    <span className={styles.lockline}>
      <svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true">
        <rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 5.5V4a2.5 2.5 0 015 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span>{LOCK_TEXT}</span>
      {action}
    </span>
  );
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(HINT_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    window.localStorage.setItem(HINT_SEEN_KEY, "1");
  } catch {
    /* a private window: the hint may show again, which is harmless */
  }
}

function HintArt({ art, modifier }: { art: MapHint["art"]; modifier: MapHint["modifier"] }) {
  if (art === "two-fingers") {
    return (
      <svg className={styles.hintArt} viewBox="0 0 64 64" aria-hidden="true">
        <rect x="6" y="10" width="52" height="44" rx="8" fill="#132a44" stroke="#35507a" />
        <path d="M14 42l10-12 8 7 8-11 10 16" fill="none" stroke="#2b4468" strokeWidth="2" />
        <g className={styles.aFingers}>
          <circle cx="26" cy="34" r="6" fill="rgba(236,230,214,.9)" />
          <circle cx="39" cy="31" r="6" fill="rgba(236,230,214,.9)" />
          <circle cx="26" cy="34" r="9" fill="none" stroke="rgba(236,230,214,.35)" />
          <circle cx="39" cy="31" r="9" fill="none" stroke="rgba(236,230,214,.35)" />
        </g>
      </svg>
    );
  }
  if (art === "ctrl-wheel") {
    return (
      <svg className={styles.hintArt} viewBox="0 0 64 64" aria-hidden="true">
        <g className={styles.aKey}>
          <rect x="3" y="24" width="26" height="18" rx="4" fill="#132a44" stroke="#c9a84c" />
          <text x="16" y="36.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#ece6d6">
            {modifier}
          </text>
        </g>
        <rect x="36" y="14" width="22" height="36" rx="11" fill="none" stroke="#ece6d6" strokeWidth="1.6" />
        <line x1="47" y1="14" x2="47" y2="27" stroke="#35507a" strokeWidth="1.2" />
        <g className={styles.aWheel}>
          <rect x="45.3" y="18" width="3.4" height="7" rx="1.7" fill="#c9a84c" />
        </g>
      </svg>
    );
  }
  return (
    <svg className={styles.hintArt} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 32h10M10 32l4-4M10 32l4 4M54 32H44M54 32l-4-4M54 32l-4 4" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <g className={styles.aDrag}>
        <rect x="23" y="16" width="18" height="30" rx="9" fill="#132a44" stroke="#ece6d6" strokeWidth="1.6" />
        <line x1="32" y1="16" x2="32" y2="27" stroke="#ece6d6" strokeWidth="1.2" />
        <path d="M23.5 26V25a8.5 8.5 0 018.5-8.5V27H23.5z" fill="rgba(201,168,76,.55)" />
      </g>
    </svg>
  );
}

type Props = {
  ref?: Ref<PortalMapHandle>;
  visible: PlacedProject[];
  counts: Record<string, [number, number, number]>;
  county: string | null;
  onPickCounty: (code: string | null) => void;
  hover: number | null;
  onHover: (no: number | null) => void;
  /** A single project's dot was clicked. */
  onSelect: (no: number) => void;
  /** A group of projects was clicked: the list shows those (the owner, 29 September 2026). */
  onCluster?: (nos: number[]) => void;
  /** The last tap on a group: zooming would not split it any further, so its list can open. */
  onLastGroup?: (nos: number[]) => void;
};

export default function PortalMap({ ref, visible, counts, county, onPickCounty, hover, onHover, onSelect, onCluster, onLastGroup }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ w: 800, h: 780 });
  // A county chosen in the address opens zoomed in, without an animation.
  const [view, setView] = useState<View>(() => {
    const target = county ? countyView(county) : null;
    return target ? clampView(target) : FULL_VIEW;
  });
  const viewRef = useRef<View>(view);
  const sizeRef = useRef(size);
  const anim = useRef(0);
  const frame = useRef(0);
  const pending = useRef<View | null>(null);

  const [panelCode, setPanelCode] = useState<string | null>(null);
  const [tipNo, setTipNo] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState<MapHint | null>(null);

  const moved = useRef(false);
  const engaged = useRef(false);
  const suppressClick = useRef(false);
  const hintTimer = useRef(0);
  const mac = useRef(false);

  useEffect(() => {
    mac.current = isMacPlatform(typeof navigator !== "undefined" ? navigator.platform || navigator.userAgent : "");
  }, []);

  /* ---------- size ---------- */
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const read = () => {
      const r = svg.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const next = { w: r.width, h: r.height };
        sizeRef.current = next;
        setSize(next);
      }
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  /* ---------- view changes ---------- */
  const commit = useCallback((v: View) => {
    viewRef.current = v;
    pending.current = v;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (pending.current) setView(pending.current);
      pending.current = null;
    });
  }, []);

  const stopAnim = useCallback(() => {
    cancelAnimationFrame(anim.current);
    anim.current = 0;
  }, []);

  const hideTip = useCallback(() => setTipNo(null), []);

  const animateTo = useCallback(
    (target: View, then?: () => void) => {
      stopAnim();
      hideTip();
      const to = clampView(target);
      const from = viewRef.current;
      if (prefersReducedMotion()) {
        viewRef.current = to;
        setView(to);
        if (then) requestAnimationFrame(then);
        return;
      }
      const t0 = performance.now();
      const dur = 650;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const v = lerpView(from, to, ease(p));
        viewRef.current = v;
        setView(v);
        if (p < 1) anim.current = requestAnimationFrame(step);
        else {
          anim.current = 0;
          then?.();
        }
      };
      anim.current = requestAnimationFrame(step);
    },
    [hideTip, stopAnim],
  );

  const userMoved = useCallback(() => {
    moved.current = true;
  }, []);

  /* ---------- a county picked or cleared: filter and zoom together ---------- */
  const pickCounty = useCallback(
    (code: string | null) => {
      userMoved();
      onPickCounty(code);
      animateTo((code ? countyView(code) : null) ?? FULL_VIEW);
    },
    [animateTo, onPickCounty, userMoved],
  );

  /* ---------- clusters ---------- */
  const geom = viewGeometry(view, size.w, size.h);
  const k = geom.k;
  // Rounded so a pan (same zoom) never regroups; a zoom does.
  const kKey = Math.round(k * 1000) / 1000;
  const clusters = useMemo(() => {
    const list = clusterProjects(visible, 20 * kKey);
    // Big clusters drawn last, on top.
    return list.sort((a, b) => a.members.length - b.members.length || (a.members[0].v ?? 0) - (b.members[0].v ?? 0));
  }, [visible, kKey]);

  const clusterOf = useCallback((no: number): Cluster | undefined => clusters.find((c) => c.members.some((p) => p.no === no)), [clusters]);

  /* ---------- hints ---------- */
  const flashHint = useCallback((device: HintDevice, reason: HintReason) => {
    setHint(hintFor(device, reason, mac.current));
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), HINT_FLASH_MS);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || readSeen()) return;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting);
        window.clearTimeout(timer);
        if (!on || moved.current) return;
        timer = window.setTimeout(() => {
          if (moved.current || readSeen()) return;
          let device: HintDevice = "mouse";
          try {
            device = deviceFrom(
              window.matchMedia("(pointer: coarse)").matches,
              window.matchMedia("(hover: hover)").matches,
            );
          } catch {
            /* keep the mouse */
          }
          writeSeen();
          setHint(hintFor(device, "idle", mac.current, zoomOf(viewRef.current) > 1.01));
          io.disconnect();
        }, HINT_IDLE_MS);
      },
      { threshold: 0.5 },
    );
    io.observe(card);
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  const dismissHint = () => {
    writeSeen();
    window.clearTimeout(hintTimer.current);
    setHint(null);
  };

  /* ---------- mouse and pen: drag ---------- */
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    engaged.current = true;
    const start = { x: e.clientX, y: e.clientY, view: viewRef.current };
    const kStart = viewGeometry(start.view, sizeRef.current.w, sizeRef.current.h).k;
    let isDrag = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!isDrag && Math.hypot(dx, dy) < 4) return;
      if (!isDrag) {
        isDrag = true;
        stopAnim();
        hideTip();
        setDragging(true);
        setHint(null);
        userMoved();
      }
      commit(panBy(start.view, dx * kStart, dy * kStart));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (isDrag) {
        setDragging(false);
        suppressClick.current = true;
        window.setTimeout(() => (suppressClick.current = false), 0);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* ---------- wheel and touch: native listeners, so they can take the gesture from the page ---------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const local = (clientX: number, clientY: number) => {
      const r = svg.getBoundingClientRect();
      return [clientX - r.left, clientY - r.top] as const;
    };

    const onWheel = (e: WheelEvent) => {
      if (!wheelZooms(e, engaged.current)) {
        flashHint("mouse", "wheel");
        return;
      }
      e.preventDefault();
      stopAnim();
      hideTip();
      userMoved();
      setHint(null);
      const [sx, sy] = local(e.clientX, e.clientY);
      const { w, h } = sizeRef.current;
      const [px, py] = screenToMap(viewRef.current, w, h, sx, sy);
      commit(zoomAt(viewRef.current, px, py, wheelFactor(e.deltaY, e.deltaMode)));
    };

    type Pinch = { mid: readonly [number, number]; dist: number; view: View; anchor: [number, number] };
    let pinch: Pinch | null = null;
    let single: { x: number; y: number; warned: boolean } | null = null;
    let gestured = false;

    const two = (t: TouchList) => {
      const a = local(t[0].clientX, t[0].clientY);
      const b = local(t[1].clientX, t[1].clientY);
      return { mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const, dist: Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])) };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        stopAnim();
        hideTip();
        setHint(null);
        const g = two(e.touches);
        const { w, h } = sizeRef.current;
        pinch = { ...g, view: viewRef.current, anchor: screenToMap(viewRef.current, w, h, g.mid[0], g.mid[1]) };
        single = null;
        gestured = true;
      } else if (e.touches.length === 1) {
        single = { x: e.touches[0].clientX, y: e.touches[0].clientY, warned: false };
        gestured = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (pinch && e.touches.length >= 2) {
        e.preventDefault();
        userMoved();
        const g = two(e.touches);
        const { w, h } = sizeRef.current;
        const zoomed = zoomAt(pinch.view, pinch.anchor[0], pinch.anchor[1], g.dist / pinch.dist);
        const k1 = viewGeometry(zoomed, w, h).k;
        commit(panBy(zoomed, (g.mid[0] - pinch.mid[0]) * k1, (g.mid[1] - pinch.mid[1]) * k1));
        return;
      }
      if (single && e.touches.length === 1 && !single.warned) {
        const t = e.touches[0];
        if (Math.hypot(t.clientX - single.x, t.clientY - single.y) > 14) {
          single.warned = true;
          flashHint("touch", "one-finger");
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) {
        single = null;
        if (gestured) {
          suppressClick.current = true;
          window.setTimeout(() => (suppressClick.current = false), 450);
        }
      }
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);
    svg.addEventListener("touchcancel", onTouchEnd);
    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
      svg.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [commit, flashHint, hideTip, stopAnim, userMoved]);

  useEffect(
    () => () => {
      cancelAnimationFrame(anim.current);
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  /* ---------- buttons and keys ---------- */
  const zoomBy = (factor: number) => {
    userMoved();
    const v = viewRef.current;
    animateTo(zoomAt(v, v[0] + v[2] / 2, v[1] + v[3] / 2, factor));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(e.target instanceof Element) || !svgRef.current?.contains(e.target)) return;
    const { w, h } = sizeRef.current;
    const step = 60 * viewGeometry(viewRef.current, w, h).k;
    const pans: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (pans[e.key]) {
      e.preventDefault();
      userMoved();
      hideTip();
      commit(panBy(viewRef.current, pans[e.key][0], pans[e.key][1]));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomBy(1.6);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomBy(1 / 1.6);
    }
  };

  const zoom = zoomOf(view);

  /* ---------- clicks ---------- */
  const guard = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
    return false;
  };

  const onClusterClick = (c: Cluster) => {
    if (c.members.length > 1) {
      onCluster?.(c.members.map((p) => p.no));
      userMoved();
      const xs = c.members.map((p) => p.x);
      const ys = c.members.map((p) => p.y);
      const target = viewAround(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 70);
      animateTo(target);
      if (staysOneGroup(c.members, target, sizeRef.current.w, sizeRef.current.h)) onLastGroup?.(c.members.map((p) => p.no));
      return;
    }
    const p = c.members[0];
    setTipNo(p.no);
    onHover(p.no);
    onCluster?.([p.no]);
    onSelect(p.no);
  };

  useImperativeHandle(
    ref,
    () => ({
      focusProject(no: number) {
        const p = visible.find((q) => q.no === no);
        if (!p) return;
        onHover(no);
        animateTo(viewAround(p.x, p.y, p.x, p.y, 70), () => setTipNo(no));
      },
      pickCounty,
    }),
    [visible, animateTo, onHover, pickCounty],
  );

  /* ---------- the tip card, placed next to its cluster ---------- */
  const tipCluster = tipNo !== null ? clusterOf(tipNo) : undefined;
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const card = cardRef.current;
    if (!tip) return;
    if (!tipCluster || !card) {
      tip.style.left = "-9999px";
      return;
    }
    const [sx, sy] = mapToScreen(view, size.w, size.h, tipCluster.x, tipCluster.y);
    const cw = card.clientWidth;
    const ch = card.clientHeight;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = sx + 18;
    if (x + tw > cw - 12) x = sx - tw - 18;
    x = Math.max(12, Math.min(cw - tw - 12, x));
    const y = Math.max(12, Math.min(ch - th - 12, sy - th / 2));
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }, [tipCluster, view, size]);

  /* ---------- county panel ---------- */
  const totals = useMemo(() => {
    const t: [number, number, number] = [0, 0, 0];
    for (const code of COUNTY_CODES) (counts[code] ?? [0, 0, 0]).forEach((n, i) => (t[i] += n));
    return t;
  }, [counts]);
  const maxCounty = useMemo(
    () => Math.max(1, ...COUNTY_CODES.map((c) => (counts[c] ?? [0, 0, 0]).reduce((a, b) => a + b, 0))),
    [counts],
  );
  const shownCode = panelCode ?? county;
  const panelCounts = shownCode ? (counts[shownCode] ?? [0, 0, 0]) : totals;
  const panelMax = Math.max(1, ...panelCounts);
  const panelRows: [string, string, number][] = [
    ["planned", STAGE_LABEL.planned, panelCounts[0]],
    ["tender", STAGE_LABEL.tender, panelCounts[1]],
    ["awarded", STAGE_LABEL.awarded, panelCounts[2]],
  ];

  const hoverProject = hover !== null ? visible.find((p) => p.no === hover) : undefined;
  const hoverCluster = hover !== null ? clusterOf(hover) : undefined;

  return (
    <div className={styles.mapBlock}>
      <div
        className={styles.mapcard}
        ref={cardRef}
        onKeyDown={onKeyDown}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") {
            engaged.current = false;
            setPanelCode(null);
            if (tipNo !== null && hover === null) hideTip();
          }
        }}
      >
        <svg
          ref={svgRef}
          className={styles.map}
          data-dragging={dragging ? "true" : "false"}
          viewBox={view.join(" ")}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          tabIndex={0}
          aria-label="Kart over Norge med prosjekter per fylke. Piltastene flytter kartet, pluss og minus zoomer."
          onPointerDown={onPointerDown}
          onClickCapture={(e) => {
            guard(e);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) hideTip();
          }}
        >
          <defs>
            <filter id="pm-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dx="0" dy="8" />
              <feComponentTransfer>
                <feFuncA type="linear" slope=".55" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g aria-hidden="true">
            {GRATICULE.lat.map((l) => (
              <g key={l.label}>
                <path d={l.d} className={styles.grat} vectorEffect="non-scaling-stroke" />
                <text x={l.lx} y={l.ly} className={styles.gratLabel}>
                  {l.label}
                </text>
              </g>
            ))}
            {GRATICULE.lon.map((d, i) => (
              <path key={i} d={d} className={styles.grat} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={GRATICULE.polar.d} className={styles.polar} vectorEffect="non-scaling-stroke" />
            <text x={GRATICULE.polar.lx} y={GRATICULE.polar.ly} className={styles.polarLabel}>
              POLARSIRKELEN
            </text>
          </g>
          <g filter="url(#pm-shadow)">
            <g transform="translate(2.5 5)" aria-hidden="true">
              {COUNTY_CODES.map((code) => (
                <path key={code} d={COUNTIES[code].d} fill="#060b14" />
              ))}
            </g>
            <g
              onMouseOver={(e) => {
                const code = (e.target as Element).getAttribute?.("data-code");
                if (code) setPanelCode(code);
              }}
              onMouseOut={(e) => {
                const next = e.relatedTarget as Node | null;
                if (!next || !(e.currentTarget as Node).contains(next)) setPanelCode(null);
              }}
            >
              {COUNTY_CODES.map((code) => {
                const c = counts[code] ?? [0, 0, 0];
                const total = c[0] + c[1] + c[2];
                const cls = [styles.county, county === code ? styles.countySel : "", county && county !== code ? styles.countyDim : ""]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <path
                    key={code}
                    d={COUNTIES[code].d}
                    data-code={code}
                    className={cls}
                    style={{ "--fill": countyFill(total, maxCounty) } as React.CSSProperties}
                    vectorEffect="non-scaling-stroke"
                    tabIndex={0}
                    role="button"
                    aria-pressed={county === code}
                    aria-label={`${COUNTIES[code].n}: ${nf.format(total)} prosjekter`}
                    onFocus={() => setPanelCode(code)}
                    onBlur={() => setPanelCode(null)}
                    onClick={() => pickCounty(county === code ? null : code)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickCounty(county === code ? null : code);
                      }
                    }}
                  />
                );
              })}
            </g>
          </g>
          <g>
            {clusters.map((c) => {
              const hl = hoverCluster === c;
              const key = `${c.members[0].no}`;
              const common = {
                className: `${styles.mk} ${hl ? styles.mkHl : ""}`,
                transform: `translate(${c.x} ${c.y})`,
                onMouseEnter: () => {
                  setTipNo(c.members[0].no);
                  if (c.members.length === 1) onHover(c.members[0].no);
                },
                onMouseLeave: () => {
                  hideTip();
                  onHover(null);
                },
                onClick: () => onClusterClick(c),
              };
              if (c.members.length === 1) {
                const p = c.members[0];
                const r = dotRadius(p.v) * k;
                return (
                  <g key={key} {...common} aria-hidden="true">
                    <circle r={r * 1.9} fill={STAGE_HEX[p.st]} className={styles.mkHalo} />
                    <circle r={r} fill={STAGE_HEX[p.st]} className={styles.mkCore} vectorEffect="non-scaling-stroke" />
                  </g>
                );
              }
              const r = (11 + Math.min(7, c.members.length)) * k;
              const rr = r - 2.2 * k;
              const C = 2 * Math.PI * rr;
              const counted = clusterStages(c);
              let off = 0;
              return (
                <g key={key} {...common} aria-hidden="true">
                  <circle r={r * 1.5} fill="#c9a84c" className={styles.mkHalo} opacity=".1" />
                  <circle r={r} fill="#0b1422" className={styles.mkCore} vectorEffect="non-scaling-stroke" />
                  {STAGES.map((s) => {
                    const n = counted[s];
                    if (!n) return null;
                    const len = (C * n) / c.members.length;
                    const el = (
                      <circle
                        key={s}
                        r={rr}
                        fill="none"
                        stroke={STAGE_HEX[s]}
                        strokeWidth={3.2 * k}
                        strokeDasharray={`${Math.max(0, len - 1.4 * k)} ${C - len + 1.4 * k}`}
                        strokeDashoffset={-off}
                        transform="rotate(-90)"
                      />
                    );
                    off += len;
                    return el;
                  })}
                  <text className={styles.cnum} fontSize={11 * k}>
                    {c.members.length}
                  </text>
                </g>
              );
            })}
          </g>
          {hoverProject ? (
            <circle
              className={styles.ring}
              cx={hoverProject.x}
              cy={hoverProject.y}
              r={(dotRadius(hoverProject.v) + 6) * k}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        <div className={styles.panelCounty} aria-live="polite">
          <h3>{shownCode ? COUNTIES[shownCode]?.n : "Hele Norge"}</h3>
          <div className={styles.pcTot}>
            <span className={styles.num}>{nf.format(panelCounts[0] + panelCounts[1] + panelCounts[2])}</span> prosjekter
          </div>
          {panelRows.map(([s, label, n]) => (
            <div key={s} className={styles.pcRow} style={{ "--c": `var(--st-${s})` } as React.CSSProperties}>
              <span className={styles.dot} />
              <span>{label}</span>
              <span className={styles.num}>{nf.format(n)}</span>
              <span className={styles.pcBar}>
                <i style={{ width: `${((100 * n) / panelMax).toFixed(1)}%` }} />
              </span>
            </div>
          ))}
        </div>

        <div className={styles.mapTools}>
          <button
            type="button"
            className={styles.tool}
            onClick={() => pickCounty(null)}
          >
            Hele landet
          </button>
          <button
            type="button"
            className={styles.tool}
            onClick={() => {
              userMoved();
              animateTo(southView());
            }}
          >
            Sør-Norge
          </button>
          <div className={styles.zoomPair}>
            <button type="button" aria-label="Zoom inn" disabled={zoom >= MAX_ZOOM * 0.99} onClick={() => zoomBy(1.6)}>
              +
            </button>
            <button type="button" aria-label="Zoom ut" disabled={zoom <= 1.001} onClick={() => zoomBy(1 / 1.6)}>
              {"−"}
            </button>
          </div>
        </div>

        <div className={styles.legend} aria-hidden="true">
          <span>
            <span className={styles.dot} style={{ "--c": "var(--st-planned)" } as React.CSSProperties} />
            Planlagt
          </span>
          <span>
            <span className={styles.dot} style={{ "--c": "var(--st-tender)" } as React.CSSProperties} />
            Åpen
          </span>
          <span>
            <span className={styles.dot} style={{ "--c": "var(--st-closed)" } as React.CSSProperties} />
            Venter
          </span>
          <span>
            <span className={styles.dot} style={{ "--c": "var(--st-awarded)" } as React.CSSProperties} />
            Tildelt
          </span>
          <span className={styles.legendSz}>
            <i style={{ width: 7, height: 7 }} />
            <i style={{ width: 12, height: 12 }} />
            <i style={{ width: 18, height: 18 }} />
            &nbsp;verdi
          </span>
        </div>
        {hint ? null : <div className={styles.mapHintCorner}>Klikk et fylke for å filtrere</div>}

        {hint ? (
          <div className={styles.hint} role="status">
            <HintArt art={hint.art} modifier={hint.modifier} />
            <div>
              <h4>{hint.title}</h4>
              <p>{hint.text}</p>
              <button type="button" className={styles.hintBtn} onClick={dismissHint}>
                Skjønner
              </button>
            </div>
          </div>
        ) : null}

        <div
          ref={tipRef}
          className={`${styles.tip} ${tipCluster ? styles.tipOn : ""}`}
          style={{ left: -9999, top: 0 }}
          role="status"
        >
          {tipCluster ? <TipBody c={tipCluster} /> : null}
        </div>
      </div>
      <p className={styles.credit}>Kartdata: © Kartverket</p>
    </div>
  );
}

function TipBody({ c }: { c: Cluster }) {
  if (c.members.length === 1) {
    const p = c.members[0];
    const value = mnok(p.v);
    return (
      <>
        <span className={styles.pill} style={{ "--c": STAGE_HEX[p.st] } as React.CSSProperties}>
          {STAGE_LABEL[p.st]}
        </span>
        <h4>{p.t}</h4>
        <div className={styles.meta}>{[p.c, COUNTIES[p.r]?.n].filter(Boolean).join(" · ")}</div>
        {value || p.k ? (
          <div className={styles.tipRow}>
            <span className={styles.num}>{value ? `${value} MNOK` : ""}</span>
            <span style={{ color: "var(--text-2)" }}>{p.k ?? ""}</span>
          </div>
        ) : null}
        <LockLine />
      </>
    );
  }
  const towns = [...new Set(c.members.map((p) => p.c).filter((t): t is string => Boolean(t)))];
  return (
    <>
      <span className={styles.tag}>{c.members.length} prosjekter</span>
      <h4>
        {towns.length ? towns.slice(0, 3).join(", ") : COUNTIES[c.members[0].r]?.n ?? ""}
        {towns.length > 3 ? " m.fl." : ""}
      </h4>
      <ul className={styles.tipList}>
        {c.members.slice(0, 4).map((p) => (
          <li key={p.no}>
            <span className={styles.dot} style={{ "--c": STAGE_HEX[p.st] } as React.CSSProperties} />
            <span>{p.t}</span>
            <span className={styles.num} style={{ color: "var(--text-2)" }}>
              {mnok(p.v) ?? ""}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.meta} style={{ marginTop: 6 }}>
        {c.members.length > 4 ? `+ ${c.members.length - 4} til. Klikk for å se dem i listen.` : "Klikk for å se dem i listen."}
      </div>
    </>
  );
}
