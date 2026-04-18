"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";
type DsbGuideSlug = "eu" | "non-eu";

function GuideSelectionModal({
  open,
  selectedGuide,
  confirmationChecked,
  onClose,
  onSelectGuide,
  onConfirmationChange,
  onContinue,
}: {
  open: boolean;
  selectedGuide: DsbGuideSlug;
  confirmationChecked: boolean;
  onClose: () => void;
  onSelectGuide: (guide: DsbGuideSlug) => void;
  onConfirmationChange: (checked: boolean) => void;
  onContinue: (guide: DsbGuideSlug) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-6 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dsb-guide-selection-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#030508]/75 backdrop-blur-[2px]"
            aria-label="Close dialog backdrop"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-gold/25 bg-[#0a1018]/85 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/[0.07] via-transparent to-transparent" />
            <div className="relative p-5 sm:p-7">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close guide selection modal"
              >
                X
              </button>
              <h2 id="dsb-guide-selection-title" className="pr-10 text-xl font-bold text-white sm:text-2xl">
                Before you continue - make sure you choose the right guide
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div
                  className={`rounded-xl border p-4 text-white transition-all ${
                    selectedGuide === "eu"
                      ? "border-gold bg-white/10 shadow-[0_0_0_1px_rgba(201,168,76,0.35)]"
                      : "border-white/15 bg-white/[0.04] opacity-75"
                  }`}
                >
                  <p className="text-2xl" aria-hidden>
                    🇪🇺
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">EU/EEA Citizens</h3>
                  <p className="mt-2 text-xs text-white/75">
                    Romania, Poland, Bulgaria, Hungary, Croatia, Slovakia, Czech Republic, Lithuania, Latvia,
                    Estonia, and all other EU/EEA countries
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="text-emerald-300">- Faster process: 2 to 4 months</li>
                    <li className="text-emerald-300">- No visa required</li>
                    <li className="text-emerald-300">- Direct recognition under EU Directive</li>
                    <li className="text-emerald-300">- Job placement available after approval</li>
                  </ul>
                  <p className="mt-3 text-lg font-bold text-gold">15 EUR</p>
                  <button
                    type="button"
                    onClick={() => onContinue("eu")}
                    disabled={!confirmationChecked}
                    className="mt-3 w-full rounded-md bg-gold py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    I am EU/EEA - Get this guide
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectGuide("eu")}
                    className="mt-2 text-xs text-gold/90 underline underline-offset-2 hover:text-gold"
                  >
                    Select this guide
                  </button>
                </div>

                <div
                  className={`rounded-xl border p-4 text-white transition-all ${
                    selectedGuide === "non-eu"
                      ? "border-gold bg-white/10 shadow-[0_0_0_1px_rgba(201,168,76,0.35)]"
                      : "border-white/15 bg-white/[0.04] opacity-75"
                  }`}
                >
                  <p className="text-2xl" aria-hidden>
                    🌍
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Non-EU Citizens</h3>
                  <p className="mt-2 text-xs text-white/75">
                    Ukraine, Philippines, India, Pakistan, Morocco, Serbia, and all countries outside EU/EEA
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="text-amber-200">- Longer process: 6 to 12 months</li>
                    <li className="text-amber-200">- Work visa required (provided by employer)</li>
                    <li className="text-amber-200">- Individual assessment by DSB</li>
                    <li className="text-amber-200">- No job placement guarantee</li>
                  </ul>
                  <p className="mt-3 text-lg font-bold text-gold">39 EUR</p>
                  <button
                    type="button"
                    onClick={() => onContinue("non-eu")}
                    disabled={!confirmationChecked}
                    className="mt-3 w-full rounded-md border border-gold/60 bg-transparent py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    I am Non-EU - Get this guide
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectGuide("non-eu")}
                    className="mt-2 text-xs text-gold/90 underline underline-offset-2 hover:text-gold"
                  >
                    Select this guide
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-white/75">
                Not sure which applies to you? Check if your country is in the EU/EEA{" "}
                <a
                  href="https://en.wikipedia.org/wiki/European_Economic_Area"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-gold underline underline-offset-2 hover:text-gold-hover"
                >
                  here
                </a>
              </p>
              <label className="mt-4 flex items-start gap-2 rounded-lg border border-white/20 bg-white/[0.03] p-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(event) => onConfirmationChange(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm I have selected the correct guide for my country. I understand that purchases are
                  non-refundable once access is granted.
                </span>
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GuideCheckoutCard({
  guideSlug,
  badge,
  title,
  bullets,
  processingTime,
  price,
  buttonLabel,
  anchorId,
  activationToken,
  onOpenSelector,
}: {
  guideSlug: DsbGuideSlug;
  badge: string;
  title: string;
  bullets: string[];
  processingTime: string;
  price: string;
  buttonLabel: string;
  anchorId: string;
  activationToken: number;
  onOpenSelector: (guide: DsbGuideSlug) => void;
}) {
  const [step, setStep] = useState<"cta" | "input" | "confirm" | "sent">("cta");
  const [email, setEmail] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (step !== "sent" || resendCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, resendCountdown]);

  useEffect(() => {
    if (activationToken <= 0) return;
    setStep("input");
    setStatus("idle");
    setError("");
    setResendCountdown(0);
  }, [activationToken]);

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
        body: JSON.stringify({
          guide_slug: guideSlug,
          email: confirmedEmail,
          website: "",
        }),
      });
      const data = (await res.json()) as { success?: boolean; checkout_url?: string; error?: string };
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

  return (
    <article
      id={anchorId}
      className="flex flex-col rounded-xl border border-border bg-white p-8 shadow-[0_10px_30px_rgba(13,27,42,0.08)]"
    >
      <span className="inline-flex w-fit rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
        {badge}
      </span>
      <h2 className="mt-4 text-2xl font-bold text-navy">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1 text-gold" aria-hidden>
              •
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-navy">
        <span className="font-semibold">Typical processing time:</span> {processingTime}
      </p>
      <p className="mt-2 text-lg font-bold text-gold">{price}</p>
      <div className="mt-6 min-h-[220px] transition-all duration-300">
        {step === "cta" && (
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-sm text-text-secondary">Please confirm your guide selection before entering your email.</p>
            <button
              type="button"
              onClick={() => onOpenSelector(guideSlug)}
              className="mt-4 w-full rounded-md bg-navy py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-navy"
            >
              {buttonLabel}
            </button>
          </div>
        )}

        {step === "input" && (
          <form onSubmit={startConfirmation} className="space-y-3 opacity-100 transition-opacity duration-300">
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
              {buttonLabel}
            </button>
          </form>
        )}

        {step === "confirm" && (
          <div className="space-y-4 rounded-lg border border-gold/30 bg-surface p-4 text-center opacity-100 transition-opacity duration-300">
            <p className="text-sm font-semibold uppercase tracking-wide text-navy">Please confirm your email address</p>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary">We will send your access link to:</p>
            <p className="rounded-md bg-gold/10 px-3 py-2 text-xl font-bold text-navy break-all">{confirmedEmail}</p>
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
          <div className="space-y-4 rounded-lg border border-border bg-surface p-4 text-center opacity-100 transition-opacity duration-300">
            <h3 className="text-xl font-bold text-navy">Check your inbox!</h3>
            <p className="text-sm text-text-secondary">
              We sent your access link to <span className="font-semibold text-navy break-all">{confirmedEmail}</span>.
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
    </article>
  );
}

export default function DsbSupportClient() {
  const searchParams = useSearchParams();
  const purchaseRequired = searchParams.get("purchase") === "required";
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<DsbGuideSlug>("eu");
  const [guideConfirmation, setGuideConfirmation] = useState(false);
  const [activationTokens, setActivationTokens] = useState<Record<DsbGuideSlug, number>>({ eu: 0, "non-eu": 0 });

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [applicantType, setApplicantType] = useState<"eu" | "non-eu" | "">("");
  const [gdpr, setGdpr] = useState(false);
  const [waitStatus, setWaitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitError, setWaitError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const openGuideSelector = (preferredGuide: DsbGuideSlug) => {
    setSelectedGuide(preferredGuide);
    setGuideConfirmation(false);
    setSelectorOpen(true);
  };

  const confirmGuideSelection = (guide: DsbGuideSlug) => {
    if (!guideConfirmation) return;
    setSelectorOpen(false);
    setActivationTokens((prev) => ({ ...prev, [guide]: prev[guide] + 1 }));
    window.setTimeout(() => {
      const anchorId = guide === "eu" ? "guide-eu" : "guide-non-eu";
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const submitWaitlist = async (e: FormEvent) => {
    e.preventDefault();
    setWaitError("");
    if (!firstName.trim() || !email.trim() || !country.trim() || !applicantType || !gdpr) {
      setWaitError("Please complete all fields and accept the privacy terms.");
      return;
    }
    setWaitStatus("loading");
    try {
      const res = await fetch("/api/dsb-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          email: email.trim(),
          country: country.trim(),
          applicant_type: applicantType,
          gdpr_consent: gdpr,
          website: "",
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setWaitStatus("error");
        setWaitError(data.error || "Could not join waitlist.");
        return;
      }
      setSubmittedEmail(email.trim());
      setWaitStatus("success");
    } catch {
      setWaitStatus("error");
      setWaitError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <GuideSelectionModal
        open={selectorOpen}
        selectedGuide={selectedGuide}
        confirmationChecked={guideConfirmation}
        onClose={() => setSelectorOpen(false)}
        onSelectGuide={setSelectedGuide}
        onConfirmationChange={setGuideConfirmation}
        onContinue={confirmGuideSelection}
      />

      <section className="bg-navy py-16 text-white md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          {purchaseRequired && (
            <div
              className="mb-8 rounded-lg border border-gold/40 bg-white/5 px-4 py-3 text-sm text-gold"
              role="status"
            >
              Purchase required to access this guide. Choose a guide below or join the waitlist.
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">DSB authorization</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
            DSB Authorization Guides for Electricians in Norway
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Everything you need to know to get legally approved and start working as an electrician in Norway.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-white/75">
            EU/EEA electricians with approved DSB authorization can be matched to active placements through
            ArbeidMatch.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/for-candidates" className="font-medium text-gold hover:text-gold-hover">
              Back to candidate path
            </Link>
            <Link href="/request" className="font-medium text-gold hover:text-gold-hover">
              Ready for placements after DSB? Apply via request form
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface py-14">
        <div className="mx-auto grid w-full max-w-content gap-8 px-4 md:grid-cols-2 md:px-6">
          <GuideCheckoutCard
            anchorId="guide-eu"
            guideSlug="eu"
            badge="EU/EEA Citizens"
            title="DSB Guide for EU/EEA Electricians"
            bullets={[
              "Step-by-step application process",
              "Complete document checklist",
              "Official DSB links and forms",
              "Processing times and fees",
              "FAQ and common mistakes",
            ]}
            processingTime="2 to 4 months"
            price="15 EUR"
            buttonLabel="Get the EU/EEA Guide"
            activationToken={activationTokens.eu}
            onOpenSelector={openGuideSelector}
          />
          <GuideCheckoutCard
            anchorId="guide-non-eu"
            guideSlug="non-eu"
            badge="Non-EU Citizens"
            title="DSB Guide for Non-EU Electricians"
            bullets={[
              "Full application walkthrough",
              "Document translation requirements",
              "Work visa process explained",
              "Timeline and cost breakdown",
              "FAQ and appeals process",
            ]}
            processingTime="6 to 12 months"
            price="39 EUR"
            buttonLabel="Get the Non-EU Guide"
            activationToken={activationTokens["non-eu"]}
            onOpenSelector={openGuideSelector}
          />
        </div>
        <div className="mx-auto mt-8 max-w-content px-4 text-center md:px-6">
          <Link
            href="/dsb-checklist"
            className="text-sm font-semibold text-gold transition-colors duration-300 hover:text-gold-hover"
          >
            Not ready to buy? Get the free checklist first →
          </Link>
        </div>
        <div className="mx-auto mt-10 max-w-content px-4 text-center text-sm text-text-secondary md:px-6">
          <p>
            Instant access after payment. Valid for 30 days. No download, secure online access.
          </p>
          <p className="mt-3">
            <a href="#waitlist" className="font-medium text-gold underline underline-offset-2 hover:text-gold-hover">
              Not ready to buy? Join the waitlist for free
            </a>
          </p>
        </div>
      </section>

      <section id="waitlist" className="border-t border-border bg-white py-16">
        <div className="mx-auto w-full max-w-xl px-4 md:px-6">
          <h2 className="text-center text-2xl font-bold text-navy">Stay Updated</h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Join the waitlist and be the first to know about new guides, updates and services.
          </p>

          {waitStatus === "success" ? (
            <p className="mt-8 rounded-lg border border-border bg-surface px-4 py-4 text-center text-sm text-navy">
              You are on the list. We will notify you at {submittedEmail} when new content is available.
            </p>
          ) : (
            <form onSubmit={submitWaitlist} className="mt-8 space-y-4">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <label className="block text-sm text-navy">
                First name*
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm text-navy">
                Email*
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm text-navy">
                Country*
                <input required value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
              </label>
              <fieldset>
                <legend className="text-sm text-navy">I am an*</legend>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <label className="flex items-center gap-2 text-sm text-navy">
                    <input
                      type="radio"
                      name="applicant_type"
                      checked={applicantType === "eu"}
                      onChange={() => setApplicantType("eu")}
                    />
                    EU/EEA Electrician
                  </label>
                  <label className="flex items-center gap-2 text-sm text-navy">
                    <input
                      type="radio"
                      name="applicant_type"
                      checked={applicantType === "non-eu"}
                      onChange={() => setApplicantType("non-eu")}
                    />
                    Non-EU Electrician
                  </label>
                </div>
              </fieldset>
              <label className="flex items-start gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={gdpr}
                  onChange={(e) => setGdpr(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span>
                  I agree to be contacted by ArbeidMatch Norge AS regarding DSB authorization services. I understand
                  my data will be stored securely and I can withdraw consent at any time. See our{" "}
                  <Link href="/privacy" className="font-medium text-gold hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {waitError && <p className="text-sm text-red-600">{waitError}</p>}
              <button
                type="submit"
                disabled={waitStatus === "loading"}
                className="w-full rounded-md bg-gold py-3 font-medium text-white hover:bg-gold-hover disabled:opacity-60"
              >
                {waitStatus === "loading" ? "Sending…" : "Join Waitlist"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
