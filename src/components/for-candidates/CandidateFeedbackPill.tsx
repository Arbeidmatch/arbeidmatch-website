"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";

const LS_KEY = "am_feedback_pill_dismissed";
const AUTO_MS = 8000;
const EXIT_MS = 400;

export default function CandidateFeedbackPill() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const performDismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      /* ignore */
    }
    clearTimer();
    setExiting(true);
    window.setTimeout(() => setVisible(false), EXIT_MS);
  }, [clearTimer]);

  const scheduleDismiss = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      performDismiss();
    }, AUTO_MS);
  }, [clearTimer, performDismiss]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      if (localStorage.getItem(LS_KEY)) return;
    } catch {
      return;
    }
    setVisible(true);
  }, [mounted]);

  useEffect(() => {
    if (!visible || exiting) return;
    scheduleDismiss();
    return () => clearTimer();
  }, [visible, exiting, scheduleDismiss, clearTimer]);

  const handlePointerEnter = () => {
    if (exiting) return;
    clearTimer();
  };

  const handlePointerLeave = () => {
    if (exiting || !visible) return;
    scheduleDismiss();
  };

  const handleCloseClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    performDismiss();
  };

  if (!mounted || !visible) return null;

  return (
    <div className={`max-md:hidden md:block fixed bottom-[90px] right-4 z-[80] ${exiting ? "pointer-events-none" : ""}`}>
      <div
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        className={`origin-bottom-right transition-[opacity,transform] ease-in-out ${
          exiting
            ? "translate-x-5 opacity-0 duration-[400ms]"
            : "translate-x-0 opacity-50 duration-300 hover:opacity-100"
        }`}
      >
        <div className="relative max-w-[160px] scale-90 transition-transform duration-300 ease-in-out hover:scale-100">
          <button
            type="button"
            aria-label="Dismiss feedback link"
            onClick={handleCloseClick}
            className="absolute right-1 top-1 z-10 flex h-[14px] w-[14px] items-center justify-center rounded-sm text-[#888] transition-colors hover:text-white"
          >
            <span className="text-[12px] leading-none" aria-hidden>
              ×
            </span>
          </button>
          <Link
            href="/feedback"
            title="Share feedback about your candidate experience"
            className="block overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-[rgba(184,134,11,0.2)] bg-[rgba(10,12,20,0.8)] py-[6px] pl-3 pr-8 text-center text-[11px] leading-snug text-[#888] transition-colors hover:text-gold"
          >
            Share feedback about your candidate experience
          </Link>
        </div>
      </div>
    </div>
  );
}
