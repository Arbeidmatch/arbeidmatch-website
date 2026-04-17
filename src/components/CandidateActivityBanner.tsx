import type { CandidateActivityStats } from "@/lib/candidateActivityStats";

function formatNum(n: number): string {
  return n.toLocaleString();
}

type Props = {
  stats: CandidateActivityStats;
};

/**
 * Server-rendered candidate activity strip for the home page (SEO-friendly).
 */
export default function CandidateActivityBanner({ stats }: Props) {
  const items: { label: string; value: number }[] = [
    { label: "Candidates registered", value: stats.registeredCount },
    { label: "Active on site now", value: stats.activeOnSiteNow },
    { label: "Avg. daily visitors", value: stats.avgDailyVisitors },
  ];

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

          <dl className="mt-6 grid grid-cols-1 md:grid-cols-3 md:gap-0">
            {items.map((item, i) => (
              <div
                key={item.label}
                className={`flex flex-col gap-2 ${
                  i > 0 ? "mt-6 border-t border-white/10 pt-6 md:mt-0 md:border-l md:border-t-0 md:pl-10 md:pt-0" : ""
                }`}
              >
                <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </dt>
                <dd className="text-3xl font-bold tabular-nums tracking-tight text-[#f59e0b] md:text-4xl">
                  {formatNum(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
