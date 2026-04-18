"use client";

import Link from "next/link";

export default function CandidateFeedbackPill() {
  return (
    <Link
      href="/feedback"
      className="candidate-feedback-pill fixed bottom-[80px] right-5 z-[90] max-w-[min(280px,calc(100vw-2.5rem))] rounded-full border border-gold/25 bg-[#0d1524]/92 px-3.5 py-2 text-center text-[12px] leading-snug text-[#9a9a9a] shadow-lg backdrop-blur-md transition-[color,box-shadow,border-color,transform] duration-200 hover:border-gold/55 hover:text-gold hover:shadow-[0_0_20px_rgba(184,134,11,0.25)] md:right-5"
    >
      Share feedback about your candidate experience
    </Link>
  );
}
