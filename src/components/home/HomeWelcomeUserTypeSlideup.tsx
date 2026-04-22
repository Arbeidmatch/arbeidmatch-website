"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { trackEvent } from "@/lib/analytics";
import { writeHomeUserType } from "@/lib/homeUserType";
import { setNavigationUserType } from "@/lib/navigationUserType";

const TRANSITION = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

const WELCOME_DELAY_MS = 600;

export default function HomeWelcomeUserTypeSlideup() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), WELCOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pick = useCallback(
    (role: "employer" | "candidate") => {
      trackEvent("home_user_type", { userType: role, source: "welcome_slideup" });
      writeHomeUserType(role);
      setNavigationUserType(role);
      setOpen(false);
      router.push(role === "employer" ? "/for-employers" : "/for-candidates");
    },
    [router],
  );

  const dismissBrowse = useCallback(() => {
    trackEvent("home_user_type", { source: "welcome_slideup_browse", choice: "none" });
    try {
      window.sessionStorage.removeItem("roleSelected");
    } catch {
      /* ignore */
    }
    setNavigationUserType(null);
    setOpen(false);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="home-welcome-backdrop"
            type="button"
            aria-label="Close welcome"
            className="fixed inset-0 z-[218] bg-[#0D1B2A]/55 backdrop-blur-[2px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={TRANSITION}
            onClick={dismissBrowse}
          />
          <motion.div
            key="home-welcome-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-welcome-title"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[219] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6"
            initial={reduceMotion ? false : { y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: 140, opacity: 0 }}
            transition={TRANSITION}
          >
            <div
              className="pointer-events-auto w-full max-w-[440px] rounded-[22px] border border-[rgba(201,168,76,0.28)] bg-[linear-gradient(168deg,rgba(16,30,48,0.98),rgba(10,15,24,0.99))] px-6 py-7 shadow-[0_-20px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8"
              onClick={(e) => e.stopPropagation()}
            >
              <p id="home-welcome-title" className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
                Welcome to ArbeidMatch
              </p>
              <p className="mt-2 text-center text-sm leading-relaxed text-white/65">
                Tell us who you are for a better experience
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => pick("employer")}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#C9A84C] px-4 text-sm font-bold text-[#0D1B2A] transition hover:brightness-105"
                >
                  I&apos;m an Employer
                </button>
                <button
                  type="button"
                  onClick={() => pick("candidate")}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[rgba(201,168,76,0.45)] bg-transparent px-4 text-sm font-semibold text-[#C9A84C] transition hover:bg-[rgba(201,168,76,0.08)]"
                >
                  I&apos;m a Candidate
                </button>
              </div>
              <button
                type="button"
                onClick={dismissBrowse}
                className="mt-5 w-full text-center text-xs font-medium text-white/40 underline-offset-2 transition hover:text-white/65"
              >
                Just browsing
              </button>
              <p className="mt-5 text-center text-[11px] leading-relaxed text-white/38">
                By continuing you agree to our{" "}
                <Link href="/privacy" className="text-[#C9A84C]/90 underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="text-[#C9A84C]/90 underline-offset-2 hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
