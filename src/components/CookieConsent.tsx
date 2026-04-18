"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "am_cookie_consent_v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) === "accepted") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[95] pb-[env(safe-area-inset-bottom)] sm:left-auto sm:max-w-xl">
      <div className="rounded-xl border border-gold/25 bg-[#0a1018]/88 p-4 text-sm text-white/85 shadow-[0_14px_42px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p>
          We use essential cookies to operate this site. No tracking or advertising cookies are used.{" "}
          <Link href="/privacy" className="font-semibold text-gold hover:text-gold-hover">
            Privacy Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy hover:bg-gold-hover"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
