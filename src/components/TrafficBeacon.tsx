"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party pageview beacon for the public site, posting to the ATS sink so marketing traffic
 * and application traffic land in one table and can be reported together.
 *
 * No cookies and no identifiers: the server derives a visitor hash from IP + user agent + the
 * current date + a salt, and never stores the raw IP. That is why this does not sit behind the
 * cookie banner - there is nothing to consent to.
 *
 * The body is sent as text/plain on purpose. That keeps it a CORS-simple request, so the browser
 * issues no preflight and the sink needs no OPTIONS handler; the server parses the JSON from the
 * body regardless of the declared type.
 */

const SINK = "https://ats.arbeidmatch.no/api/public/track";

export function TrafficBeacon() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastSent.current === pathname) return;
    lastSent.current = pathname;
    try {
      const payload = JSON.stringify({
        path: pathname,
        ref: document.referrer || null,
        host: window.location.host,
      });
      const blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon && navigator.sendBeacon(SINK, blob)) return;
      void fetch(SINK, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        keepalive: true,
        mode: "no-cors",
      }).catch(() => {});
    } catch {
      /* analytics is best-effort and must never break the page */
    }
  }, [pathname]);

  return null;
}
