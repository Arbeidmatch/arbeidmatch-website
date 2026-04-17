"use client";

import { useEffect, useState } from "react";

type ActivityPayload = {
  registeredCount: number;
  activeOnSiteNow: number;
  avgDailyVisitors: number;
  registeredIsExact?: boolean;
  activeIsEstimated?: boolean;
  avgIsEstimated?: boolean;
};

function formatNum(n: number): string {
  return n.toLocaleString();
}

export default function CandidateActivityCard() {
  const [data, setData] = useState<ActivityPayload | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/eligibility-candidate-activity", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const json = (await res.json()) as ActivityPayload;
        if (!cancelled) {
          setData(json);
          setLoadState("ready");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const registered = data?.registeredCount ?? "—";
  const active = data?.activeOnSiteNow ?? "—";
  const avgDaily = data?.avgDailyVisitors ?? "—";

  return (
    <div
      className="mb-8 overflow-hidden rounded-xl border border-amber-500/20 bg-[#0f172a] px-5 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.35)]"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.55)]" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-white">Candidate Activity</h2>
          <span className="rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/95">
            Live
          </span>
        </div>
      </div>

      <dl className="mt-4 space-y-0 divide-y divide-white/10">
        <div className="grid grid-cols-1 gap-1 py-4 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6">
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Candidates registered
          </dt>
          <dd className="text-2xl font-bold tabular-nums tracking-tight text-amber-500 sm:text-right sm:text-3xl">
            {loadState === "loading" ? (
              <span className="inline-block h-8 w-24 animate-pulse rounded bg-white/10" />
            ) : loadState === "error" ? (
              "—"
            ) : (
              formatNum(typeof registered === "number" ? registered : 0)
            )}
          </dd>
        </div>

        <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6">
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Active on site now
          </dt>
          <dd className="text-2xl font-bold tabular-nums tracking-tight text-amber-500 sm:text-right sm:text-3xl">
            {loadState === "loading" ? (
              <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" />
            ) : loadState === "error" ? (
              "—"
            ) : (
              formatNum(typeof active === "number" ? active : 0)
            )}
          </dd>
        </div>

        <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6">
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Avg. daily visitors
          </dt>
          <dd className="text-2xl font-bold tabular-nums tracking-tight text-amber-500 sm:text-right sm:text-3xl">
            {loadState === "loading" ? (
              <span className="inline-block h-8 w-20 animate-pulse rounded bg-white/10" />
            ) : loadState === "error" ? (
              "—"
            ) : (
              formatNum(typeof avgDaily === "number" ? avgDaily : 0)
            )}
          </dd>
        </div>
      </dl>

    </div>
  );
}
