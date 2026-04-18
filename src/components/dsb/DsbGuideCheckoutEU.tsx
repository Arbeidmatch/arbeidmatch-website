"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function DsbGuideCheckoutEU() {
  const [step, setStep] = useState<"input" | "confirm" | "sent">("input");
  const [email, setEmail] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (step !== "sent" || resendCountdown <= 0) return;
    const timer = window.setInterval(() => setResendCountdown((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendCountdown]);

  const startConfirmation = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setConfirmedEmail(email.trim());
    setStep("confirm");
  };

  const sendLink = async () => {
    if (!confirmedEmail) return;
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/dsb-guide/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide_slug: "eu", email: confirmedEmail, website: "" }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Could not send access link.");
        return;
      }
      setStatus("idle");
      setStep("sent");
      setResendCountdown(60);
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const resetToInput = () => {
    setStep("input");
    setStatus("idle");
    setError("");
    setResendCountdown(0);
  };

  const resetSelection = () => {
    try {
      localStorage.removeItem("am_dsb_type");
    } catch {
      // ignore storage errors
    }
    window.location.href = "/dsb-support";
  };

  return (
    <>
      <section className="bg-gradient-to-br from-[#0d3327] via-[#0a0f1e] to-[#0a0f1e] py-16 text-white md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <span className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            EU/EEA Citizens Only
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">Get Your DSB Authorization in Norway</h1>
          <p className="mt-4 max-w-3xl text-base text-white/85 md:text-lg">
            Fast-track your electrical career in Norway. EU recognition means a simpler, faster process.
          </p>
          <p className="mt-5 inline-block rounded-lg border border-emerald-300/35 bg-emerald-200/10 px-4 py-3 text-sm font-semibold text-emerald-100">
            2-4 months · No visa · Job placement available
          </p>
        </div>
      </section>

      <section className="bg-surface py-14">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <div className="mx-auto max-w-3xl rounded-xl border border-emerald-300/35 bg-white p-8 shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <h2 className="text-2xl font-bold text-navy">What&apos;s included</h2>
            <ul className="mt-4 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
              <li>Step-by-step application process</li>
              <li>Complete document checklist</li>
              <li>Official DSB links and forms</li>
              <li>Processing times and fees</li>
              <li>FAQ and common mistakes</li>
              <li>30-day secure online access</li>
            </ul>
            <p className="mt-6 text-2xl font-bold text-gold">15 EUR - One-time access</p>

            <div className="mt-6 min-h-[220px] transition-all duration-300">
              {step === "input" && (
                <form onSubmit={startConfirmation} className="space-y-3">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                  <label className="block text-sm text-navy">
                    Email for receipt &amp; access*
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </label>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    className="w-full rounded-md bg-navy py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-navy"
                  >
                    Get the EU/EEA Guide
                  </button>
                </form>
              )}

              {step === "confirm" && (
                <div className="space-y-4 rounded-lg border border-gold/30 bg-surface p-4 text-center">
                  <p className="text-sm font-semibold uppercase tracking-wide text-navy">Please confirm your email address</p>
                  <p className="text-sm text-text-secondary">We will send your access link to:</p>
                  <p className="break-all rounded-md bg-gold/10 px-3 py-2 text-xl font-bold text-navy">{confirmedEmail}</p>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="button"
                    onClick={sendLink}
                    disabled={status === "loading"}
                    className="w-full rounded-md bg-gold py-3 text-sm font-semibold text-navy transition hover:bg-gold-hover disabled:opacity-60"
                  >
                    {status === "loading" ? "Sending..." : "Yes, this is correct - Send the link"}
                  </button>
                  <button
                    type="button"
                    onClick={resetToInput}
                    className="mx-auto block text-sm text-text-secondary underline underline-offset-2 hover:text-navy"
                  >
                    No, let me edit it
                  </button>
                </div>
              )}

              {step === "sent" && (
                <div className="space-y-4 rounded-lg border border-border bg-surface p-4 text-center">
                  <h3 className="text-xl font-bold text-navy">Check your inbox!</h3>
                  <p className="text-sm text-text-secondary">
                    We sent your access link to <span className="break-all font-semibold text-navy">{confirmedEmail}</span>.
                  </p>
                  <p className="text-sm text-text-secondary">
                    Click the link in the email to proceed to payment. The link expires in 30 minutes.
                  </p>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {resendCountdown === 0 ? (
                    <button
                      type="button"
                      onClick={sendLink}
                      disabled={status === "loading"}
                      className="mx-auto rounded-md border border-navy px-4 py-2 text-xs font-medium text-navy transition hover:bg-navy hover:text-white disabled:opacity-60"
                    >
                      {status === "loading" ? "Sending..." : "Resend email"}
                    </button>
                  ) : (
                    <p className="text-xs text-text-secondary">Resend available in {resendCountdown}s</p>
                  )}
                  <button
                    type="button"
                    onClick={resetToInput}
                    className="mx-auto block text-sm text-text-secondary underline underline-offset-2 hover:text-navy"
                  >
                    Wrong email? Start over
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-2 text-center">
              <Link href="/dsb-support/non-eu" className="block text-sm font-medium text-gold hover:text-gold-hover">
                Not EU/EEA? See the Non-EU guide →
              </Link>
              <button
                type="button"
                onClick={resetSelection}
                className="text-sm text-text-secondary underline underline-offset-2 hover:text-navy"
              >
                Change my selection
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
