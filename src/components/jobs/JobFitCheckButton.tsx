"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Target } from "lucide-react";
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

export default function JobFitCheckButton({
  job,
  className = "",
}: {
  job: JobRecord;
  className?: string;
}) {
  const [modal, setModal] = useState<ModalKind>("none");
  const [fitData, setFitData] = useState<FitSuccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState("");
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (modal === "none") {
      setAnimateIn(false);
      return;
    }
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [modal]);

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
    window.localStorage.setItem(LS_EMAIL, trimmed);
    window.location.assign("/candidates/complete-profile");
  }, [signupEmail]);

  const pct = fitData?.overallPercent ?? 0;
  const showApplyCta = pct >= 70;

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

      {modal === "signup" ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(5,10,16,0.88)] px-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="am-fit-signup-title"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className={`w-full max-w-md origin-center rounded-[18px] border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(165deg,rgba(13,27,42,0.98),rgba(10,15,24,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out ${
              animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Compatibility</p>
            <h2 id="am-fit-signup-title" className="mt-2 text-xl font-bold text-white">
              Create your profile to check compatibility
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Save your email to start the short profile flow. When you are done, you can compare your background to
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
              placeholder="you@company.com"
              className="mt-2 w-full rounded-[12px] border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[rgba(201,168,76,0.55)] focus:outline-none"
            />
            {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="min-h-[44px] rounded-[10px] border border-white/15 px-4 text-sm font-semibold text-white/80 hover:border-white/25"
              >
                Close
              </button>
              <button
                type="button"
                onClick={getStarted}
                className="min-h-[44px] rounded-[10px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] hover:bg-[#b8953f]"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modal === "fit" && fitData ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(5,10,16,0.9)] px-3 py-6 backdrop-blur-md sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="am-fit-result-title"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className={`max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[rgba(201,168,76,0.4)] bg-[linear-gradient(165deg,rgba(15,28,44,0.98),rgba(8,12,20,0.99))] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out sm:p-8 ${
              animateIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.96] opacity-0"
            }`}
          >
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">ArbeidMatch</p>
            <h2 id="am-fit-result-title" className="mt-3 text-center text-xl font-bold leading-snug text-white sm:text-2xl">
              Your Compatibility with this Role
            </h2>

            <div className="mt-8 flex flex-col items-center">
              <p className="text-5xl font-extrabold tabular-nums tracking-tight text-[#C9A84C] sm:text-6xl">{fitData.overallPercent}%</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/75">{fitData.band} alignment</p>
            </div>

            <ul className="mt-8 space-y-2.5 rounded-[14px] border border-white/10 bg-[#0D1B2A]/50 p-4">
              {fitData.criteria.map((c) => (
                <li key={c.label} className="flex items-center justify-between gap-3 text-sm text-white/85">
                  <span>{c.label}</span>
                  <span className="shrink-0 text-base" aria-label={c.aligned ? "Aligned" : "Not aligned"}>
                    {c.aligned ? "✓" : "✗"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-[14px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.06)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/90">Ideas for you</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/75">
                {fitData.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {!showApplyCta ? (
                <Link
                  href={fitData.improveProfileHref}
                  onClick={close}
                  className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-[10px] border border-[#C9A84C]/45 px-4 text-sm font-bold text-[#C9A84C] hover:bg-[rgba(201,168,76,0.1)]"
                >
                  Improve Profile
                </Link>
              ) : null}
              {showApplyCta ? (
                job.applicationMethod === "external_url" ? (
                  <a
                    href={fitData.applyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-[10px] bg-[#C9A84C] px-4 text-sm font-bold text-[#0D1B2A] hover:bg-[#b8953f]"
                  >
                    Apply
                  </a>
                ) : job.applicationMethod === "email" ? (
                  <a
                    href={fitData.applyHref}
                    onClick={close}
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-[10px] bg-[#C9A84C] px-4 text-sm font-bold text-[#0D1B2A] hover:bg-[#b8953f]"
                  >
                    Apply
                  </a>
                ) : (
                  <Link
                    href={fitData.applyHref}
                    onClick={close}
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-[10px] bg-[#C9A84C] px-4 text-sm font-bold text-[#0D1B2A] hover:bg-[#b8953f]"
                  >
                    Apply
                  </Link>
                )
              ) : null}
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-[46px] items-center justify-center rounded-[10px] border border-white/15 px-4 text-sm font-semibold text-white/75 hover:border-white/25"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
