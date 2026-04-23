"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const GDPR_ACCEPTED_KEY = "gdpr_accepted";
const GDPR_ACCEPTED_AT_KEY = "gdpr_accepted_at";
const GDPR_PREFERENCES_KEY = "gdpr_preferences";

type ConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<"main" | "manage">("main");
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const preferences = useMemo<ConsentPreferences>(
    () => ({ essential: true, analytics, marketing }),
    [analytics, marketing],
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      if (localStorage.getItem(GDPR_ACCEPTED_KEY) === "true") return;
      const saved = localStorage.getItem(GDPR_PREFERENCES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ConsentPreferences>;
        if (typeof parsed.analytics === "boolean") setAnalytics(parsed.analytics);
        if (typeof parsed.marketing === "boolean") setMarketing(parsed.marketing);
      }
      timeout = setTimeout(() => {
        startTransition(() => setVisible(true));
      }, 2000);
    } catch {
      timeout = setTimeout(() => {
        startTransition(() => setVisible(true));
      }, 2000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const persistConsent = async (prefs: ConsentPreferences) => {
    const acceptedAt = new Date().toISOString();
    try {
      localStorage.setItem(GDPR_ACCEPTED_KEY, "true");
      localStorage.setItem(GDPR_ACCEPTED_AT_KEY, acceptedAt);
      localStorage.setItem(GDPR_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    await fetch("/api/cookie-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true, acceptedAt, preferences: prefs }),
    }).catch(() => null);
    setVisible(false);
  };

  const acceptAll = () => void persistConsent({ essential: true, analytics: true, marketing: false });
  const savePreferences = () => void persistConsent(preferences);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label="Cookie notice"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-4 left-4 right-4 z-[320] sm:left-auto sm:right-6 sm:bottom-6"
      >
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#0D1B2A] p-6 shadow-2xl">
          {view === "main" ? (
            <div>
              <h3 className="text-lg font-semibold text-white">Your Privacy</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                We use cookies to improve your experience. No data is sold. You can withdraw consent at any time.
              </p>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="min-h-[48px] w-full rounded-xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#0D1B2A]"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setView("manage")}
                  className="min-h-[48px] w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white"
                >
                  Manage Preferences
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-white">Manage Preferences</h3>
              <div className="mt-4 space-y-3">
                <PreferenceToggle label="Essential cookies" checked disabled onChange={() => undefined} />
                <PreferenceToggle label="Analytics" checked={analytics} onChange={() => setAnalytics((v) => !v)} />
                <PreferenceToggle label="Marketing" checked={marketing} onChange={() => setMarketing((v) => !v)} />
              </div>
              <button
                type="button"
                onClick={savePreferences}
                className="mt-5 min-h-[48px] w-full rounded-xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#0D1B2A]"
              >
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PreferenceToggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left disabled:opacity-80"
      aria-pressed={checked}
    >
      <span className="text-sm text-white/85">{label}</span>
      <span
        className={`inline-flex h-6 w-11 items-center rounded-full p-1 transition ${
          checked ? "bg-[#C9A84C]/70" : "bg-white/20"
        }`}
      >
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}
