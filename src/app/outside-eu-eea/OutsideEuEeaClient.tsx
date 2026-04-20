"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Check, Clock, Wrench } from "lucide-react";

const cardClass =
  "rounded-2xl border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.05)] p-6 md:p-8";
const inputClass =
  "w-full rounded-lg border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.4)] focus:outline-none";

export default function OutsideEuEeaClient() {
  const [firstName, setFirstName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");

  const [waitEmail, setWaitEmail] = useState("");
  const [waitConsent, setWaitConsent] = useState(false);
  const [waitLoading, setWaitLoading] = useState(false);
  const [waitMessage, setWaitMessage] = useState<"idle" | "ok" | "err">("idle");

  const submitLead = async (e: FormEvent) => {
    e.preventDefault();
    setLeadError("");
    setLeadLoading(true);
    try {
      const res = await fetch("/api/non-eu-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), email: leadEmail.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setLeadError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setLeadSuccess(true);
    } catch {
      setLeadError("Something went wrong. Please try again.");
    } finally {
      setLeadLoading(false);
    }
  };

  const submitWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    setWaitMessage("idle");
    if (!waitEmail.trim() || !waitEmail.includes("@")) {
      setWaitMessage("err");
      return;
    }
    if (!waitConsent) {
      setWaitMessage("err");
      return;
    }
    setWaitLoading(true);
    try {
      const email = waitEmail.trim().toLowerCase();
      const wants_assistance = "feature-waitlist|feature=non-eu-positions|guideWanted=1|consent=1";
      const res = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          feature: "non-eu-positions",
          consent: true,
          wants_assistance,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setWaitMessage("err");
        return;
      }
      setWaitMessage("ok");
      setWaitEmail("");
      setWaitConsent(false);
    } catch {
      setWaitMessage("err");
    } finally {
      setWaitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      {/* Hero */}
      <section
        className="border-b border-[rgba(201,168,76,0.12)] px-4 py-14 md:py-20"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, #0D1B2A 55%)",
        }}
      >
        <div className="mx-auto w-full max-w-content px-4 md:px-6 lg:px-12">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#C9A84C]">NON-EU WORKERS</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem]">
            <span className="text-white">Working in Norway</span>
            <br />
            <span className="text-[#C9A84C]">as a Non-EU Citizen</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[rgba(255,255,255,0.7)]">
            Norway is open to skilled workers from outside the EU/EEA — but the process requires preparation.
            We&apos;ll help you understand every step.
          </p>
        </div>
      </section>

      {/* Is it possible? */}
      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-6 px-4 md:grid-cols-3 md:gap-8 md:px-6 lg:px-12">
          <article className={cardClass}>
            <div className="mb-4 inline-flex rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)] p-3">
              <Check className="h-7 w-7 text-[#C9A84C]" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-white">Yes, it&apos;s possible</h2>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.65)]">
              Norway issues work permits to skilled non-EU workers. The key is having the right trade skills and
              documentation.
            </p>
          </article>
          <article className={cardClass}>
            <div className="mb-4 inline-flex rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)] p-3">
              <Clock className="h-7 w-7 text-[#C9A84C]" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-white">It takes time</h2>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.65)]">
              Permit processing takes 3–6 months. Start your application early and prepare all documents in advance.
            </p>
          </article>
          <article className={cardClass}>
            <div className="mb-4 inline-flex rounded-xl border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)] p-3">
              <Wrench className="h-7 w-7 text-[#C9A84C]" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-white">Trades are in demand</h2>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.65)]">
              Electricians, welders, construction workers and other skilled tradespeople have the best chances of
              approval.
            </p>
          </article>
        </div>
      </section>

      {/* Lead magnet */}
      <section className="border-y border-[rgba(201,168,76,0.12)] bg-[#0a0f18] px-4 py-14 md:py-20">
        <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
          <div className="rounded-2xl border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.05)] p-6 md:p-10">
            <h2 className="text-center text-2xl font-extrabold text-white md:text-3xl">Get your free Norway Work Guide</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-[rgba(255,255,255,0.7)]">
              We&apos;ll send you a practical overview of work permits, required documents, and first steps — straight to
              your inbox.
            </p>

            {leadSuccess ? (
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.12)]">
                  <Check className="h-8 w-8 text-[#C9A84C]" strokeWidth={2.5} aria-hidden />
                </div>
                <p className="mt-5 text-lg font-semibold text-white">Check your inbox! Your guide is on its way.</p>
              </div>
            ) : (
              <form onSubmit={submitLead} className="mt-10 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
                      First name
                    </span>
                    <input
                      type="text"
                      name="firstName"
                      required
                      minLength={2}
                      className={inputClass}
                      placeholder="Your first name"
                      value={firstName}
                      onChange={(ev) => setFirstName(ev.target.value)}
                      autoComplete="given-name"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      className={inputClass}
                      placeholder="you@example.com"
                      value={leadEmail}
                      onChange={(ev) => setLeadEmail(ev.target.value)}
                      autoComplete="email"
                    />
                  </label>
                </div>
                {leadError ? (
                  <p className="text-sm text-[#E24B4A]" role="alert">
                    {leadError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={leadLoading}
                  className="w-full rounded-[10px] bg-[#C9A84C] py-3.5 text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:opacity-50 md:py-4"
                >
                  {leadLoading ? "Sending…" : "Send me the free guide"}
                </button>
                <p className="text-center text-[12px] text-[rgba(255,255,255,0.4)]">
                  No spam. One email. Practical information only.
                </p>
                <p className="text-center text-[13px] text-[rgba(255,255,255,0.55)]">
                  By submitting you agree to our{" "}
                  <Link href="/privacy" className="text-[#C9A84C] underline underline-offset-2 hover:text-[#d8bc6a]">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Paid guides */}
      <section className="px-4 py-14 md:py-20">
        <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-6 px-4 md:grid-cols-3 md:gap-8 md:px-6 lg:px-12">
          <article className={`${cardClass} flex h-full flex-col`}>
            <h3 className="text-lg font-bold text-white">DSB Authorization Guide</h3>
            <p className="mt-2 flex-1 text-sm text-[rgba(255,255,255,0.65)]">
              For electricians who need Norwegian DSB approval
            </p>
            <p className="mt-4 text-xl font-bold text-[#C9A84C]">39 EUR</p>
            <Link
              href="/dsb-support/non-eu"
              className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#C9A84C] px-4 py-3 text-center text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Get the guide
            </Link>
          </article>
          <article className={`${cardClass} flex h-full flex-col`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Norway Work Permit Guide</h3>
              <span className="shrink-0 rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
                Coming soon
              </span>
            </div>
            <p className="mt-1 flex-1 text-sm text-[rgba(255,255,255,0.65)]">
              Step-by-step permit application for skilled workers
            </p>
            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-[10px] border border-[rgba(201,168,76,0.2)] py-3 text-sm font-semibold text-[rgba(255,255,255,0.35)]"
            >
              Coming soon
            </button>
          </article>
          <article className={`${cardClass} flex h-full flex-col`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-white">Relocation Guide Norway</h3>
              <span className="shrink-0 rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9A84C]">
                Coming soon
              </span>
            </div>
            <p className="mt-1 flex-1 text-sm text-[rgba(255,255,255,0.65)]">
              Housing, banking, tax registration, healthcare
            </p>
            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-[10px] border border-[rgba(201,168,76,0.2)] py-3 text-sm font-semibold text-[rgba(255,255,255,0.35)]"
            >
              Coming soon
            </button>
          </article>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-[rgba(201,168,76,0.1)] bg-[#0a0f18] px-4 py-10">
        <div className="mx-auto max-w-3xl text-center text-[13px] leading-relaxed text-[rgba(255,255,255,0.4)]">
          <p>
            ArbeidMatch Norge AS is a private recruitment agency, not an official Norwegian government authority. We do
            not sponsor visas or work permits. Information provided is for guidance only. Always verify current
            requirements with{" "}
            <a
              href="https://www.udi.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A84C] underline underline-offset-2 hover:text-[#d8bc6a]"
            >
              UDI.no
            </a>{" "}
            and{" "}
            <a
              href="https://www.arbeidstilsynet.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A84C] underline underline-offset-2 hover:text-[#d8bc6a]"
            >
              Arbeidstilsynet.no
            </a>
            .
          </p>
        </div>
      </section>

      {/* Waitlist */}
      <section className="border-t border-[rgba(201,168,76,0.12)] px-4 py-14 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">No open positions for non-EU workers right now</h2>
          <p className="mt-4 text-[rgba(255,255,255,0.65)]">
            We&apos;re building our non-EU employer network. Join the waitlist and be first to know when positions open.
          </p>
          <form onSubmit={submitWaitlist} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <label className="sr-only" htmlFor="waitlist-email">
              Email
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              className={`${inputClass} sm:flex-1`}
              placeholder="Your email"
              value={waitEmail}
              onChange={(ev) => setWaitEmail(ev.target.value)}
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={waitLoading}
              className="min-h-[48px] shrink-0 rounded-[10px] bg-[#C9A84C] px-8 text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:opacity-50"
            >
              {waitLoading ? "…" : "Join waitlist"}
            </button>
          </form>
          <label className="mt-4 flex cursor-pointer items-start justify-center gap-2 text-left text-[13px] text-[rgba(255,255,255,0.55)]">
            <input
              type="checkbox"
              checked={waitConsent}
              onChange={(ev) => setWaitConsent(ev.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-[rgba(201,168,76,0.4)] accent-[#C9A84C]"
            />
            <span>
              I agree to be notified about non-EU opportunities and accept the{" "}
              <Link href="/privacy" className="text-[#C9A84C] underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {waitMessage === "ok" ? (
            <p className="mt-4 text-sm font-medium text-[#1D9E75]">You&apos;re on the list. We&apos;ll be in touch.</p>
          ) : null}
          {waitMessage === "err" ? (
            <p className="mt-4 text-sm text-[#E24B4A]">Please enter a valid email and accept the privacy terms.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
