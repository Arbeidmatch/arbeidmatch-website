"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { readWarmOpen, type WarmOpen } from "@/lib/warm-request";

/**
 * Opens "Rask forespørsel" over the page from every link that asks us for
 * people (ORDER 224). Mounted once in the root layout.
 *
 * Such a link carries data-rask-foresporsel and keeps href="/request", so it
 * still works without JavaScript; a click with a modifier key or another
 * button than the first goes to the address as before. The popup itself is
 * loaded only when it opens.
 */

export const RASK_LINK_SELECTOR = "a[data-rask-foresporsel]";

const RaskForesporselDialog = dynamic(() => import("./RaskForesporselDialog"), { ssr: false });

/** Whether a click on the page is one this root takes over. */
export function shouldOpenRask(e: Pick<MouseEvent, "defaultPrevented" | "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "target">): HTMLAnchorElement | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const target = e.target as Element | null;
  const a = target && typeof target.closest === "function" ? (target.closest(RASK_LINK_SELECTOR) as HTMLAnchorElement | null) : null;
  if (!a) return null;
  const t = a.getAttribute("target");
  if (t && t !== "_self") return null;
  return a;
}

export default function RaskForesporselRoot() {
  const [open, setOpen] = useState(false);
  const [warm, setWarm] = useState<WarmOpen | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // A "Ja, vi trenger folk" from a warm-request letter opens the popup on its ticket (ATS ORDER 237).
  useEffect(() => {
    const found = readWarmOpen(new URLSearchParams(window.location.search));
    if (!found) return;
    setWarm(found);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = shouldOpenRask(e);
      if (!a) return;
      e.preventDefault();
      opener.current = a;
      setOpen(true);
    };
    // Capture: before the link's own navigation runs.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setWarm(null);
    const back = opener.current;
    opener.current = null;
    if (back && document.contains(back)) requestAnimationFrame(() => back.focus());
  }, []);

  return open ? <RaskForesporselDialog onClose={close} warm={warm} /> : null;
}
