"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "exitShown";

export default function ExitIntentDiscount({ email }: { email: string }) {
  void email;
  const [open, setOpen] = useState(false);
  const mobileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(true);
  }, []);

  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };
    document.addEventListener("mouseout", onLeave);
    mobileTimer.current = setTimeout(() => {
      const mq = window.matchMedia("(max-width: 767px)");
      if (mq.matches) trigger();
    }, 60_000);
    return () => {
      document.removeEventListener("mouseout", onLeave);
      if (mobileTimer.current) clearTimeout(mobileTimer.current);
    };
  }, [trigger]);

  if (!open) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes pmExitPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.65;
          }
        }
        .pm-exit-pulse {
          animation: pmExitPulse 1.4s ease-in-out infinite;
        }
        @keyframes pmSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pm-exit-modal {
          animation: pmSlideUp 350ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-exit-pulse,
          .pm-exit-modal {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[280] flex items-end justify-center bg-black/75 px-4 py-8 backdrop-blur-sm sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
      >
        <div className="pm-exit-modal w-full max-w-[480px] rounded-[20px] border border-[rgba(201,168,76,0.3)] bg-[#0f1923] px-6 py-8 md:px-10 md:py-10">
          <div className="flex justify-center">
            <span className="pm-exit-pulse rounded-[20px] bg-[#C9A84C]/20 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#C9A84C]">
              Stay in the loop
            </span>
          </div>
          <h2 id="exit-title" className="mt-5 text-center text-[28px] font-extrabold leading-tight text-white">
            Premium pricing is not live yet.
          </h2>
          <p className="mt-3 text-center text-[15px] leading-[1.7] text-white/65">
            Join the waitlist on our Premium page to hear when access opens and how early access pricing will work.
          </p>
          <Link
            href="/premium#notify-form"
            onClick={() => setOpen(false)}
            className="mt-8 flex w-full items-center justify-center rounded-[10px] bg-[#C9A84C] py-4 text-[15px] font-bold text-[#0f1923]"
          >
            Join the waitlist for early access pricing.
          </Link>
          <button
            type="button"
            className="mt-4 w-full text-center text-[13px] text-white/40"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
