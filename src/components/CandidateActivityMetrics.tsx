"use client";

import { useEffect, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";

const CANDIDATES_TODAY_KEY = "arbeid_candidates_today";
const CANDIDATES_DATE_KEY = "arbeid_candidates_date";
const VISITS_KEY = "arbeid_visits";
const BASE_VISITS = 1_696_528;
const ACTIVE_MIN = 140;
const ACTIVE_MAX = 280;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function todayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daySeed(now: Date): number {
  return now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function randomDelayMs(minSec: number, maxSec: number): number {
  return Math.floor((minSec + Math.random() * (maxSec - minSec)) * 1000);
}

function initialCandidatesToday(now: Date): number {
  return Math.round(now.getDate() * 1.3);
}

function initialActiveOnSite(now: Date): number {
  const seed = daySeed(now) + now.getHours() * 37;
  const normalized = (Math.sin(seed) + 1) / 2;
  return clamp(Math.round(ACTIVE_MIN + normalized * (ACTIVE_MAX - ACTIVE_MIN)), ACTIVE_MIN, ACTIVE_MAX);
}

function readOrInitCandidatesToday(now: Date): number {
  const currentDate = todayKey(now);
  const storedDate = window.localStorage.getItem(CANDIDATES_DATE_KEY);
  const storedValue = Number(window.localStorage.getItem(CANDIDATES_TODAY_KEY) || "");

  if (storedDate === currentDate && Number.isFinite(storedValue) && storedValue >= 0) {
    return storedValue;
  }

  const next = initialCandidatesToday(now);
  window.localStorage.setItem(CANDIDATES_DATE_KEY, currentDate);
  window.localStorage.setItem(CANDIDATES_TODAY_KEY, String(next));
  return next;
}

function readOrInitVisits(): number {
  const storedValue = Number(window.localStorage.getItem(VISITS_KEY) || "");
  if (Number.isFinite(storedValue) && storedValue > 0) return Math.floor(storedValue);
  window.localStorage.setItem(VISITS_KEY, String(BASE_VISITS));
  return BASE_VISITS;
}

export default function CandidateActivityMetrics() {
  const [candidatesToday, setCandidatesToday] = useState(0);
  const [activeOnSite, setActiveOnSite] = useState(0);
  const [totalVisits, setTotalVisits] = useState(BASE_VISITS);

  useEffect(() => {
    const now = new Date();
    setCandidatesToday(readOrInitCandidatesToday(now));
    setActiveOnSite(initialActiveOnSite(now));
    setTotalVisits(readOrInitVisits());
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const now = new Date();
      const next = readOrInitCandidatesToday(now) + 1;
      window.localStorage.setItem(CANDIDATES_TODAY_KEY, String(next));
      setCandidatesToday(next);
      timeoutId = setTimeout(tick, randomDelayMs(45, 90));
    };

    timeoutId = setTimeout(tick, randomDelayMs(45, 90));
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const deltas = [-2, -1, 1, 2] as const;
      const delta = deltas[Math.floor(Math.random() * deltas.length)];
      setActiveOnSite((prev) => clamp(prev + delta, ACTIVE_MIN, ACTIVE_MAX));
      timeoutId = setTimeout(tick, randomDelayMs(8, 15));
    };

    timeoutId = setTimeout(tick, randomDelayMs(8, 15));
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setTotalVisits((prev) => {
        const next = prev + 1;
        window.localStorage.setItem(VISITS_KEY, String(next));
        return next;
      });
      timeoutId = setTimeout(tick, randomDelayMs(12, 20));
    };

    timeoutId = setTimeout(tick, randomDelayMs(12, 20));
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const items: { label: string; value: number }[] = [
    { label: "Candidates registered today", value: candidatesToday },
    { label: "Active on site now", value: activeOnSite },
    { label: "Total visits", value: totalVisits },
  ];

  return (
    <dl className="mt-6 grid grid-cols-1 md:grid-cols-3 md:gap-0">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex flex-col gap-2 ${
            i > 0 ? "mt-6 border-t border-white/10 pt-6 md:mt-0 md:border-l md:border-t-0 md:pl-10 md:pt-0" : ""
          }`}
        >
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(255,255,255,0.5)]">{item.label}</dt>
          <dd className="text-3xl font-bold tabular-nums tracking-tight text-[#f59e0b] md:text-4xl">
            <AnimatedNumber value={item.value} durationMs={1500} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
