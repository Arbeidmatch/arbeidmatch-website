"use client";

import Link from "next/link";

export default function CandidateFeedbackPill() {
  return (
    <Link
      href="/feedback"
      className="candidate-feedback-pill fixed bottom-[90px] right-4 z-[80] max-w-[160px] origin-bottom-right scale-90 overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-[rgba(184,134,11,0.2)] bg-[rgba(10,12,20,0.8)] px-3 py-[6px] text-center text-[11px] leading-snug text-[#888] opacity-50 transition-all duration-300 ease-in-out hover:scale-100 hover:opacity-100 hover:text-gold"
      title="Share feedback about your candidate experience"
    >
      Share feedback about your candidate experience
    </Link>
  );
}
