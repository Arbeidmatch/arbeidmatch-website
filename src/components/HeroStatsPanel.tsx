"use client";

import { useEffect, useRef, useState } from "react";

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

const ACTIVE_GLOBAL_MIN = 8;
const ACTIVE_GLOBAL_MAX = 35;

function getLocalDateKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCandidatesBaseForDate(now: Date): number {
  const raw = Math.round(now.getDate() * 0.6);
  return Math.max(1, Math.min(18, raw));
}

/** Hourly band for “active on site now” (local hour). */
function getActiveRangeByHour(hour: number): { min: number; max: number } {
  if (hour >= 0 && hour <= 6) return { min: 8, max: 15 }; // night 00–07
  if (hour >= 7 && hour <= 9) return { min: 15, max: 25 }; // morning 07–10
  if (hour >= 10 && hour <= 16) return { min: 20, max: 35 }; // day 10–17
  if (hour >= 17 && hour <= 21) return { min: 15, max: 28 }; // evening 17–22
  return { min: 10, max: 18 }; // late 22–00
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function SmoothNumber({
  value,
  run,
  instant,
  durationMs,
  delayMs = 0,
  suffix = "",
}: {
  value: number;
  run: boolean;
  instant?: boolean;
  durationMs: number;
  delayMs?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const [tickPulse, setTickPulse] = useState(false);
  const previousTargetRef = useRef(0);

  useEffect(() => {
    if (!run) return;

    const to = Math.max(0, Math.floor(value));

    if (instant) {
      previousTargetRef.current = to;
      setDisplay(to);
      return;
    }

    const from = previousTargetRef.current;
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
  }, [value, run, instant, durationMs, delayMs]);

  return (
    <span
      className={`inline-block tabular-nums transition-opacity duration-[400ms] ease-[ease] ${
        tickPulse ? "opacity-95" : "opacity-100"
      }`}
    >
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

function readVisitsFromStorage(): number {
  if (typeof window === "undefined") return TOTAL_VISITS_BASE;
  const stored = window.localStorage.getItem(STORAGE_VISITS);
  if (!stored) return TOTAL_VISITS_BASE;
  const n = Number.parseInt(stored, 10);
  return Number.isFinite(n) ? n : TOTAL_VISITS_BASE;
}

/**
 * Hero navy grid: daily signups + static placement stats + active band + persistent total visits.
 */
export default function HeroStatsPanel({
  candidatesRegisteredToday: _candidatesRegisteredToday,
  activeOnSiteNow: _activeOnSiteNow,
  totalVisits: _totalVisits,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const activeNowRef = useRef(12);
  const [runNumbers, setRunNumbers] = useState(false);
  const [countInstant, setCountInstant] = useState(false);
  const [candidatesToday, setCandidatesToday] = useState(0);
  const [activeNow, setActiveNow] = useState(12);
  const [totalVisits, setTotalVisits] = useState(TOTAL_VISITS_BASE);

  useEffect(() => {
    activeNowRef.current = activeNow;
  }, [activeNow]);

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((e) => e.isIntersecting);
        if (!entry) return;

        const rect = entry.boundingClientRect;
        const vh = window.innerHeight;
        const alreadyInUpperViewport = rect.top >= 0 && rect.top < vh * 0.55;
        setCountInstant(alreadyInUpperViewport);
        setRunNumbers(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTotalVisits(readVisitsFromStorage());
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return;
      const fresh = window.localStorage.getItem(STORAGE_VISITS);
      if (!fresh) return;
      const n = Number.parseInt(fresh, 10);
      if (Number.isFinite(n)) setTotalVisits(n);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let alive = true;
    let tid: number | undefined;

    const schedule = () => {
      tid = window.setTimeout(() => {
        if (!alive) return;
        setTotalVisits((currentVisits) => {
          const increment =
            Math.floor(Math.random() * Math.max(1, Math.floor(activeNowRef.current * 0.3))) + 1;
          const newVisits = currentVisits + increment;
          window.localStorage.setItem(STORAGE_VISITS, String(newVisits));
          return newVisits;
        });
        schedule();
      }, randomInt(20, 40) * 1000);
    };

    schedule();
    return () => {
      alive = false;
      if (tid !== undefined) window.clearTimeout(tid);
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const todayKey = getLocalDateKey(now);
    const baseCandidates = getCandidatesBaseForDate(now);

    const storedDate = window.localStorage.getItem(STORAGE_CANDIDATES_DATE);
    const storedCandidatesRaw = window.localStorage.getItem(STORAGE_CANDIDATES);

    const restoredCandidates = storedCandidatesRaw ? Number.parseInt(storedCandidatesRaw, 10) : Number.NaN;
    const safeCandidates =
      storedDate === todayKey && Number.isFinite(restoredCandidates)
        ? Math.max(baseCandidates, restoredCandidates)
        : baseCandidates;
    setCandidatesToday(safeCandidates);
    window.localStorage.setItem(STORAGE_CANDIDATES_DATE, todayKey);
    window.localStorage.setItem(STORAGE_CANDIDATES, String(safeCandidates));

    const activeRange = getActiveRangeByHour(now.getHours());
    const seed = clamp(randomInt(activeRange.min, activeRange.max), ACTIVE_GLOBAL_MIN, ACTIVE_GLOBAL_MAX);
    setActiveNow(seed);
    activeNowRef.current = seed;
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
        const bounded = clamp(nudged, range.min, range.max);
        return clamp(bounded, ACTIVE_GLOBAL_MIN, ACTIVE_GLOBAL_MAX);
      });

      nextAt = Date.now() + randomInt(15, 25) * 1000;
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div ref={panelRef} className="grid grid-cols-2 gap-6 rounded-xl bg-navy p-10">
      <div className="col-span-2 border-b border-white/10 pb-6">
        <p className="font-mono text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <SmoothNumber
            value={candidatesToday}
            run={runNumbers}
            instant={countInstant}
            durationMs={2000}
            delayMs={0}
          />
        </p>
        <p className="mt-2 text-sm text-white">Candidates registered today</p>
      </div>

      <div>
        <p className="font-mono text-4xl font-bold text-gold">30</p>
        <p className="text-sm text-white">EU/EEA countries</p>
      </div>
      <div>
        <p className="font-mono text-4xl font-bold text-gold">200+</p>
        <p className="text-sm text-white">Candidates placed</p>
      </div>
      <div>
        <p className="font-mono text-4xl font-bold text-gold">30+</p>
        <p className="text-sm text-white">Active clients</p>
      </div>

      <div>
        <p className="font-mono text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <SmoothNumber value={activeNow} run={runNumbers} instant={countInstant} durationMs={2000} delayMs={450} />
        </p>
        <p className="mt-2 text-sm text-white">Active on site now</p>
      </div>

      <div className="col-span-2 border-t border-white/10 pt-6">
        <p className="font-mono text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <SmoothNumber
            value={totalVisits}
            run={runNumbers}
            instant={countInstant}
            durationMs={2600}
            delayMs={600}
          />
        </p>
        <p className="mt-2 text-sm text-white">Total visits</p>
      </div>
    </div>
  );
}