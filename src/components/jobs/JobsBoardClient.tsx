"use client";

import { useState } from "react";
import type { JobFilterOptions, JobRecord } from "@/lib/jobs/types";

interface JobsBoardClientProps {
  jobs: JobRecord[];
  filterOptions: JobFilterOptions;
}

export default function JobsBoardClient({ jobs: _jobs, filterOptions: _filterOptions }: JobsBoardClientProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submitWaitlist = async () => {
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          feature: "job-board",
          consent: true,
        }),
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="container-site pb-20 pt-8 md:pt-10">
      <div
        className="mx-auto max-w-[560px] rounded-[16px] border px-8 py-10 text-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(201,168,76,0.15)",
          borderTop: "2px solid rgba(201,168,76,0.35)",
        }}
      >
        <div className="mx-auto flex h-8 w-8 items-center justify-center text-[#C9A84C]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7.8v4.8l3.2 1.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="mt-4 text-[22px] font-bold text-white">Job listings coming soon.</h2>
        <p className="mt-2 text-[15px] leading-[1.7] text-[rgba(255,255,255,0.55)]">
          We are currently building our job board. Sign up below to be notified when positions become available.
        </p>

        {status === "success" ? (
          <div className="mt-6">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A84C]/50 text-[#C9A84C]">
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#C9A84C]">You are on the list. We will notify you.</p>
          </div>
        ) : (
          <div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              className="mt-6 h-12 w-full rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0A0F18] px-4 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,168,76,0.45)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void submitWaitlist()}
              disabled={status === "loading" || !email.includes("@")}
              className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Submitting..." : "Notify me when available"}
            </button>
            {status === "error" ? (
              <p className="mt-3 text-xs text-[#E24B4A]">Could not save your request. Please try again.</p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
