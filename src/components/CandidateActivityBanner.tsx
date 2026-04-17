import type { CandidateActivityStats } from "@/lib/candidateActivityStats";
import CandidateActivityMetrics from "@/components/CandidateActivityMetrics";

type Props = {
  stats: CandidateActivityStats;
};

/**
 * Candidate activity strip for the home page. Metrics use client count-up when in view.
 */
export default function CandidateActivityBanner({ stats }: Props) {
  return (
    <section className="border-y border-[#f59e0b]/30 bg-[#0f172a] py-10">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <div className="overflow-hidden rounded-xl border border-[#f59e0b]/30 bg-[#0f172a] px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.35)] md:px-8 md:py-7">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-5">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.55)]" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-white">Candidate Activity</h2>
            <span className="rounded border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#fbbf24]">
              Live
            </span>
          </div>

          <CandidateActivityMetrics stats={stats} />
        </div>
      </div>
    </section>
  );
}
