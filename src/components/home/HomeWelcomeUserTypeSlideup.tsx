"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { trackEvent } from "@/lib/analytics";
import { writeHomeUserType } from "@/lib/homeUserType";
import { setNavigationUserType } from "@/lib/navigationUserType";

const TRANSITION = { duration: 0.3, ease: "easeOut" as const };

const WELCOME_DELAY_MS = 600;
const WELCOME_SHOWN_KEY = "welcome_shown";

export default function HomeWelcomeUserTypeSlideup() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = window.localStorage.getItem(WELCOME_SHOWN_KEY) === "true";
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;
    const timer = window.setTimeout(() => setOpen(true), WELCOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const markWelcomeShown = useCallback(() => {
    try {
      window.localStorage.setItem(WELCOME_SHOWN_KEY, "true");
    } catch {
      /* ignore */
    }
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
      markWelcomeShown();
      trackEvent("home_user_type", { userType: role, source: "welcome_slideup" });
      writeHomeUserType(role);
      setNavigationUserType(role);
      setOpen(false);
      router.push(role === "employer" ? "/for-employers" : "/for-candidates");
    },
    [markWelcomeShown, router],
  );

  const dismissBrowse = useCallback(() => {
    markWelcomeShown();
    trackEvent("home_user_type", { source: "welcome_slideup_browse", choice: "none" });
    try {
      window.sessionStorage.removeItem("roleSelected");
    } catch {
      /* ignore */
    }
    setNavigationUserType(null);
    setOpen(false);
  }, [markWelcomeShown]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="home-welcome-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-welcome-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={TRANSITION}
          onClick={dismissBrowse}
        >
          <motion.div
            className="w-[90%] max-w-[480px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0D1B2A] to-[#111f30] p-10 shadow-2xl sm:p-12"
            initial={reduceMotion ? false : { scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={reduceMotion ? undefined : { scale: 0.95 }}
            transition={TRANSITION}
            onClick={(e) => e.stopPropagation()}
          >
              <p id="home-welcome-title" className="text-center text-3xl font-semibold tracking-tight text-white">
                Welcome to ArbeidMatch
              </p>
              <p className="mt-2 text-center text-sm leading-relaxed text-white/60">
                Tell us who you are for a better experience
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => pick("employer")}
                  className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#C9A84C] px-4 text-base font-medium text-[#0D1B2A] transition hover:brightness-105"
                >
                  I&apos;m an Employer
                </button>
                <button
                  type="button"
                  onClick={() => pick("candidate")}
                  className="inline-flex h-14 w-full items-center justify-center rounded-xl border border-white/30 bg-transparent px-4 text-base font-medium text-white transition hover:bg-white/5"
                >
                  I&apos;m a Candidate
                </button>
              </div>
              <button
                type="button"
                onClick={dismissBrowse}
                className="mt-5 w-full text-center text-sm font-medium text-white/40 underline-offset-2 transition hover:text-white/70"
              >
                Just browsing
              </button>
              <p className="mt-6 text-center text-xs leading-relaxed text-white/30">
                By continuing you agree to our{" "}
                <Link href="/privacy" className="text-white/50 underline-offset-2 hover:text-white/75 hover:underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="text-white/50 underline-offset-2 hover:text-white/75 hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
