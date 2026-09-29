"use client";

import { useCallback, useEffect, useState } from "react";

import { isWelcomeOpen, WELCOME_CLOSED_EVENT, WELCOME_OPEN_EVENT, welcomeLikelyPending } from "@/lib/welcomeOverlay";

import { MARKETING_COOKIE_CONSENT_STORAGE_KEY, ANALYTICS_CONSENT_EVENT,
  parseStoredMarketingConsent, acceptAllConsent, defaultNecessaryOnlyConsent } from "@/lib/marketing-cookie-consent";

function hasAcknowledged(): boolean {
  try { return parseStoredMarketingConsent(localStorage.getItem(MARKETING_COOKIE_CONSENT_STORAGE_KEY)) !== null; }
  catch { return false; }
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

  const choose = useCallback((analytics: boolean) => {
    const choice = analytics ? acceptAllConsent() : defaultNecessaryOnlyConsent();
    try { localStorage.setItem(MARKETING_COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(choice)); }
    catch { /* No stored permission means no statistics. */ }
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
    void fetch("/api/cookie-consent", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analytics }), keepalive: true }).catch(() => {});
    setVisible(false);
  }, []);

  if (!visible) return <button type="button" onClick={() => setVisible(true)}
    className="fixed bottom-3 left-3 z-[90] min-h-11 rounded-lg border border-gold/40 bg-navy px-3 text-xs text-white">
    Cookie settings
  </button>;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookies and privacy"
      className="fixed inset-x-3 bottom-3 z-[100] rounded-xl border border-gold/25 bg-navy p-3 shadow-xl sm:left-auto sm:max-w-md"
    >
      <div className="flex flex-col gap-3">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/90">
          Essential storage keeps requested features working. Allow our own visit statistics? We record page categories, referring websites, approximate location and a daily visitor pseudonym only with your permission.{" "}
          <a href="/cookies" className="text-gold underline underline-offset-2">Cookie policy</a>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover"
          >
            Necessary only
          </button>
          <button type="button" onClick={() => choose(true)}
            className="min-h-11 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
