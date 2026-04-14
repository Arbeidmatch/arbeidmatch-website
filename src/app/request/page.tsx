"use client";

import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function RequestPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/simple-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();

      if (data.success && data.token) {
        window.location.href = `/request/${data.token}`;
      } else {
        throw new Error("No token received");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-surface py-10">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-navy">Request Candidates</h1>
        <p className="mt-3 text-text-secondary">
          For Norwegian employers only. Fill in your details and we&apos;ll get you started.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-r-md border-l-4 border-gold bg-gold/10 p-3 text-sm text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-4 max-w-md space-y-4 rounded-xl border border-border bg-white p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Company name*</span>
            <input required name="company" className={inputClass} placeholder="Hansen AS" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Company email*</span>
            <input
              required
              name="email"
              type="email"
              className={inputClass}
              placeholder="post@company.no"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">
              What kind of candidate are you looking for?*
            </span>
            <textarea
              required
              name="job_summary"
              rows={2}
              className={inputClass}
              placeholder="E.g. 2 experienced carpenters for a construction project in Oslo, starting ASAP"
            />
          </label>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-md bg-gold py-4 text-lg font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? "Please wait..." : "Continue →"}
          </button>

          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              Something went wrong. Please email post@arbeidmatch.no
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
