"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "am_cookie_consent_v1";
const SESSION_DISMISS_KEY = "am_cookie_banner_dismissed";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) === "accepted") return;
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") return;
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

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[320] border-t border-black/[0.12] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:left-6 sm:right-6 sm:rounded-2xl sm:border sm:px-6 sm:py-5"
      role="dialog"
      aria-label="Cookie notice"
    >
      <div className="mx-auto flex max-w-content flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-left text-[14px] leading-relaxed text-[#0f1923] sm:text-[15px]">
          <span className="text-[#0f1923]">
            We use essential cookies to operate this site. No tracking or advertising cookies are used.
          </span>{" "}
          <Link
            href="/privacy"
            className="font-semibold text-[#C9A84C] underline-offset-2 hover:text-[#b8953f] hover:underline"
            style={{ color: "#C9A84C" }}
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex flex-shrink-0 flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-black/[0.15] bg-transparent px-4 py-2.5 text-[14px] font-semibold text-[#374151] transition-colors hover:bg-black/[0.04]"
            style={{ color: "#374151" }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={accept}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-2.5 text-[14px] font-semibold text-[#0f1923] transition-colors hover:bg-[#b8953f]"
            style={{ backgroundColor: "#C9A84C", color: "#0f1923" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
