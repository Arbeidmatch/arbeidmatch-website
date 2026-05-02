"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

function isValidEmail(value: string): boolean {
  const t = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export default function TalentNetworkJoinForm() {
  const [email, setEmail] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const canSubmit = emailOk && gdpr && !submitting;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/candidate-join-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), gdpr_consent: true }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(true);
        return;
      }
      setSuccess(true);
      setEmail("");
      setGdpr(false);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="mx-auto mt-8 max-w-lg text-center text-base text-white/90" role="status">
        Thank you! We will be in touch soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-4 text-left sm:max-w-2xl"
    >
      <label className="sr-only" htmlFor="talent-email">
        Email
      </label>
      <input
        id="talent-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="Your email"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="min-h-[48px] w-full rounded-lg border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.05)] px-4 text-[15px] text-white placeholder:text-white/40 focus:border-[#C9A84C] focus:outline-none focus:ring-0"
      />

      <label className="flex cursor-pointer gap-3 text-sm leading-relaxed text-white/80">
        <input
          type="checkbox"
          name="gdpr_consent"
          checked={gdpr}
          onChange={(ev) => setGdpr(ev.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-[rgba(201,168,76,0.35)] text-[#C9A84C] focus:ring-[#C9A84C]"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          . By submitting, I consent to ArbeidMatch processing my data for recruitment purposes.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-gold-premium inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] px-6 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:self-center"
      >
        Join our talent network →
      </button>

      {error ? (
        <p className="text-center text-sm text-red-300/95" role="alert">
          Something went wrong. Please try again or email us at cv@arbeidmatch.no
        </p>
      ) : null}
    </form>
  );
}
