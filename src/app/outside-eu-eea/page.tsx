"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function OutsideEuEeaPage() {
  const router = useRouter();
  const [targetRegion, setTargetRegion] = useState<"Scandinavia" | "Europe" | "">("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState("");

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetRegion || !contactEmail.trim() || !contactEmail.includes("@")) {
      setError("Please select your preferred region and enter a valid email.");
      return;
    }

    const params = new URLSearchParams({
      region: targetRegion,
      email: contactEmail.trim(),
    });
    router.push(`/eligibility-assistance?${params.toString()}`);
  };

  return (
    <section className="bg-surface py-12">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
        <div className="rounded-xl border border-border bg-white p-6 shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <h1 className="text-3xl font-bold text-navy">Support for candidates outside EU/EEA</h1>
          <p className="mt-3 text-text-secondary">
            We understand your situation, your motivation, and your wish to work in Europe or
            Scandinavia. We are preparing practical support to help you better understand legal
            procedures, documentation steps, and what to do next.
          </p>
          <p className="mt-2 text-text-secondary">
            Share your details below and continue to the next support step.
          </p>

          <form onSubmit={handleContinue} className="mt-6 space-y-4">
            <label className="block text-sm text-navy">
              Where do you want to work?*
              <select
                className={inputClass}
                value={targetRegion}
                onChange={(event) => setTargetRegion(event.target.value as "Scandinavia" | "Europe" | "")}
              >
                <option value="">Select region</option>
                <option value="Scandinavia">Scandinavia</option>
                <option value="Europe">Europe</option>
              </select>
            </label>

            <label className="block text-sm text-navy">
              Your email*
              <input
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white hover:bg-gold-hover"
            >
              Continue to support form
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
