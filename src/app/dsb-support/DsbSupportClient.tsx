"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

function GuideCheckoutCard({
  guideSlug,
  badge,
  title,
  bullets,
  processingTime,
  price,
  buttonLabel,
  anchorId,
}: {
  guideSlug: "eu" | "non-eu";
  badge: string;
  title: string;
  bullets: string[];
  processingTime: string;
  price: string;
  buttonLabel: string;
  anchorId: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/dsb-guide/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guide_slug: guideSlug,
          email: email.trim(),
          website: "",
        }),
      });
      const data = (await res.json()) as { success?: boolean; checkout_url?: string; error?: string };
      if (!res.ok || !data.success || !data.checkout_url) {
        setStatus("error");
        setError(data.error || "Could not start checkout.");
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
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
      <form onSubmit={submit} className="mt-6 space-y-3">
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
          disabled={status === "loading"}
          className="w-full rounded-md bg-navy py-3 text-sm font-medium text-white transition hover:bg-gold hover:text-navy disabled:opacity-60"
        >
          {status === "loading" ? "Redirecting…" : buttonLabel}
        </button>
      </form>
    </article>
  );
}

export default function DsbSupportClient() {
  const searchParams = useSearchParams();
  const purchaseRequired = searchParams.get("purchase") === "required";

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [applicantType, setApplicantType] = useState<"eu" | "non-eu" | "">("");
  const [gdpr, setGdpr] = useState(false);
  const [waitStatus, setWaitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitError, setWaitError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

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
            price="19 EUR"
            buttonLabel="Get the EU/EEA Guide"
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
            price="49 EUR"
            buttonLabel="Get the Non-EU Guide"
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
