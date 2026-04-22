"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Star, X } from "lucide-react";

import { EASE_PREMIUM } from "@/lib/animationConstants";

const GOLD = "#C9A84C";

export type PartnerPreviewStatus = "idle" | "submitting" | "success" | "error";

type PartnerProfilePreviewModalProps = {
  open: boolean;
  presenceKey: string;
  reduceMotion: boolean;
  serviceTitle: string;
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  status: PartnerPreviewStatus;
};

export default function PartnerProfilePreviewModal({
  open,
  presenceKey,
  reduceMotion,
  serviceTitle,
  email,
  onEmailChange,
  onSubmit,
  onClose,
  status,
}: PartnerProfilePreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panelTransition = { duration: reduceMotion ? 0 : 0.38, ease: EASE_PREMIUM };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key={presenceKey}
          role="presentation"
          className="fixed inset-0 z-[10060] flex items-center justify-center overflow-y-auto bg-[#0D1B2A]/82 px-4 py-10 backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.24 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-preview-title"
            className="pointer-events-auto my-auto w-full max-w-xl"
            initial={reduceMotion ? false : { opacity: 0, x: 56, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 36, scale: 0.96 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
        <div className="relative rounded-[24px] border-2 border-[rgba(201,168,76,0.35)] bg-gradient-to-b from-[#111f2e] to-[#0b1520] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.55)] md:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Partner preview
          </p>
          <h2 id="partner-preview-title" className="mt-2 pr-10 font-display text-xl font-bold leading-snug text-white md:text-2xl">
            Here&apos;s how your business will appear on ArbeidMatch
          </h2>
          {serviceTitle ? (
            <p className="mt-2 text-sm text-white/50">
              Applying as: <span className="text-white/75">{serviceTitle}</span>
            </p>
          ) : null}

          <div className="mt-8 rounded-2xl border-2 border-[rgba(201,168,76,0.4)] bg-[#0a121c]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div
                className="mx-auto flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-lg font-bold tracking-tight text-[#0D1B2A] shadow-[0_8px_28px_rgba(201,168,76,0.35)] sm:mx-0"
                style={{
                  background: `linear-gradient(145deg, #f0e6c8 0%, ${GOLD} 42%, #8f7430 100%)`,
                }}
                aria-hidden
              >
                NT
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h3 className="font-display text-lg font-semibold text-white md:text-xl">Nordic Tax Solutions</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65 md:text-[15px]">
                  Certified accounting for EU/EEA workers in Norway
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#e4cf7a]"
                    style={{ borderColor: GOLD, background: "rgba(201,168,76,0.08)" }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Verified Partner
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-0.5 sm:justify-start" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#C9A84C] text-[#C9A84C]" strokeWidth={0} aria-hidden />
                  ))}
                </div>
                <span
                  className="mt-5 inline-block w-full rounded-xl py-3 text-center text-sm font-bold text-[#0D1B2A] shadow-[0_6px_24px_rgba(201,168,76,0.25)] sm:w-auto sm:px-8"
                  style={{
                    background: `linear-gradient(135deg, #e4cf7a 0%, ${GOLD} 50%, #a88a3a 100%)`,
                  }}
                  aria-hidden
                >
                  Contact Partner
                </span>
                <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40 sm:text-left">
                  Trusted by ArbeidMatch
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-center text-sm leading-relaxed text-white/70 md:text-[15px]">
            <p>Your listing will be seen by EU/EEA workers and Norwegian employers actively using our platform</p>
            <p className="text-white/85">Verified partners receive priority placement</p>
          </div>

          <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.45)] to-transparent" />

          {status === "success" ? (
            <p className="text-center text-[15px] leading-relaxed text-white/90">
              Thank you! We&apos;ll be in touch soon.
            </p>
          ) : (
            <>
              <label htmlFor="partner-preview-email" className="block text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                Enter your email to get started
              </label>
              <input
                id="partner-preview-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-[14px] border border-[rgba(201,168,76,0.38)] bg-[rgba(255,255,255,0.06)] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-[#C9A84C] focus:bg-[rgba(255,255,255,0.08)]"
              />
              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={!email.includes("@") || status === "submitting"}
                className="mt-5 w-full rounded-[12px] py-3.5 text-[15px] font-bold text-[#0D1B2A] transition disabled:opacity-45"
                style={{
                  background: `linear-gradient(135deg, #e4cf7a 0%, ${GOLD} 45%, #a88a3a 100%)`,
                  boxShadow: "0 8px 28px rgba(201,168,76,0.3)",
                }}
              >
                {status === "submitting" ? "Sending…" : "Apply for partnership"}
              </button>
              {status === "error" ? (
                <p className="mt-3 text-center text-[13px] text-red-300/90">Something went wrong. Please try again.</p>
              ) : null}
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-[12px] border border-white/20 py-3 text-sm font-semibold text-white/80 transition hover:border-white/35 hover:bg-white/5 hover:text-white"
          >
            Close preview
          </button>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
