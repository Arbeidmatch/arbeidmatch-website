"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * First-party pageview beacon for the public site.
 *
 * It posts to this site's own /api/track, never to ats.arbeidmatch.no: since
 * 6 September 2026 the ATS refuses calls from a visitor's browser (the owner's
 * rule: the public never talks to the ATS host from a browser), and every
 * beacon sent there was a 404. The route writes the row into the same table
 * the ATS uses, by the same rules; see src/lib/analytics/pageview.ts.
 *
 * No cookies and no identifiers: the server derives a visitor hash from IP + user agent + the
 * current date + a salt, and never stores the raw IP. That is why this does not sit behind the
 * cookie banner - there is nothing to consent to.
 *
 * The body is sent as text/plain so sendBeacon can carry it; the route parses the JSON itself.
 */

const SINK = "/api/track";

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
      }).catch(() => {});
    } catch {
      /* analytics is best-effort and must never break the page */
    }
  }, [pathname]);

  return null;
}
