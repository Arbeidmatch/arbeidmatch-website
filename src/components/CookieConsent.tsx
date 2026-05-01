"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cookie_consent";
const COOKIE_CONSENT_SHOWN_KEY = "cookie_consent_shown";
const GA_MEASUREMENT_ID = "G-WWXXVW7Q98";

type ConsentValue = "accepted" | "rejected";

function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "accepted" || raw === "rejected") return raw;
    if (raw?.startsWith("{")) {
      const o = JSON.parse(raw) as { statistics?: boolean };
      if (typeof o?.statistics === "boolean") {
        const v: ConsentValue = o.statistics ? "accepted" : "rejected";
        localStorage.setItem(STORAGE_KEY, v);
        return v;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistChoice(value: ConsentValue) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    localStorage.setItem(COOKIE_CONSENT_SHOWN_KEY, "true");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cookie-consent-updated"));
  }
}

function Ga4Scripts({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init-arbeidmatch" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

export default function CookieConsent() {
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);
  const [gaEnabled, setGaEnabled] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setVisible(false);
      setGaEnabled(stored === "accepted");
    } else {
      setVisible(true);
      setGaEnabled(false);
    }
    setHydrated(true);
  }, []);

  const choose = useCallback((value: ConsentValue) => {
    persistChoice(value);
    setGaEnabled(value === "accepted");
    setVisible(false);
  }, []);

  if (!hydrated) return null;

  return (
    <>
      {gaEnabled ? <Ga4Scripts measurementId={GA_MEASUREMENT_ID} /> : null}

      {visible ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[100] w-full border-t border-[rgba(201,168,76,0.2)] bg-[#0D1B2A] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/90 sm:text-[15px]">
              We use cookies to analyze traffic and improve your experience. GA4 analytics only activates with your
              consent.
            </p>
            <div className="flex w-full shrink-0 flex-col gap-2 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:justify-end min-[420px]:gap-3">
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="min-h-11 w-full rounded-[10px] bg-gradient-to-br from-[#C9A84C] to-[#b8953f] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-95 min-[420px]:w-auto min-[420px]:min-w-[10rem]"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => choose("rejected")}
                className="min-h-11 w-full rounded-[10px] border border-white bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 min-[420px]:w-auto min-[420px]:min-w-[10rem]"
              >
                Reject non-essential
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
