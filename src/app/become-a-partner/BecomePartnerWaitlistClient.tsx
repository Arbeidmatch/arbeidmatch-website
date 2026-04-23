"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Status = "idle" | "submitting" | "success" | "error";

export default function BecomePartnerWaitlistClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.includes("@")) return;
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          feature: "partner_program",
          consent: true,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus("error");
        setError(data.error || "Could not join the waitlist right now.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Could not join the waitlist right now.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#0D1B2A] px-4 text-white">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl rounded-2xl border border-[#C9A84C]/30 bg-white/[0.03] p-8 text-center md:p-10"
          >
            <motion.svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-[#C9A84C]" fill="none" aria-hidden>
              <motion.path
                d="M20 7 9 18l-5-5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </motion.svg>
            <p className="mt-5 text-2xl font-bold text-white">You&apos;re on the list. We&apos;ll be in touch soon.</p>
          </motion.div>
        ) : (
          <motion.section
            key="waitlist"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl rounded-2xl border border-[#C9A84C]/25 bg-white/[0.03] p-7 text-center md:p-10"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">Recruiter Network</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
              We&apos;re building our partner network. Leave your email and we&apos;ll reach out when we&apos;re ready to onboard new
              partners.
            </p>
            <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-white/15 bg-[#0A1624] px-4 text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#C9A84C]/60"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={status === "submitting" || !email.includes("@")}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C] px-6 font-bold text-[#0D1B2A] transition hover:bg-[#b8953f] disabled:opacity-60"
              >
                {status === "submitting" ? "Joining..." : "Join the waitlist"}
              </button>
            </div>
            {status === "error" ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
