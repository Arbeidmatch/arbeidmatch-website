import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Outside the EU/EEA? | ArbeidMatch",
  description:
    "ArbeidMatch connects EU/EEA candidates with Norwegian employers. We do not offer job placements outside the EU/EEA; our guides explain Norwegian requirements and processes.",
  robots: { index: false, follow: false },
};

export default function NonEuCandidatesPage() {
  return (
    <div className="min-h-dvh bg-[#0D1B2A] text-white">
      <div className="container-site py-12 sm:py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">ArbeidMatch</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.5rem] md:leading-tight">
          Outside the EU/EEA?
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          ArbeidMatch currently connects EU/EEA candidates with Norwegian employers. We do not have job placements
          available for candidates outside the EU/EEA at this time.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          However, if you are interested in working in Norway, our guides can help you understand the process and
          requirements.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/premium"
            className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] bg-[#C9A84C] px-8 text-sm font-bold text-[#0D1B2A] shadow-[0_12px_32px_rgba(201,168,76,0.28)] transition-colors hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A] sm:w-auto"
          >
            Browse our guides
          </Link>
          <Link
            href="/for-candidates"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[12px] border border-[#C9A84C]/45 px-6 text-sm font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)] sm:w-auto"
          >
            Back to candidate overview
          </Link>
        </div>
      </div>
    </div>
  );
}
