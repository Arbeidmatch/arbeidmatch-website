"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const STORAGE_DISMISS = "am_premium_sticky_dismissed";

export default function StickyBottomBanner({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      if (localStorage.getItem(STORAGE_DISMISS) === "1") return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setVisible(true), 30_000);
    return () => window.clearTimeout(t);
  }, [enabled]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_DISMISS, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (!enabled || dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 72, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 72, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[85] flex h-14 items-center border-t border-gold/20 bg-[#0a1018]/88 backdrop-blur-xl"
        >
          <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-lg animate-pulse-glow"
                aria-hidden
              >
                ⚡
              </span>
              <p className="min-w-0 truncate text-sm font-medium sm:whitespace-normal">
                <span className="bg-gradient-to-r from-gold via-amber-100 to-gold bg-clip-text text-transparent">
                  Free DSB checklist for electricians
                </span>
                <span className="hidden text-white/70 sm:inline">. Norway-ready documents in one place.</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/dsb-checklist"
                className="rounded-full bg-gradient-to-r from-[#b8923f] to-gold px-4 py-2 text-xs font-semibold text-[#0a0f14] shadow-sm transition-transform duration-300 ease-premium hover:scale-[1.03] sm:text-sm"
              >
                Get it free
              </Link>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss banner"
                className="rounded-lg p-2 text-white/50 transition-all duration-300 ease-premium hover:rotate-90 hover:text-white"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
