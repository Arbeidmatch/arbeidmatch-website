"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Smartphone } from "lucide-react";

function IconApple({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0 text-white/50">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function IconPlay({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-white/50">
      <path
        d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11z"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.9"
      />
      <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" />
    </svg>
  );
}

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
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#06090e] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,168,76,0.14), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(13,27,42,0.5), transparent), linear-gradient(180deg, #0a0c14 0%, #06090e 50%, #05070b 100%)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-content flex-col items-center px-4 py-16 md:px-6 md:py-24">
        <motion.div
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={reduce ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/35 bg-[#111320]/90 text-gold shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
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
          className="mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#111320]/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md md:p-8"
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
          {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
          {status === "success" && (
            <p className="mt-2 text-center text-sm text-emerald-300">You&apos;re on the list. We&apos;ll be in touch.</p>
          )}
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="btn-gold-premium mt-5 w-full rounded-lg bg-gradient-to-r from-[#b8923f] via-gold to-[#d4b45c] py-3 text-sm font-semibold text-[#0a0f14] shadow-[0_8px_28px_rgba(201,168,76,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="store-badge-disabled flex flex-1 cursor-not-allowed items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left opacity-55"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <IconApple size={22} />
            </span>
            <span className="text-[11px] leading-tight text-white/45">
              Download on the <span className="block text-sm font-semibold text-white/55">App Store</span>
            </span>
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="store-badge-disabled flex flex-1 cursor-not-allowed items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left opacity-55"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <IconPlay size={22} />
            </span>
            <span className="text-[11px] leading-tight text-white/45">
              Get it on <span className="block text-sm font-semibold text-white/55">Google Play</span>
            </span>
          </button>
        </div>

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
