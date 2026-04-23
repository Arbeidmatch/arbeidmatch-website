"use client";

import { startTransition, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Shield } from "lucide-react";

const COOKIE_CONSENT_SHOWN_KEY = "cookie_consent_shown";
const COOKIE_CONSENT_CHOICE_KEY = "cookie_consent_choice";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(COOKIE_CONSENT_SHOWN_KEY) === "true") return;
      startTransition(() => setVisible(true));
    } catch {
      startTransition(() => setVisible(true));
    }
  }, []);

  const closeConsent = (choice: "accept" | "decline") => {
    try {
      localStorage.setItem(COOKIE_CONSENT_SHOWN_KEY, "true");
      localStorage.setItem(COOKIE_CONSENT_CHOICE_KEY, choice);
    } catch {
      /* ignore */
    }
    void fetch("/api/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accepted: choice === "accept",
        acceptedAt: new Date().toISOString(),
        preferences: { essential: true, analytics: choice === "accept", marketing: false },
      }),
    }).catch(() => null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cookie-consent-updated"));
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label="Cookie notice"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      >
        <div className="mx-auto w-full rounded-2xl border border-white/10 bg-[#0D1B2A]/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 text-[#C9A84C]" />
            <div>
              <h3 className="text-sm font-semibold text-white">We use cookies</h3>
              <p className="mt-1 text-xs text-white/50">We use cookies to improve your experience.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => closeConsent("accept")}
              className="rounded-xl bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0D1B2A]"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => closeConsent("decline")}
              className="text-xs text-white/40 transition-colors hover:text-white"
            >
              Decline
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
