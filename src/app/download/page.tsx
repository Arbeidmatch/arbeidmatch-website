"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Smartphone } from "lucide-react";

export default function DownloadPage() {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/app-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, website: "" }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; message?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0f18] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,168,76,0.15), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, #0D1B2A, transparent), linear-gradient(180deg, #0a0f18 0%, #0a0f18 50%, #0a0f18 100%)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-content flex-col items-center px-4 py-12 md:px-6 md:py-20">
        <motion.div
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={reduce ? undefined : { duration: 3, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/35 bg-[#111e2e]/90 text-gold shadow-[0_12px_40px_#0a0f18]"
          aria-hidden
        >
          <Smartphone className="h-10 w-10" strokeWidth={1.25} />
        </motion.div>

        <motion.span
          initial={reduce ? undefined : { opacity: 0, scale: 0.92 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="badge-pulse-border inline-flex rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
        >
          In Development
        </motion.span>

        <motion.h1
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-center font-display text-4xl font-extrabold tracking-tight md:text-5xl"
        >
          ArbeidMatch App
        </motion.h1>
        <motion.p
          initial={reduce ? undefined : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-center text-lg text-white/75 md:text-xl"
        >
          Coming soon to iOS and Android.
        </motion.p>
        <motion.p
          initial={reduce ? undefined : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-white/60 md:text-base"
        >
          We are building something great. The ArbeidMatch app will let you find work, track your applications and stay
          connected with your employer from anywhere.
        </motion.p>

        <motion.form
          initial={reduce ? undefined : { opacity: 0, y: 14 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={onSubmit}
          className="mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#111e2e]/85 p-6 shadow-[0_20px_60px_#0a0f18] backdrop-blur-md md:p-8"
        >
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <p className="text-center text-sm font-semibold text-white">Join the waitlist</p>
          <label className="form-label-premium mt-4 block text-xs font-medium uppercase tracking-wide text-white/45">
            Email
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={status === "loading" || status === "success"}
              className="input-premium input-premium--dark mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          {error && <p className="mt-2 text-center text-sm text-[#E24B4A]">{error}</p>}
          {status === "success" && (
            <p className="mt-2 text-center text-sm text-[#1D9E75]">You&apos;re on the list. We&apos;ll be in touch.</p>
          )}
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="btn-gold-premium mt-5 w-full rounded-lg bg-gradient-to-r from-[#b8953f] via-gold to-[#C9A84C] py-3 text-sm font-semibold text-[#0a0f18] shadow-[0_8px_28px_rgba(201,168,76,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="form-submit-spinner" aria-hidden />
                Saving…
              </span>
            ) : status === "success" ? (
              "You\u2019re registered"
            ) : (
              "Notify me when it launches"
            )}
          </button>
        </motion.form>

        <p className="mt-10 text-center text-sm font-medium text-white/55">Mobile app coming soon</p>

        <Link
          href="/"
          className="link-text-premium mt-14 text-sm font-medium text-gold/90 transition-colors hover:text-gold"
        >
          Back to website →
        </Link>
      </div>
    </div>
  );
}
