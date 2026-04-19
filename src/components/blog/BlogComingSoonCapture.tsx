"use client";

import { useState } from "react";

const GOLD = "#C9A84C";

export default function BlogComingSoonCapture() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setError("Please accept to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed.toLowerCase(), feature: "blog-updates", consent: true }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (data.success) {
        setSuccess(true);
        setEmail("");
        setConsent(false);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mb-8 rounded-[10px] border-l-[3px] border-solid px-7 py-6 md:px-8"
      style={{ background: "rgba(201,168,76,0.06)", borderLeftColor: GOLD }}
    >
      <p
        className="inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ background: "rgba(201,168,76,0.12)", color: GOLD }}
      >
        Coming Soon
      </p>
      <p className="mt-3 text-base font-semibold text-navy">More articles are being prepared.</p>
      <p className="mt-2 text-sm leading-[1.7]" style={{ color: "#374151" }}>
        We are working on practical guides for employers and workers. Topics include legal hiring in Norway, workers
        rights, tax registration, DSB authorization, and sector-specific guidance. Leave your email to be notified when
        new articles are published.
      </p>
      <div className="mt-5 flex max-w-[360px] flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="w-full rounded-lg border border-black/[0.12] bg-white px-3.5 py-2.5 text-[13px] text-navy outline-none"
        />
        <label className="flex cursor-pointer items-start gap-2 text-[12px]" style={{ color: "#6b7280" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20"
            style={{ accentColor: GOLD }}
          />
          <span>I agree to receive blog updates from ArbeidMatch</span>
        </label>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading}
          className="w-fit rounded-lg px-5 py-2.5 text-[13px] font-bold text-[#0f1923] disabled:opacity-70"
          style={{ background: GOLD }}
        >
          {loading ? "Sending..." : "Notify me of new articles"}
        </button>
      </div>
      {error ? <p className="mt-3 text-[13px] text-red-600">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-[13px] font-medium" style={{ color: "#1D9E75" }}>
          You are on the list. We will notify you when new articles are published.
        </p>
      ) : null}
    </div>
  );
}
