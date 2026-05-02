"use client";

import { useCallback, useEffect, useState } from "react";

const ACK_KEY = "cookie_info_acknowledged";
const LEGACY_CONSENT_KEY = "cookie_consent";
const LEGACY_SHOWN_KEY = "cookie_consent_shown";

function hasAcknowledged(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (localStorage.getItem(ACK_KEY) === "1") return true;
    if (localStorage.getItem(LEGACY_SHOWN_KEY) === "true") return true;
    const raw = localStorage.getItem(LEGACY_CONSENT_KEY);
    if (raw === "accepted" || raw === "rejected") return true;
    if (raw?.startsWith("{")) {
      const o = JSON.parse(raw) as { statistics?: boolean };
      if (typeof o?.statistics === "boolean") return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function persistAcknowledged() {
  try {
    localStorage.setItem(ACK_KEY, "1");
    localStorage.setItem(LEGACY_SHOWN_KEY, "true");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cookie-consent-updated"));
  }
}

export default function CookieConsent() {
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasAcknowledged());
    setHydrated(true);
  }, []);

  const dismiss = useCallback(() => {
    persistAcknowledged();
    setVisible(false);
  }, []);

  if (!hydrated) return null;

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie information"
      className="fixed inset-x-0 bottom-0 z-[100] w-full border-t border-[rgba(201,168,76,0.2)] bg-[#0D1B2A] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/90 sm:text-[15px]">
          We use only essential cookies required for the site to function. No third-party analytics or advertising
          cookies are used.
        </p>
        <div className="flex w-full shrink-0 min-[420px]:w-auto min-[420px]:justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 w-full rounded-[10px] bg-gradient-to-br from-[#C9A84C] to-[#b8953f] px-6 py-2.5 text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-95 min-[420px]:w-auto min-[420px]:min-w-[10rem]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
