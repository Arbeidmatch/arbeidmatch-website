"use client";

import { useCallback, useEffect, useState } from "react";

import { isWelcomeOpen, WELCOME_CLOSED_EVENT, WELCOME_OPEN_EVENT, welcomeLikelyPending } from "@/lib/welcomeOverlay";

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasAcknowledged()) return;

    // Never on top of the front page's "Welcome" picker: on a phone the banner
    // covered its buttons. Wait while it is open, show once it closes, and on a
    // first visit to the front page give it a moment to open first.
    let timer: number | undefined;
    const show = () => {
      window.clearTimeout(timer);
      if (!isWelcomeOpen() && !hasAcknowledged()) setVisible(true);
    };
    const hide = () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
    window.addEventListener(WELCOME_OPEN_EVENT, hide);
    window.addEventListener(WELCOME_CLOSED_EVENT, show);
    if (!isWelcomeOpen()) timer = window.setTimeout(show, welcomeLikelyPending() ? 2500 : 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(WELCOME_OPEN_EVENT, hide);
      window.removeEventListener(WELCOME_CLOSED_EVENT, show);
    };
  }, []);

  const dismiss = useCallback(() => {
    persistAcknowledged();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie information"
      className="fixed inset-x-3 bottom-3 z-[100] rounded-xl border border-gold/25 bg-navy p-3 shadow-xl sm:left-auto sm:max-w-md"
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/90">
          Only essential cookies. No advertising or tracking cookies.{" "}
          <a href="/cookies" className="text-gold underline underline-offset-2">Cookie policy</a>
        </p>
        <div className="shrink-0">
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
