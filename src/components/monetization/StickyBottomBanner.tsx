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
          className="pointer-events-auto fixed bottom-0 left-0 right-0 z-[85] border-t border-gold/20 bg-[#0a1018]/92 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
        >
          <div className="mx-auto flex min-h-[56px] w-full max-w-content flex-col justify-center gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <span
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-lg animate-pulse-glow sm:flex"
                aria-hidden
              >
                ⚡
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug sm:text-base">
                <Link
                  href="/dsb-support"
                  className="block min-h-[44px] py-2 text-white/95 hover:text-white sm:hidden"
                >
                  ⚡ DSB Authorization Guide →
                </Link>
                <span className="hidden sm:block text-white/95">
                  <span className="bg-gradient-to-r from-gold via-amber-100 to-gold bg-clip-text text-transparent">
                    Free DSB checklist for electricians
                  </span>
                  <span className="text-white/85"> Norway-ready documents in one place.</span>
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
              <Link
                href="/dsb-support"
                className="hidden min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#b8923f] to-gold px-4 py-2 text-xs font-semibold text-[#0a0f14] shadow-sm transition-transform duration-300 ease-premium hover:scale-[1.03] sm:inline-flex sm:text-sm"
              >
                Open guide
              </Link>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss banner"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/50 transition-all duration-300 ease-premium hover:rotate-90 hover:text-white"
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
