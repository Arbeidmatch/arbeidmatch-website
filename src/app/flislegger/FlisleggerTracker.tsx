"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function trackFlislegger(eventType: string, extra: Record<string, string> = {}) {
  const payload = JSON.stringify({ eventType, path: location.pathname, ref: document.referrer || null, ...extra });
  if (navigator.sendBeacon) { const blob = new Blob([payload], { type: "application/json" }); if (navigator.sendBeacon("/api/public/flislegger-track", blob)) return; }
  void fetch("/api/public/flislegger-track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
}

export function FlisleggerTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname?.startsWith("/flislegger")) return;
    const match = pathname.match(/^\/flislegger\/prosjekter\/([^/]+)/);
    trackFlislegger(match ? "project_view" : "page_view", match ? { projectSlug: match[1] } : {});
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (link && (link.getAttribute("href")?.includes("#kontakt") || link.href.startsWith("tel:") || link.href.startsWith("mailto:"))) trackFlislegger("cta_click");
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [pathname]);
  return null;
}

