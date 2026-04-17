"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function DsbAssistancePage() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@") || !consent) return;

    setStatus("submitting");
    try {
      const response = await fetch("/api/send-dsb-assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent: consent ? "Yes" : "No",
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="bg-surface py-12">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-xl border border-border bg-white p-8 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl font-bold text-white">
              ✓
            </div>
            <h1 className="mt-4 text-3xl font-bold text-navy">You are on the DSB assistance list</h1>
            <p className="mt-3 text-text-secondary">
              Thank you. We will contact you by email with details as soon as this support option becomes active.
            </p>
            <Link
              href="/for-candidates"
              className="mt-6 inline-flex rounded-md bg-[#0D1B2A] px-6 py-3 text-sm font-medium text-white hover:bg-[#122845]"
            >
              Back to For Candidates
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-12">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="rounded-xl border border-border bg-white p-8 shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <h1 className="text-3xl font-bold text-navy">DSB Support for Electricians</h1>
          <p className="mt-3 text-text-secondary">
            Need information on how electricians can apply for DSB approval in Norway? Leave your email
            below and we will contact you with guidance when this option is activated.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Email address*</span>
              <input
                required
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>

            <label className="flex items-start gap-2 rounded-md border border-border bg-white p-3 text-sm text-navy">
              <input
                required
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 accent-gold"
              />
              <span>
                I confirm that I agree to be contacted by email by ArbeidMatch about DSB assistance
                updates and related guidance.*
              </span>
            </label>

            <input type="text" name="website" autoComplete="off" tabIndex={-1} className="hidden" />

            <button
              type="submit"
              disabled={status === "submitting" || !consent || !email.includes("@")}
              className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? "Sending..." : "Notify me when DSB support is active"}
            </button>

            {status === "error" && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Something went wrong. Please try again or email post@arbeidmatch.no.
              </p>
            )}
          </form>

          <p className="mt-4 text-sm text-text-secondary">
            Looking for general support first? Visit{" "}
            <Link href="/contact" className="font-medium text-gold hover:text-gold-hover">
              Contact
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
