"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function BetaBanner() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const timer = window.setTimeout(() => setOpen(false), 8000);
    document.addEventListener("mousedown", onOutsideClick);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="fixed bottom-3 right-3 z-50 sm:bottom-4 sm:right-4" role="status" aria-live="polite">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 w-full max-w-xs rounded-xl border border-white/10 bg-[#0D1B2A] p-4 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 text-white/40 transition-colors hover:text-white"
            >
              ×
            </button>
            <p className="pr-5 text-sm font-semibold text-white">We're actively building</p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              We're working in real time on improvements. You may experience occasional navigation issues or temporary
              glitches. Thank you for your patience.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-pointer flex items-center gap-2 rounded-full border border-white/10 bg-[#0D1B2A]/80 px-2.5 py-1 text-[11px] text-white/50 backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-xs"
      >
        <span className="h-2 w-2 rounded-full bg-[#C9A84C] motion-reduce:animate-none animate-pulse" aria-hidden />
        <span>We're building something great</span>
      </div>
    </div>
  );
}
