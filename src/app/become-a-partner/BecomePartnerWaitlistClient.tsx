"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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
      const response = await fetch("/api/employer/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus("error");
        setError(data.error || "Could not start access flow right now.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Could not start access flow right now.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#0D1B2A] px-4 text-white">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl rounded-2xl border border-[#C9A84C]/25 bg-white/[0.03] p-7 text-center md:p-10"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Find Your Next Hire</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/65 md:text-base">
          Enter your company email and we&apos;ll send you a secure access link.
        </p>
        {status === "success" ? (
          <p className="mt-6 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-3 text-sm text-[#C9A84C]">
            Check your inbox. We&apos;ve sent you a secure access link.
          </p>
        ) : (
          <div className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row">
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
              {status === "submitting" ? "Sending..." : "Get Access"}
            </button>
          </div>
        )}
        {status === "error" ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </motion.section>
    </main>
  );
}
