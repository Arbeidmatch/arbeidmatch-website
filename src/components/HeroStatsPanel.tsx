"use client";

import AnimatedNumber from "@/components/AnimatedNumber";

type Props = {
  candidatesRegisteredToday: number;
  activeOnSiteNow: number;
  totalVisits: number;
};

/**
 * Hero navy grid: modeled daily signups + static placement stats + linked live-style metrics.
 */
export default function HeroStatsPanel({
  candidatesRegisteredToday,
  activeOnSiteNow,
  totalVisits,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 rounded-xl bg-navy p-10 md:col-span-2">
      <div className="col-span-2 border-b border-white/10 pb-6">
        <p className="text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <AnimatedNumber value={candidatesRegisteredToday} durationMs={2000} />
        </p>
        <p className="mt-2 text-sm text-white">Candidates registered today</p>
      </div>
      {[
        ["500+", "Placements"],
        ["50+", "Active clients"],
        ["10+", "EU countries"],
      ].map(([number, label]) => (
        <div key={label}>
          <p className="text-4xl font-bold text-gold">{number}</p>
          <p className="text-sm text-white">{label}</p>
        </div>
      ))}
      <div>
        <p className="text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <AnimatedNumber value={activeOnSiteNow} durationMs={2000} />
        </p>
        <p className="mt-2 text-sm text-white">Active on site now</p>
      </div>
      <div className="col-span-2 border-t border-white/10 pt-6">
        <p className="text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <AnimatedNumber value={totalVisits} durationMs={2000} />
        </p>
        <p className="mt-2 text-sm text-white">Total visits</p>
      </div>
    </div>
  );
}
