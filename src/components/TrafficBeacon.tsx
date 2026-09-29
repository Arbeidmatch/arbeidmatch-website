"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from "@/lib/marketing-cookie-consent";

/** Optional first-party statistics. Recheck consent at every collection. */
export function TrafficBeacon() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);
  useEffect(() => {
    const collect = () => {
      if (!hasAnalyticsConsent() || !pathname || lastSent.current === pathname) return;
      try {
        // Never send query strings, record IDs or access tokens.
        const path = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
        const ref = document.referrer ? new URL(document.referrer).origin : null;
        const payload = JSON.stringify({ path, ref, host: window.location.host, consentVersion: 2 });
        lastSent.current = pathname;
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon && navigator.sendBeacon("/api/track", blob)) return;
        void fetch("/api/track", { method: "POST", body: payload,
          headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      } catch { /* Optional statistics must not interrupt navigation. */ }
    };
    collect();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, collect);
    window.addEventListener("storage", collect);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, collect);
      window.removeEventListener("storage", collect);
    };
  }, [pathname]);
  return null;
}
