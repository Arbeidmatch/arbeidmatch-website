"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type DsbType = "eu" | "non-eu";

const STORAGE_KEY = "am_dsb_type";

type DsbTypeSelectorProps = {
  /** When set, visibility is controlled by the parent (e.g. For Candidates modal). */
  isOpen?: boolean;
  /** Called when the user closes via X; also use for embedded mode from other pages (skip auto redirect). */
  onClose?: () => void;
};

export default function DsbTypeSelector({ isOpen: isOpenProp, onClose }: DsbTypeSelectorProps = {}) {
  const router = useRouter();
  const isControlled = isOpenProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  const open = isControlled ? Boolean(isOpenProp) : internalOpen;

  useEffect(() => {
    const embedded = typeof onClose === "function";
    if (!embedded) {
      try {
        const savedType = localStorage.getItem(STORAGE_KEY);
        if (savedType === "eu") {
          router.replace("/dsb-support/eu");
          return;
        }
        if (savedType === "non-eu") {
          router.replace("/dsb-support/non-eu");
          return;
        }
      } catch {
        // ignore storage errors
      }
    }

    if (isControlled) return;

    const delay = embedded ? 0 : 1000;
    const timer = window.setTimeout(() => setInternalOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, [router, isControlled, onClose]);

  useEffect(() => {
    if (!open) {
      setShowCloseButton(false);
      return;
    }
    const delay = window.setTimeout(() => setShowCloseButton(true), 6000);
    return () => window.clearTimeout(delay);
  }, [open]);

  const selectType = (type: DsbType) => {
    try {
      localStorage.setItem(STORAGE_KEY, type);
    } catch {
      // ignore storage errors
    }
    router.push(type === "eu" ? "/dsb-support/eu" : "/dsb-support/non-eu");
  };

  const dismissWithoutSelection = () => {
    onClose?.();
    if (!isControlled) setInternalOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#030508]/82 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl backdrop-saturate-150 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="relative max-h-[min(92dvh,920px)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-gold/25 bg-[#0a1018]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:p-8"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {showCloseButton && (
              <motion.button
                type="button"
                onClick={dismissWithoutSelection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                title="I'll decide later"
                aria-label="I'll decide later"
                className="absolute right-2 top-2 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#c4c4c4] transition-colors hover:bg-white/10 hover:text-white sm:right-3 sm:top-3"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </motion.button>
            )}
            <h2 className="pr-10 text-center text-2xl font-bold leading-tight text-white sm:pr-0 sm:text-3xl md:text-4xl">
              Are you an EU/EEA citizen?
            </h2>
            <p className="mt-3 text-center text-sm text-white/85 sm:text-base">
              Select your category to see the right guide for you
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <article className="rounded-xl border border-gold/45 bg-white/[0.05] p-5 shadow-[0_0_25px_rgba(201,168,76,0.25)]">
                <p className="text-4xl" aria-hidden>
                  🇪🇺
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">EU/EEA Citizen</h3>
                <p className="mt-2 text-xs text-white/75">Romania, Poland, Bulgaria, Hungary + 24 more</p>
                <ul className="mt-4 space-y-2 text-sm text-emerald-100/95">
                  <li>- Faster process (2-4 months)</li>
                  <li>- No visa required</li>
                  <li>- Job placement available</li>
                </ul>
                <p className="mt-4 text-2xl font-bold text-gold">15 EUR</p>
                <button
                  type="button"
                  onClick={() => selectType("eu")}
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold py-3 text-sm font-bold text-navy transition hover:bg-gold-hover"
                >
                  I am EU/EEA →
                </button>
              </article>

              <article className="rounded-xl border border-amber-300/45 bg-white/[0.03] p-5">
                <p className="text-4xl" aria-hidden>
                  🌍
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Non-EU Citizen</h3>
                <p className="mt-2 text-xs text-white/75">Ukraine, India, Philippines, Serbia + others</p>
                <ul className="mt-4 space-y-2 text-sm text-white/90">
                  <li>- Longer process (6-12 months)</li>
                  <li>- Work visa required</li>
                  <li>- Individual DSB assessment</li>
                </ul>
                <p className="mt-4 text-2xl font-bold text-gold">39 EUR</p>
                <button
                  type="button"
                  onClick={() => selectType("non-eu")}
                  className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-md border border-amber-300/70 py-3 text-sm font-bold text-white transition hover:bg-amber-300/15"
                >
                  I am Non-EU →
                </button>
              </article>
            </div>

            <p className="mt-5 text-center text-xs text-white/70">
              Not sure? Check the EU/EEA country list{" "}
              <a
                href="https://en.wikipedia.org/wiki/European_Economic_Area"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold underline underline-offset-2 hover:text-gold-hover"
              >
                →
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
