"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const inputClass =
  "input-premium input-premium--dark w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-0";

export default function DsbChecklistClient() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !email.trim() || !email.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    if (!gdpr) {
      setError("Please accept the privacy terms to continue.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/dsb-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          email: email.trim(),
          gdpr_consent: gdpr,
          source: "dsb-checklist",
          website: "",
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#06090e] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(201,168,76,0.18),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(13,27,42,0.9),transparent),linear-gradient(180deg,#0a0f14_0%,#06090e_45%,#05070b_100%)]" />
      <div className="pointer-events-none absolute inset-0 mesh-checklist-bg opacity-40 mix-blend-soft-light" />
      <div className="am-noise pointer-events-none absolute inset-0" />

      <section className="relative px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-content md:px-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="badge-free-shimmer inline-flex items-center rounded-full border border-gold/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Free · Instant Access
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              Free DSB Checklist
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
              The complete EU/EEA document list for DSB electrician approval in Norway, formatted for action, delivered
              to your inbox.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-12 w-full max-w-md"
          >
            <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-px shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150">
              <div className="rounded-[15px] bg-[#0c1219]/88 p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {status === "success" ? (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-gold"
                      >
                        <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
                      </motion.div>
                      <h2 className="mt-5 font-display text-2xl font-bold text-white">Check your email!</h2>
                      <p className="mt-3 text-sm leading-relaxed text-white/65">
                        We sent the full EU/EEA DSB document checklist to <strong className="text-white">{email}</strong>.
                        If you don&apos;t see it in a few minutes, check spam or promotions.
                      </p>
                      <Link
                        href="/dsb-support"
                        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#b8923f] to-gold py-3 text-sm font-semibold text-[#0a0f14] transition-transform duration-300 ease-premium hover:scale-[1.02]"
                      >
                        Explore paid guides
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={submit}
                      className="space-y-5"
                    >
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        className="hidden"
                        aria-hidden
                      />
                      <div>
                        <label className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wide text-white/50">
                          First name
                        </label>
                        <input
                          required
                          value={firstName}
                          onChange={(ev) => setFirstName(ev.target.value)}
                          className={inputClass}
                          placeholder="Alex"
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-left text-xs font-medium uppercase tracking-wide text-white/50">
                          Email
                        </label>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(ev) => setEmail(ev.target.value)}
                          className={inputClass}
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors duration-300 hover:border-gold/30">
                        <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/25 bg-black/30">
                          <input
                            type="checkbox"
                            checked={gdpr}
                            onChange={(ev) => setGdpr(ev.target.checked)}
                            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                          <span className="h-2.5 w-2.5 scale-0 rounded-sm bg-gold transition-transform duration-300 peer-checked:scale-100" />
                        </span>
                        <span className="text-left text-xs leading-relaxed text-white/60">
                          I agree that ArbeidMatch Norge AS may email me the checklist and occasional updates about DSB
                          authorization. See our{" "}
                          <Link href="/privacy" className="font-medium text-gold hover:underline">
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                      {error && <p className="text-center text-sm text-red-400">{error}</p>}
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="btn-gold-shine relative w-full rounded-xl bg-gradient-to-r from-[#b8923f] via-gold to-[#d4b45c] py-3.5 text-sm font-semibold text-[#0a0f14] shadow-[0_8px_32px_rgba(201,168,76,0.3)] transition-[transform,opacity] duration-300 ease-premium hover:scale-[1.01] disabled:opacity-60"
                      >
                        {status === "loading" ? "Sending…" : "Email me the checklist"}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <p className="mt-8 text-center text-sm text-white/45">
              Join 500+ electricians who downloaded this
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
