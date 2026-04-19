"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

function sessionKey(pathname: string) {
  return `am_scroll_cta_${pathname}`;
}

export default function ScrollProgressCTA({ pathname }: { pathname: string }) {
  const [show, setShow] = useState(false);
  const dismissedRef = useRef(false);

  const enabled = pathname === "/for-candidates" || pathname === "/for-employers";

  useEffect(() => {
    if (!enabled) return;
    dismissedRef.current = false;
    try {
      if (sessionStorage.getItem(sessionKey(pathname))) {
        dismissedRef.current = true;
      }
    } catch {
      /* ignore */
    }

    const onScroll = () => {
      if (dismissedRef.current) return;
      try {
        if (sessionStorage.getItem(sessionKey(pathname))) {
          dismissedRef.current = true;
          return;
        }
      } catch {
        /* ignore */
      }
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return;
      const ratio = el.scrollTop / scrollable;
      if (ratio >= 0.6) {
        dismissedRef.current = true;
        setShow(true);
        try {
          sessionStorage.setItem(sessionKey(pathname), "1");
        } catch {
          /* ignore */
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, pathname]);

  const dismiss = () => {
    dismissedRef.current = true;
    setShow(false);
    try {
      sessionStorage.setItem(sessionKey(pathname), "1");
    } catch {
      /* ignore */
    }
  };

  if (!enabled) return null;

  const isEmployers = pathname === "/for-employers";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-32 right-4 z-[90] w-[min(calc(100vw-2rem),20rem)] max-w-[calc(100vw-2rem)] rounded-xl border border-gold/35 bg-[#0a1018]/95 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-border-glow sm:bottom-36 sm:right-6"
          role="complementary"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-1 top-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/45 transition-all duration-300 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
          <p className="pr-10 font-sans text-base font-bold leading-snug text-white">
            {isEmployers ? "Need EU/EEA talent this quarter?" : "Ready for your Norway move?"}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/65">
            {isEmployers
              ? "Send a staffing request, we source and screen for you."
              : "Browse verified roles and get matched with Norwegian employers."}
          </p>
          {isEmployers ? (
            <Link
              href="/request"
              className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#b8923f] to-gold py-2.5 text-sm font-semibold text-[#0a0f14] transition-transform duration-300 ease-premium hover:scale-[1.02]"
            >
              Request candidates
            </Link>
          ) : (
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#b8923f] to-gold py-2.5 text-sm font-semibold text-[#0a0f14] transition-transform duration-300 ease-premium hover:scale-[1.02]"
            >
              Browse open roles
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
