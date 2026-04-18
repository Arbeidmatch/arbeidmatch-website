"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  candidatesRegisteredToday: number;
  activeOnSiteNow: number;
  totalVisits: number;
};

const STORAGE_VISITS = "arbeid_visits";
const STORAGE_CANDIDATES = "arbeid_candidates_today";
const STORAGE_CANDIDATES_DATE = "arbeid_candidates_date";
const TOTAL_VISITS_BASE = 94_284;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getLocalDateKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCandidatesBaseForDate(now: Date): number {
  const raw = Math.round(now.getDate() * 0.6);
  return Math.max(1, Math.min(18, raw));
}

/** B2B-scale hourly band for “active now” (before global clamp). */
function getActiveRangeByHour(hour: number): { min: number; max: number } {
  if (hour >= 0 && hour <= 6) return { min: 2, max: 6 }; // night 00-07 (hours 0-6)
  if (hour >= 7 && hour < 10) return { min: 8, max: 15 }; // morning 07-10
  if (hour >= 10 && hour < 17) return { min: 12, max: 28 }; // day 10-17
  if (hour >= 17 && hour < 22) return { min: 8, max: 18 }; // evening 17-22
  return { min: 4, max: 10 }; // late 22-00
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** ease-out-expo — slow dramatic finish */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function SmoothNumber({
  value,
  run,
  durationMs,
  delayMs = 0,
  suffix = "",
}: {
  value: number;
  run: boolean;
  durationMs: number;
  /** Stagger count-up start vs previous stat (ms). */
  delayMs?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const [tickPulse, setTickPulse] = useState(false);
  const previousTargetRef = useRef(0);

  useEffect(() => {
    if (!run) return;

    const from = previousTargetRef.current;
    const to = Math.max(0, Math.floor(value));
    previousTargetRef.current = to;

    if (from === to) {
      setDisplay(to);
      return;
    }

    setTickPulse(true);
    const pulseTimer = window.setTimeout(() => setTickPulse(false), 400);
    let raf = 0;
    const startAt = performance.now() + delayMs;

    const animate = (now: number) => {
      if (now < startAt) {
        raf = window.requestAnimationFrame(animate);
        return;
      }
      const elapsed = now - startAt;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutExpo(t);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        raf = window.requestAnimationFrame(animate);
      } else {
        setDisplay(to);
      }
    };

    raf = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(pulseTimer);
    };
  }, [value, run, durationMs, delayMs]);

  return (
    <span
      className={`inline-block tabular-nums transition-all duration-[400ms] ease-[ease] ${
        tickPulse ? "scale-[1.02] opacity-95" : "scale-100 opacity-100"
      }`}
    >
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Hero navy grid: modeled daily signups + static placement stats + linked live-style metrics.
 */
export default function HeroStatsPanel({
  candidatesRegisteredToday: _candidatesRegisteredToday,
  activeOnSiteNow: _activeOnSiteNow,
  totalVisits: _totalVisits,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [runNumbers, setRunNumbers] = useState(false);
  const [candidatesToday, setCandidatesToday] = useState(0);
  const [activeNow, setActiveNow] = useState(12);
  const [totalVisits, setTotalVisits] = useState(TOTAL_VISITS_BASE);

  // Run count-up once when panel enters viewport.
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRunNumbers(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const now = new Date();
    const todayKey = getLocalDateKey(now);
    const baseCandidates = getCandidatesBaseForDate(now);

    const storedDate = window.localStorage.getItem(STORAGE_CANDIDATES_DATE);
    const storedCandidatesRaw = window.localStorage.getItem(STORAGE_CANDIDATES);
    const storedVisitsRaw = window.localStorage.getItem(STORAGE_VISITS);

    const restoredCandidates = storedCandidatesRaw ? Number.parseInt(storedCandidatesRaw, 10) : Number.NaN;
    const safeCandidates =
      storedDate === todayKey && Number.isFinite(restoredCandidates)
        ? Math.max(baseCandidates, restoredCandidates)
        : baseCandidates;
    setCandidatesToday(safeCandidates);
    window.localStorage.setItem(STORAGE_CANDIDATES_DATE, todayKey);
    window.localStorage.setItem(STORAGE_CANDIDATES, String(safeCandidates));

    const restoredVisits = storedVisitsRaw ? Number.parseInt(storedVisitsRaw, 10) : TOTAL_VISITS_BASE;
    const safeVisits = Number.isFinite(restoredVisits) ? Math.max(TOTAL_VISITS_BASE, restoredVisits) : TOTAL_VISITS_BASE;
    setTotalVisits(safeVisits);
    window.localStorage.setItem(STORAGE_VISITS, String(safeVisits));

    const activeRange = getActiveRangeByHour(now.getHours());
    const seed = clamp(randomInt(6, 18), activeRange.min, activeRange.max);
    setActiveNow(seed);
  }, []);

  useEffect(() => {
    let nextAt = Date.now() + randomInt(90, 180) * 1000;
    const intervalId = window.setInterval(() => {
      const now = new Date();
      const todayKey = getLocalDateKey(now);
      const storedDate = window.localStorage.getItem(STORAGE_CANDIDATES_DATE);
      const baseCandidates = getCandidatesBaseForDate(now);

      if (storedDate !== todayKey) {
        setCandidatesToday(baseCandidates);
        window.localStorage.setItem(STORAGE_CANDIDATES_DATE, todayKey);
        window.localStorage.setItem(STORAGE_CANDIDATES, String(baseCandidates));
        nextAt = Date.now() + randomInt(90, 180) * 1000;
        return;
      }

      if (Date.now() >= nextAt) {
        setCandidatesToday((prev) => {
          const next = prev + 1;
          window.localStorage.setItem(STORAGE_CANDIDATES, String(next));
          return next;
        });
        nextAt = Date.now() + randomInt(90, 180) * 1000;
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let nextAt = Date.now() + randomInt(15, 25) * 1000;
    const intervalId = window.setInterval(() => {
      if (Date.now() < nextAt) return;

      const now = new Date();
      const range = getActiveRangeByHour(now.getHours());
      const delta = Math.random() < 0.5 ? -1 : 1;

      setActiveNow((prev) => {
        const nudged = prev + delta;
        const inBand = clamp(nudged, range.min, range.max);
        return clamp(inBand, 2, 35);
      });

      nextAt = Date.now() + randomInt(15, 25) * 1000;
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let nextAt = Date.now() + randomInt(18, 35) * 1000;
    const intervalId = window.setInterval(() => {
      if (Date.now() < nextAt) return;

      setTotalVisits((prev) => {
        const next = prev + 1;
        window.localStorage.setItem(STORAGE_VISITS, String(next));
        return next;
      });

      nextAt = Date.now() + randomInt(18, 35) * 1000;
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const staticMetrics = useMemo(
    () => [
      { value: 200, suffix: "+", label: "Candidates placed" },
      { value: 30, suffix: "+", label: "Active clients" },
      { value: 8, suffix: "+", label: "EU countries" },
    ],
    [],
  );

  return (
    <div ref={panelRef} className="grid grid-cols-2 gap-6 rounded-xl bg-navy p-10 md:col-span-2">
      <div className="col-span-2 border-b border-white/10 pb-6">
        <p className="font-mono text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <SmoothNumber value={candidatesToday} run={runNumbers} durationMs={2000} delayMs={0} />
        </p>
        <p className="mt-2 text-sm text-white">Candidates registered today</p>
      </div>
      {staticMetrics.map((item, i) => (
        <div key={item.label}>
          <p className="font-mono text-4xl font-bold text-gold">
            <SmoothNumber
              value={item.value}
              suffix={item.suffix}
              run={runNumbers}
              durationMs={2000}
              delayMs={150 * (i + 1)}
            />
          </p>
          <p className="text-sm text-white">{item.label}</p>
        </div>
      ))}
      <div>
        <p className="font-mono text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <SmoothNumber value={activeNow} run={runNumbers} durationMs={2000} delayMs={450} />
        </p>
        <p className="mt-2 text-sm text-white">Active on site now</p>
      </div>
      <div className="col-span-2 border-t border-white/10 pt-6">
        <p className="font-mono text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <SmoothNumber value={totalVisits} run={runNumbers} durationMs={2600} delayMs={600} />
        </p>
        <p className="mt-2 text-sm text-white">Total visits</p>
      </div>
    </div>
  );
}
