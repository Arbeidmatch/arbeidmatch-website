"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "exitShown";

function IconCopy() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default function ExitIntentDiscount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localEmail, setLocalEmail] = useState(email);
  const mobileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalEmail(email);
  }, [email]);

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

  const claim = useCallback(async () => {
    const e = localEmail.trim().toLowerCase();
    if (!e || !e.includes("@")) {
      window.alert("Enter your work email in the form above before claiming the offer.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/premium/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, plan: "monthly", withDiscount: true }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout failed");
      window.location.href = data.checkoutUrl;
    } catch {
      setLoading(false);
    }
  }, [localEmail]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("LAUNCH50");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

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
            <span className="pm-exit-pulse rounded-[20px] bg-red-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Limited Time Offer
            </span>
          </div>
          <h2 id="exit-title" className="mt-5 text-center text-[28px] font-extrabold leading-tight text-white">
            Wait. Here is 50% off your first 3 months.
          </h2>
          <p className="mt-3 text-center text-[15px] leading-[1.7] text-white/65">
            Use code LAUNCH50 at checkout. Your first 3 months cost EUR 5/month instead of EUR 10. Then EUR 10/month.
            Cancel anytime.
          </p>
          <div className="mt-6 flex flex-col items-center gap-1">
            <span className="text-sm text-white/40 line-through">EUR 10/month</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-extrabold text-[#C9A84C]">EUR 5/month</span>
              <span className="text-sm text-white/60">for 3 months</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void claim()}
            disabled={loading}
            className="mt-8 w-full rounded-[10px] bg-[#C9A84C] py-4 text-[15px] font-bold text-[#0f1923] disabled:opacity-60"
          >
            {loading ? "Redirecting…" : "Claim 50% Discount"}
          </button>
          <button
            type="button"
            className="mt-4 w-full text-center text-[13px] text-white/40"
            onClick={() => setOpen(false)}
          >
            No thanks, I will pay full price
          </button>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="mt-5 flex w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.06] px-4 py-2 font-mono text-sm tracking-[0.1em] text-white"
          >
            <span>{copied ? "Copied!" : "LAUNCH50"}</span>
            {copied ? <IconCheck /> : <IconCopy />}
          </button>
        </div>
      </div>
    </>
  );
}
