"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Plan = "monthly" | "annual";

const MONTHLY = 10;
const ANNUAL = 80;

function IconLockShake() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#C9A84C] pm-lock-shake"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function StripeMark() {
  return (
    <svg width={36} height={15} viewBox="0 0 60 25" aria-hidden className="opacity-90">
      <path
        fill="rgba(255,255,255,0.35)"
        d="M59.64 14.28h-8.06c.09 1.08.45 1.89 1.35 2.45.75.45 1.71.63 2.97.63 1.26 0 2.43-.18 3.42-.54l.45 2.7c-1.17.45-2.79.72-4.86.72-2.25 0-4.02-.63-5.31-1.89-1.29-1.26-1.95-3.06-1.95-5.4 0-2.25.57-4.05 1.71-5.4 1.14-1.35 2.7-2.01 4.68-2.01 2.07 0 3.69.66 4.86 1.98 1.17 1.32 1.74 3.06 1.74 5.22v1.14zm-4.14-2.52c0-1.08-.21-1.92-.63-2.52-.42-.6-1.05-.9-1.89-.9-.78 0-1.44.33-1.98.99-.54.66-.87 1.56-.99 2.7h5.49v-.27z"
      />
    </svg>
  );
}

export default function PaywallOverlay({
  email,
  onReauth,
}: {
  email: string;
  onReauth: (email: string) => void;
}) {
  const [plan, setPlan] = useState<Plan>("monthly");
  const [showEmail, setShowEmail] = useState(false);
  const [reEmail, setReEmail] = useState(email);
  const [workEmail, setWorkEmail] = useState(email);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setWorkEmail(email);
    setReEmail(email);
  }, [email]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.style.overflow = "hidden";
    });
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
    };
  }, []);

  const priceLabel = useMemo(() => {
    if (plan === "monthly") return `EUR ${MONTHLY}/month`;
    return `EUR ${ANNUAL}/year`;
  }, [plan]);

  const subscribe = useCallback(async () => {
    const checkoutEmail = workEmail.trim().toLowerCase();
    if (!checkoutEmail || !checkoutEmail.includes("@")) {
      setErr("Enter a valid email to continue.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/premium/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: checkoutEmail, plan, withDiscount: false }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Checkout failed");
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [plan, workEmail]);

  return (
    <>
      <style jsx global>{`
        @keyframes pmLockShake {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
          75% {
            transform: rotate(-5deg);
          }
        }
        .pm-lock-shake {
          animation: pmLockShake 400ms ease-out 1;
        }
        @keyframes pmModalIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .pm-modal-in {
          animation: pmModalIn 300ms ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-lock-shake,
          .pm-modal-in {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className="pointer-events-auto fixed inset-0 z-[300] flex items-center justify-center px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <div
          className="pm-modal-in w-full max-w-[480px] rounded-[20px] border border-[rgba(201,168,76,0.3)] bg-[#0f1923] px-7 py-10 md:px-12 md:py-12"
        >
          <div className="flex justify-center">
            <IconLockShake />
          </div>
          <h2 id="paywall-title" className="mt-6 text-center text-2xl font-extrabold text-white">
            Your free trial has ended.
          </h2>
          <p className="mt-3 text-center text-[15px] leading-[1.7] text-white/65">
            You are reading a Premium article. Subscribe to continue accessing all guides and future content.
          </p>

          <label className="mt-6 block text-left text-[12px] font-medium text-white/50">
            Work email
            <input
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-white/12 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder:text-white/30"
              placeholder="you@company.com"
            />
          </label>

          <div className="mt-8 flex rounded-full border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                plan === "monthly" ? "bg-[#C9A84C] text-[#0f1923]" : "text-white/60"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setPlan("annual")}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                plan === "annual" ? "bg-[#C9A84C] text-[#0f1923]" : "text-white/60"
              }`}
            >
              Annual
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-2xl font-extrabold text-white transition-all duration-300">{priceLabel}</p>
            {plan === "annual" ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#C9A84C]">Save EUR 40</p>
            ) : null}
          </div>

          {err ? <p className="mt-3 text-center text-sm text-red-400">{err}</p> : null}

          <button
            type="button"
            onClick={() => void subscribe()}
            disabled={loading}
            className="mt-8 w-full rounded-[10px] bg-[#C9A84C] py-4 text-[15px] font-bold text-[#0f1923] transition-opacity disabled:opacity-60"
          >
            {loading ? "Redirecting…" : "Subscribe Now. Start Reading Immediately."}
          </button>

          {!showEmail ? (
            <button
              type="button"
              className="mt-5 w-full text-center text-[13px] text-white/50 underline"
              onClick={() => setShowEmail(true)}
            >
              Already a subscriber? Sign in with your email
            </button>
          ) : (
            <div className="mt-5 space-y-2">
              <input
                value={reEmail}
                onChange={(e) => setReEmail(e.target.value)}
                className="w-full rounded-[10px] border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30"
                placeholder="Work email"
              />
              <button
                type="button"
                className="w-full rounded-[10px] border border-white/15 py-2.5 text-sm font-semibold text-white"
                onClick={() => onReauth(reEmail.trim())}
              >
                Continue
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-white/40">
            Secure payment via Stripe. Cancel anytime from your account.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/30">
            <StripeMark />
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </>
  );
}
