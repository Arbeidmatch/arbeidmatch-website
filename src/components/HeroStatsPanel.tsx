"use client";

import AnimatedNumber from "@/components/AnimatedNumber";

type Props = {
  /** Total from DB (e.g. guide_interest_signups count). */
  registeredCount: number;
};

/**
 * Hero navy grid: primary candidate pool (animated) + static placement stats.
 */
export default function HeroStatsPanel({ registeredCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 rounded-xl bg-navy p-10 md:col-span-2">
      <div className="col-span-2 border-b border-white/10 pb-6">
        <p className="text-4xl font-bold tabular-nums text-gold md:text-5xl">
          <AnimatedNumber value={registeredCount} durationMs={2000} suffix="+" />
        </p>
        <p className="mt-2 text-sm text-white">Candidates</p>
      </div>
      {[
        ["500+", "Placements"],
        ["50+", "Active clients"],
        ["10+", "EU countries"],
        ["2 wks", "Avg. delivery"],
      ].map(([number, label]) => (
        <div key={label}>
          <p className="text-4xl font-bold text-gold">{number}</p>
          <p className="text-sm text-white">{label}</p>
        </div>
      ))}
    </div>
  );
}
