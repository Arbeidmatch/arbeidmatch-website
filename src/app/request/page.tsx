"use client";

import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function RequestPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(
        "https://hook.eu2.make.com/bbmwmdyizpu5yocou7uuel1dz5a26lxz",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

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
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-navy">Request Candidates</h1>
        <p className="mt-3 text-text-secondary">
          For Norwegian employers only. Fill in your details and we&apos;ll get you started.
        </p>

        <div className="mb-8 mt-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-border bg-white p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Full name*</span>
              <input required name="full_name" className={inputClass} placeholder="John Hansen" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Company name*</span>
              <input required name="company" className={inputClass} placeholder="Hansen AS" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Phone*</span>
              <input
                required
                name="phone"
                type="tel"
                className={inputClass}
                placeholder="+47 000 00 000"
              />
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
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">
              What kind of candidate are you looking for?*
            </span>
            <textarea
              required
              name="job_summary"
              rows={3}
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
