"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Shield } from "lucide-react";

import {
  readGdprConsent,
  writeGdprConsentAccepted,
  type GdprStoredConsent,
} from "@/lib/gdpr/consentStorage";
import { isInternalNoIndexPath } from "@/lib/gdpr/noindexRoutes";

export type GdprConsentStatus = "unset" | GdprStoredConsent;

type GdprConsentContextValue = {
  hydrated: boolean;
  status: GdprConsentStatus;
  isNoIndexPath: boolean;
  accept: () => void;
  learnMoreOpenPrivacy: () => void;
  reopenForAcceptance: () => void;
};

const GdprConsentContext = createContext<GdprConsentContextValue | null>(null);

export function useGdprConsent(): GdprConsentContextValue {
  const ctx = useContext(GdprConsentContext);
  if (!ctx) {
    throw new Error("useGdprConsent must be used within GdprConsentProvider");
  }
  return ctx;
}

/** Safe for optional UI (e.g. tree without provider during tests) — returns null if missing. */
export function useGdprConsentOptional(): GdprConsentContextValue | null {
  return useContext(GdprConsentContext);
}

function isJobApplyPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return /^\/jobs\/[^/]+\/apply$/.test(path);
}

const snackTransition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };
const COOKIE_CONSENT_SHOWN_KEY = "cookie_consent_shown";

export default function GdprConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<GdprConsentStatus>("unset");
  const [catchupOpen, setCatchupOpen] = useState(false);
  const [cookieConsentShown, setCookieConsentShown] = useState(false);
  /** Hides initial snack to run exit animation; cleared in onExitComplete. */
  const [initialSnackClosing, setInitialSnackClosing] = useState(false);
  const dismissInitialAfterExitRef = useRef(false);

  const isNoIndexPath = useMemo(() => isInternalNoIndexPath(pathname), [pathname]);
  const hideInitialOnApplyPage = useMemo(() => isJobApplyPath(pathname), [pathname]);

  useEffect(() => {
    try {
      const stored = readGdprConsent();
      startTransition(() => {
        setStatus(stored ?? "unset");
        setCookieConsentShown(localStorage.getItem(COOKIE_CONSENT_SHOWN_KEY) === "true");
        setHydrated(true);
      });
    } catch {
      startTransition(() => {
        setStatus("unset");
        setCookieConsentShown(false);
        setHydrated(true);
      });
    }
  }, []);

  useEffect(() => {
    const refreshCookieState = () => {
      try {
        setCookieConsentShown(localStorage.getItem(COOKIE_CONSENT_SHOWN_KEY) === "true");
      } catch {
        setCookieConsentShown(false);
      }
    };
    if (typeof window === "undefined") return;
    window.addEventListener("cookie-consent-updated", refreshCookieState);
    window.addEventListener("storage", refreshCookieState);
    return () => {
      window.removeEventListener("cookie-consent-updated", refreshCookieState);
      window.removeEventListener("storage", refreshCookieState);
    };
  }, []);

  const accept = useCallback(() => {
    dismissInitialAfterExitRef.current = false;
    writeGdprConsentAccepted();
    setStatus("accepted");
    setCatchupOpen(false);
    setInitialSnackClosing(false);
  }, []);

  const learnMoreOpenPrivacy = useCallback(() => {
    if (typeof window === "undefined") return;
    window.open(new URL("/privacy", window.location.origin).href, "_blank", "noopener,noreferrer");
  }, []);

  const reopenForAcceptance = useCallback(() => {
    setCatchupOpen(true);
  }, []);

  const closeCatchup = useCallback(() => {
    setCatchupOpen(false);
  }, []);

  const requestDismissInitial = useCallback(() => {
    dismissInitialAfterExitRef.current = false;
    setInitialSnackClosing(true);
  }, []);

  const onInitialSnackExitComplete = useCallback(() => {
    setInitialSnackClosing(false);
    if (!dismissInitialAfterExitRef.current) return;
  }, []);

  const showInitialSnack =
    hydrated &&
    cookieConsentShown &&
    status === "unset" &&
    !initialSnackClosing &&
    !isNoIndexPath &&
    !catchupOpen &&
    !hideInitialOnApplyPage;

  const showCatchupSnack =
    hydrated &&
    cookieConsentShown &&
    catchupOpen &&
    status !== "accepted" &&
    (status === "declined" || status === "dismissed" || status === "unset");

  const motionSnack = reduceMotion
    ? { initial: false, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, x: 28, y: 28 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: 20, y: 20 },
      };

  const value = useMemo(
    () => ({
      hydrated,
      status,
      isNoIndexPath,
      accept,
      learnMoreOpenPrivacy,
      reopenForAcceptance,
    }),
    [hydrated, status, isNoIndexPath, accept, learnMoreOpenPrivacy, reopenForAcceptance],
  );

  return (
    <GdprConsentContext.Provider value={value}>
      {children}
      <AnimatePresence onExitComplete={onInitialSnackExitComplete}>
        {showInitialSnack ? (
          <motion.div
            key="gdpr-initial-snack"
            role="dialog"
            aria-modal="false"
            aria-label="Privacy notice"
            {...motionSnack}
            transition={reduceMotion ? { duration: 0 } : snackTransition}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
          >
            <div className="relative rounded-2xl border border-white/10 bg-[#0D1B2A]/95 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start gap-2.5">
                <Shield className="mt-0.5 h-4 w-4 text-[#C9A84C]" />
                <div>
                  <p className="text-sm font-semibold text-white">Your data, your rights</p>
                  <p className="mt-1 text-xs text-white/50">
                    You have the right to access, correct or delete your data at any time.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={accept}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white transition-colors hover:border-white/20 hover:text-white"
                >
                  Got it
                </button>
                <Link href="/privacy" className="text-xs text-[#C9A84C] hover:underline">
                  Learn more
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showCatchupSnack ? (
          <motion.div
            key="gdpr-catchup-snack"
            role="dialog"
            aria-modal="false"
            aria-label="Update privacy consent"
            {...motionSnack}
            transition={reduceMotion ? { duration: 0 } : snackTransition}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
          >
            <div className="relative rounded-2xl border border-white/10 bg-[#0D1B2A]/95 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-start gap-2.5">
                <Shield className="mt-0.5 h-4 w-4 text-[#C9A84C]" />
                <div>
                  <p className="text-sm font-semibold text-white">Your data, your rights</p>
                  <p className="mt-1 text-xs text-white/50">
                    You have the right to access, correct or delete your data at any time.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={accept}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white transition-colors hover:border-white/20 hover:text-white"
                >
                  Got it
                </button>
                <Link href="/privacy" className="text-xs text-[#C9A84C] hover:underline">
                  Learn more
                </Link>
                <button type="button" onClick={closeCatchup} className="text-xs text-white/40 hover:text-white">
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </GdprConsentContext.Provider>
  );
}
