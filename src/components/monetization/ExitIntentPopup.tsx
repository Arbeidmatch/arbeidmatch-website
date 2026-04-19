"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_UNTIL = "am_exit_intent_until";

export default function ExitIntentPopup({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [enabled]);

  const dismiss = useCallback((persist: boolean) => {
    if (persist) {
      try {
        localStorage.setItem(STORAGE_UNTIL, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!enabled || !isDesktop) return;

    try {
      const until = localStorage.getItem(STORAGE_UNTIL);
      if (until && Date.now() < parseInt(until, 10)) return;
    } catch {
      /* ignore */
    }

    const onLeave = (e: MouseEvent) => {
      if (shownRef.current || e.clientY > 0) return;
      shownRef.current = true;
      setOpen(true);
    };

    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => document.documentElement.removeEventListener("mouseleave", onLeave);
  }, [enabled, isDesktop]);

  if (!enabled || !isDesktop) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="exit-overlay"
          className="fixed inset-0 z-[150] flex items-end justify-center p-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#030508]/75 backdrop-blur-[2px]"
            aria-label="Close dialog backdrop"
            onClick={() => dismiss(true)}
          />
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl border border-gold/25 bg-[#0a1018]/85 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/[0.07] via-transparent to-transparent" />
            <div className="relative px-7 pb-7 pt-8 text-center sm:px-8 sm:pt-9">
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-4xl animate-pulse-glow"
                aria-hidden
              >
                ⚡
              </div>
              <h2
                id="exit-intent-title"
                className="font-sans text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                Before you leave...
              </h2>
              <p className="mt-3 bg-gradient-to-r from-gold via-amber-200 to-gold bg-clip-text text-base font-medium text-transparent sm:text-lg">
                Grab the free EU/EEA DSB document checklist, instant email delivery.
              </p>
              <div className="mt-8">
                <Link
                  href="/dsb-support"
                  onClick={() => dismiss(true)}
                  className="btn-gold-shine relative inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b8923f] via-gold to-[#d4b45c] px-6 py-3.5 text-sm font-semibold text-[#0a0f14] shadow-[0_8px_32px_rgba(201,168,76,0.35)] transition-[transform,box-shadow] duration-300 ease-premium hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(201,168,76,0.45)]"
                >
                  DSB Authorization Guide
                </Link>
              </div>
              <button
                type="button"
                onClick={() => dismiss(true)}
                className="mt-5 min-h-[44px] w-full rounded-md px-3 py-2.5 text-xs font-medium text-white/55 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
              >
                No thanks, continue browsing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
