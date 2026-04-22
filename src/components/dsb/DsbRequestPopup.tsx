"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function IconUsersPlus({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.75} />
      <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

const CHECKS = [
  "Pre-screened for DSB documentation",
  "Guide-based support for preparing documents before DSB submission",
  "Delivery within 2 to 4 weeks after approval",
] as const;

export default function DsbRequestPopup() {
  return null;
  const [open, setOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowFab(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showFab && !open && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-[50px] border border-[rgba(201,168,76,0.45)] bg-[#C9A84C] px-5 py-3.5 text-sm font-semibold text-[#0f1923] transition-transform duration-200 hover:scale-[1.04] md:bottom-8 md:right-8"
          >
            <IconUsersPlus className="shrink-0" />
            <span className="hidden md:inline">Request an electrician candidate</span>
            <span className="md:hidden">Request a candidate</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0f18] p-4 backdrop-blur-[4px] md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dsb-popup-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-[95vw] max-w-[520px] rounded-[20px] border border-[rgba(201,168,76,0.25)] bg-[#0f1923] px-6 py-8 text-white md:px-12 md:py-12"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-white/50 transition-colors hover:text-white md:right-4 md:top-4"
                aria-label="Close dialog"
              >
                <IconClose />
              </button>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
                Need a DSB-approved electrician?
              </p>
              <h3 id="dsb-popup-title" className="mt-3 text-2xl font-bold text-white">
                We find the candidate for you
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-white/[0.65]">
                ArbeidMatch has access to pre-screened EU/EEA electricians with DSB approval or an active application. We
                support sourcing and practical preparation, while official DSB processing and decisions are handled directly
                by DSB.
              </p>
              <ul className="mt-8 space-y-3">
                {CHECKS.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-white/85">
                    <IconCheck className="mt-0.5 shrink-0 text-[#C9A84C]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/request"
                  onClick={() => setOpen(false)}
                  className="group inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#C9A84C] px-8 py-4 text-[15px] font-semibold text-[#0f1923] transition-transform hover:scale-[1.02]"
                >
                  Send a request now
                  <IconArrow className="transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <a
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-[10px] border border-white/20 px-8 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/5"
                >
                  View all electrician roles
                </a>
              </div>
              <p className="mt-6 text-center text-xs text-white/40">No obligation. We will contact you within 24 hours.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
