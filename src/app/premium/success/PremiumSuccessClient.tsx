"use client";

import Link from "next/link";

export default function PremiumSuccessClient() {
  return (
    <>
      <style jsx global>{`
        @keyframes pmCheck {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .pm-success-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: pmCheck 700ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-success-path {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#0f1923] px-6 py-20 text-center text-white">
        <svg width={48} height={48} viewBox="0 0 48 48" fill="none" aria-hidden>
          <circle cx="24" cy="24" r="20" stroke="#C9A84C" strokeWidth={2} />
          <path
            d="M16 24l6 6 12-14"
            stroke="#C9A84C"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="pm-success-path"
          />
        </svg>
        <h1 className="mt-8 max-w-lg text-3xl font-extrabold text-white">You are in. Welcome to ArbeidMatch Premium.</h1>
        <p className="mt-4 max-w-md text-base text-white/65">Your subscription is active. Start exploring your guides.</p>
        <Link
          href="/premium/browse"
          className="mt-10 inline-flex min-h-[48px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3 text-base font-bold text-[#0f1923]"
        >
          Browse Premium Guides
        </Link>
      </div>
    </>
  );
}
