"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [active, setActive] = useState(false);
  const [widthPct, setWidthPct] = useState(0);
  const firstRouteRef = useRef(true);

  useEffect(() => {
    if (firstRouteRef.current) {
      firstRouteRef.current = false;
      return;
    }
    setWidthPct(100);
    const t = window.setTimeout(() => {
      setActive(false);
      setWidthPct(0);
    }, 260);
    return () => clearTimeout(t);
  }, [routeKey]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!link) return;
      const a = link as HTMLAnchorElement;
      if (a.target === "_blank" || a.download) return;
      const hrefAttr = a.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.protocol === "mailto:" || url.protocol === "tel:") return;
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      setActive(true);
      setWidthPct(6);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setWidthPct(88));
      });
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  const show = active || widthPct > 0;

  return (
    <div
      className={`pointer-events-none fixed left-0 top-0 z-[10060] h-[2px] w-full overflow-hidden bg-[rgba(255,255,255,0.1)] transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    >
      <div
        className="h-full bg-[#C9A84C]"
        style={{
          width: `${widthPct}%`,
          transition: "width 340ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarInner />
    </Suspense>
  );
}
