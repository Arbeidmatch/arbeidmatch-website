"use client";

import Link from "next/link";

export default function CandidateFeedbackPill() {
  return (
    <Link
      href="/feedback"
      className="candidate-feedback-pill fixed bottom-[80px] right-[20px] z-[90] max-w-[min(280px,calc(100vw-2.5rem))] rounded-full border border-gold/30 bg-[#0d1524]/92 px-3.5 py-2 text-center text-[12px] leading-snug text-[#888] shadow-lg backdrop-blur-md transition-[color,box-shadow,border-color] duration-200 hover:border-gold hover:text-gold"
    >
      Share feedback about your candidate experience
    </Link>
  );
}
