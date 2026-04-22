"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Target } from "lucide-react";

import { jobsBoardAbsoluteUrl } from "@/lib/jobs/jobsBoardOrigin";
import type { JobRecord } from "@/lib/jobs/types";

type FitSuccess = {
  complete: true;
  overallPercent: number;
  band: "Strong" | "Good" | "Low";
  criteria: { label: string; aligned: boolean }[];
  tips: string[];
  applyHref: string;
  improveProfileHref: string;
};

type ModalKind = "none" | "signup" | "fit";

const LS_EMAIL = "am_candidate_profile_email";

function completionFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LS_EMAIL)?.trim().toLowerCase();
  return v && v.includes("@") ? v : null;
}

function resolveApplyHref(job: JobRecord, browseOnly: boolean, serverApplyHref: string): string {
  const internal = job.applicationMethod === "internal" || !job.applicationMethod;
  if (!internal) return serverApplyHref;
  const base = jobsBoardAbsoluteUrl(`/jobs/${job.slug}/apply`);
  return browseOnly ? jobsBoardAbsoluteUrl(`/jobs/${job.slug}/apply?browse=1`) : base;
}

export default function JobFitCheckButton({
  job,
  browseOnly = false,
  className = "",
}: {
  job: JobRecord;
  browseOnly?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [modal, setModal] = useState<ModalKind>("none");
  const [fitData, setFitData] = useState<FitSuccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState("");

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const };

  const close = useCallback(() => {
    setModal("none");
    setFitData(null);
    setError(null);
  }, []);

  const openSignup = useCallback((prefill: string) => {
    setSignupEmail(prefill);
    setModal("signup");
    setError(null);
  }, []);

  const runCheck = useCallback(async () => {
    setError(null);
    const stored = completionFromStorage();
    if (!stored) {
      openSignup("");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: stored, jobSlug: job.slug }),
      });
      const data = (await res.json().catch(() => ({}))) as FitSuccess & { complete?: boolean; error?: string };

      if (!res.ok) {
        setSignupEmail(stored);
        setModal("signup");
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }

      if (data.complete === true && typeof data.overallPercent === "number") {
        setFitData(data);
        setModal("fit");
        return;
      }

      openSignup(stored);
    } finally {
      setLoading(false);
    }
  }, [job.slug, openSignup]);

  const getStarted = useCallback(() => {
    const trimmed = signupEmail.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    try {
      window.localStorage.setItem(LS_EMAIL, trimmed);
    } catch {
      /* ignore */
    }
    window.location.assign("/candidates/complete-profile");
  }, [signupEmail]);

  const pct = fitData?.overallPercent ?? 0;
  const showApplyCta = pct >= 70;
  const applyTarget = fitData ? resolveApplyHref(job, browseOnly, fitData.applyHref) : "";

  const backdropClass =
    "fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(5,10,16,0.9)] px-3 py-6 backdrop-blur-[12px] sm:px-4";

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => void runCheck()}
        className={`inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-md border border-[#C9A84C]/55 bg-transparent px-4 text-sm font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.1)] disabled:opacity-50 sm:w-auto sm:min-w-0 sm:flex-1 ${className}`}
      >
        <Target className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {loading ? "Checking…" : "Check Fit"}
      </button>

      <AnimatePresence>
        {modal === "signup" ? (
          <motion.div
            key="fit-signup"
            className={backdropClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="am-fit-signup-title"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.98 }}
              transition={transition}
              className="w-full max-w-md origin-center rounded-[20px] border border-[rgba(201,168,76,0.38)] bg-[linear-gradient(165deg,rgba(13,27,42,0.98),rgba(10,15,24,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.58)] sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Check Fit</p>
              <h2 id="am-fit-signup-title" className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Create your profile to check compatibility
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/68">
                Enter your email to start the short profile flow. When you are done, you can compare your background to
                each role in one tap.
              </p>
              <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.1em] text-white/45" htmlFor="am-fit-email">
                Email
              </label>
              <input
                id="am-fit-email"
                type="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-[12px] border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[rgba(201,168,76,0.55)] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/35"
              />
              {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={close}
                  className="min-h-[44px] rounded-[10px] border border-white/15 px-4 text-sm font-semibold text-white/80 transition-colors hover:border-white/25"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={getStarted}
                  className="min-h-[44px] rounded-[10px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "fit" && fitData ? (
          <motion.div
            key="fit-result"
            className={backdropClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="am-fit-result-title"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
              transition={transition}
              className="max-h-[min(92vh,760px)] w-full max-w-lg overflow-y-auto rounded-[22px] border border-[rgba(201,168,76,0.42)] bg-[linear-gradient(168deg,rgba(16,30,48,0.98),rgba(8,12,20,0.99))] p-6 shadow-[0_32px_110px_rgba(0,0,0,0.62)] sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">ArbeidMatch</p>
              <h2
                id="am-fit-result-title"
                className="mt-3 text-center text-xl font-bold leading-snug text-white sm:text-2xl md:text-[1.65rem]"
              >
                Your Compatibility with this Role
              </h2>

              <div className="mt-10 flex flex-col items-center">
                <motion.p
                  className="text-5xl font-extrabold tabular-nums tracking-tight text-[#C9A84C] sm:text-6xl md:text-7xl"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 20 }}
                >
                  {fitData.overallPercent}%
                </motion.p>
                <p className="mt-3 text-lg font-bold uppercase tracking-[0.12em] text-white sm:text-xl">{fitData.band}</p>
                <p className="mt-1 text-center text-xs text-white/50">How closely your saved profile matches this vacancy</p>
              </div>

              <ul className="mt-9 space-y-2.5 rounded-[14px] border border-white/10 bg-[#0D1B2A]/55 p-4 sm:p-5">
                {fitData.criteria.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-3 text-sm text-white/88">
                    <span>{c.label}</span>
                    <span className="shrink-0 text-lg leading-none" aria-label={c.aligned ? "Match" : "Gap"}>
                      {c.aligned ? "✓" : "✗"}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-[14px] border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.07)] p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/95">Constructive tips</p>
                <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/76">
                  {fitData.tips.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-[#C9A84C]" aria-hidden>
                        ·
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
                {showApplyCta ? (
                  job.applicationMethod === "external_url" ? (
                    <a
                      href={applyTarget}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[10px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] shadow-[0_10px_30px_rgba(201,168,76,0.25)] transition-colors hover:bg-[#b8953f] sm:min-w-[140px]"
                    >
                      Apply
                    </a>
                  ) : job.applicationMethod === "email" ? (
                    <a
                      href={applyTarget}
                      onClick={close}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[10px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] shadow-[0_10px_30px_rgba(201,168,76,0.25)] transition-colors hover:bg-[#b8953f] sm:min-w-[140px]"
                    >
                      Apply
                    </a>
                  ) : (
                    <Link
                      href={applyTarget}
                      onClick={close}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[10px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] shadow-[0_10px_30px_rgba(201,168,76,0.25)] transition-colors hover:bg-[#b8953f] sm:min-w-[140px]"
                    >
                      Apply
                    </Link>
                  )
                ) : (
                  <Link
                    href={fitData.improveProfileHref}
                    onClick={close}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-[10px] border-2 border-[#C9A84C]/55 bg-transparent px-5 text-sm font-bold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.1)] sm:min-w-[160px]"
                  >
                    Improve Profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-white/15 px-5 text-sm font-semibold text-white/75 transition-colors hover:border-white/28 sm:min-w-[100px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
