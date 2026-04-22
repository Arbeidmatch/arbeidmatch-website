"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

const IDLE_MS = 8000;
const SCROLL_DELTA = 100;
const SHOW_DELAY_MS = 300;
const SESSION_PREFIX = "am_helper_shown_";
const DISMISS_UNTIL_KEY = "am_helper_dismissed_until";

type HelperConfig = {
  icon: string;
  title: string;
  text: string;
  cta: { label: string; href: string } | null;
};

const HELPERS: Record<string, HelperConfig> = {
  "/": {
    icon: "💼",
    title: "Looking for workers?",
    text: "Request pre-screened EU/EEA candidates for your Norwegian business.",
    cta: { label: "Request Candidates →", href: "/request" },
  },
  "/for-candidates": {
    icon: "⚡",
    title: "Ready to apply?",
    text: "Browse open positions in Norway. Electricians: authorization guide and checklist are on our Electricians in Norway page.",
    cta: { label: "See open positions →", href: "https://jobs.arbeidmatch.no" },
  },
  "/for-employers": {
    icon: "🤝",
    title: "Need workers fast?",
    text: "First candidate profiles are often ready within approximately two weeks, depending on role, location, and current capacity.",
    cta: { label: "Request now →", href: "/request" },
  },
  "/partners": {
    icon: "🌐",
    title: "Become a partner",
    text: "Interested in reaching EU/EEA workers and Norwegian businesses?",
    cta: { label: "Contact us →", href: "/contact" },
  },
  "/about": {
    icon: "📬",
    title: "Get in touch",
    text: "Have questions about our services? We respond within 24 hours.",
    cta: { label: "Contact →", href: "/contact" },
  },
  "/contact": {
    icon: "⏱️",
    title: "We respond fast",
    text: "Most inquiries receive a response within 24 hours on business days.",
    cta: null,
  },
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/$/, "") || "/";
}

function isGloballyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_UNTIL_KEY);
    if (!raw) return false;
    const until = Number.parseInt(raw, 10);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function wasShownThisSession(path: string): boolean {
  try {
    return sessionStorage.getItem(`${SESSION_PREFIX}${path}`) === "1";
  } catch {
    return false;
  }
}

function markShownThisSession(path: string) {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${path}`, "1");
  } catch {
    /* ignore */
  }
}

function setDismiss24h() {
  try {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_UNTIL_KEY, String(until));
  } catch {
    /* ignore */
  }
}

export default function ContextualHelper() {
  const pathname = usePathname();
  const path = normalizePath(pathname ?? "/");
  const config = HELPERS[path];

  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollBaselineRef = useRef(0);
  const pathRef = useRef(path);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (showDelayRef.current) {
      clearTimeout(showDelayRef.current);
      showDelayRef.current = null;
    }
  }, []);

  const hideHelper = useCallback(() => {
    setVisible(false);
  }, []);

  const scheduleIdle = useCallback(() => {
    clearTimers();
    const p = pathRef.current;
    if (!HELPERS[p]) return;
    if (isGloballyDismissed()) return;
    if (wasShownThisSession(p)) return;
    if (visibleRef.current) return;

    scrollBaselineRef.current =
      typeof window !== "undefined" ? window.scrollY || document.documentElement.scrollTop || 0 : 0;

    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      if (isGloballyDismissed()) return;
      if (wasShownThisSession(p)) return;
      if (visibleRef.current) return;

      showDelayRef.current = setTimeout(() => {
        showDelayRef.current = null;
        if (isGloballyDismissed()) return;
        if (wasShownThisSession(pathRef.current)) return;
        if (visibleRef.current) return;
        markShownThisSession(pathRef.current);
        setVisible(true);
      }, SHOW_DELAY_MS);
    }, IDLE_MS);
  }, [clearTimers]);

  const bumpIdle = useCallback(() => {
    if (visibleRef.current) return;
    scheduleIdle();
  }, [scheduleIdle]);

  useEffect(() => {
    clearTimers();
    startTransition(() => setVisible(false));

    if (!config) {
      return;
    }

    if (isGloballyDismissed() || wasShownThisSession(path)) {
      return;
    }

    const onScroll = () => {
      if (visibleRef.current) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (Math.abs(y - scrollBaselineRef.current) > SCROLL_DELTA) {
        scrollBaselineRef.current = y;
        bumpIdle();
      }
    };

    const onPointerOrKey = () => {
      if (visibleRef.current) return;
      bumpIdle();
    };

    const onInput = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.matches("input, textarea, select")) return;
      if (visibleRef.current) return;
      bumpIdle();
    };

    scheduleIdle();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onPointerOrKey, true);
    window.addEventListener("keydown", onPointerOrKey, true);
    document.addEventListener("input", onInput, true);

    return () => {
      clearTimers();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onPointerOrKey, true);
      window.removeEventListener("keydown", onPointerOrKey, true);
      document.removeEventListener("input", onInput, true);
    };
  }, [path, config, scheduleIdle, bumpIdle, clearTimers]);

  useEffect(() => {
    if (!visible) return;

    const dismiss = () => {
      hideHelper();
    };

    const onCaptureClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-helper-dismiss]")) {
        setDismiss24h();
      }
      hideHelper();
    };

    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("click", onCaptureClick, true);
    window.addEventListener("keydown", dismiss, true);
    document.addEventListener("input", dismiss, true);

    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("click", onCaptureClick, true);
      window.removeEventListener("keydown", dismiss, true);
      document.removeEventListener("input", dismiss, true);
    };
  }, [visible, hideHelper]);

  if (!config) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="complementary"
          aria-label="Contextual tip"
          variants={{
            hidden: { opacity: 0, x: 20, transition: { duration: 0.3, ease: "easeIn" } },
            show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
          }}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="pointer-events-auto fixed right-6 z-[96] w-[calc(100vw-48px)] max-w-[320px] max-sm:bottom-20 sm:bottom-[100px] sm:w-[280px]"
        >
          <div
            className="relative rounded-2xl border border-[rgba(201,168,76,0.15)] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(201,168,76,0.1)]"
            style={{
              background: "rgba(16, 18, 30, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <button
              type="button"
              data-helper-dismiss
              className="absolute right-3 top-3 rounded-md p-1 text-white/50 transition-opacity hover:opacity-100 hover:text-white/95"
              aria-label="Dismiss tip for 24 hours"
            >
              <span className="block text-lg leading-none" aria-hidden>
                ×
              </span>
            </button>
            <div className="flex items-start gap-2 pr-8">
              <span className="text-xl leading-none" aria-hidden>
                {config.icon}
              </span>
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-white/95 sm:text-sm">{config.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/70 sm:text-[13px]">{config.text}</p>
                {config.cta &&
                  (config.cta.href.startsWith("http") ? (
                    <a
                      href={config.cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs font-medium text-[#C9A84C] transition-colors hover:text-[#C9A84C] sm:text-[13px]"
                    >
                      {config.cta.label}
                    </a>
                  ) : (
                    <Link
                      href={config.cta.href}
                      className="mt-3 inline-block text-xs font-medium text-[#C9A84C] transition-colors hover:text-[#C9A84C] sm:text-[13px]"
                    >
                      {config.cta.label}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
