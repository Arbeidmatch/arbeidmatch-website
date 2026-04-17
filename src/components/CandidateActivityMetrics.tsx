"use client";

import type { CandidateActivityStats } from "@/lib/candidateActivityStats";
import AnimatedNumber from "@/components/AnimatedNumber";

type Props = {
  stats: CandidateActivityStats;
};

export default function CandidateActivityMetrics({ stats }: Props) {
  const items: { label: string; value: number }[] = [
    { label: "Candidates registered", value: stats.registeredCount },
    { label: "Active on site now", value: stats.activeOnSiteNow },
    { label: "Avg. daily visitors", value: stats.avgDailyVisitors },
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
          <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{item.label}</dt>
          <dd className="text-3xl font-bold tabular-nums tracking-tight text-[#f59e0b] md:text-4xl">
            <AnimatedNumber value={item.value} durationMs={2000} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
