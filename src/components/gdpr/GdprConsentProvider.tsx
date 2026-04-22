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

import {
  readGdprConsent,
  writeGdprConsentAccepted,
  writeGdprConsentDismissed,
  type GdprStoredConsent,
} from "@/lib/gdpr/consentStorage";
import { isInternalNoIndexPath } from "@/lib/gdpr/noindexRoutes";
import GdprConsentForm from "@/components/gdpr/GdprConsentForm";

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

export default function GdprConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<GdprConsentStatus>("unset");
  const [catchupOpen, setCatchupOpen] = useState(false);
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
        setHydrated(true);
      });
    } catch {
      startTransition(() => {
        setStatus("unset");
        setHydrated(true);
      });
    }
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
    dismissInitialAfterExitRef.current = true;
    setInitialSnackClosing(true);
  }, []);

  const onInitialSnackExitComplete = useCallback(() => {
    setInitialSnackClosing(false);
    if (!dismissInitialAfterExitRef.current) return;
    dismissInitialAfterExitRef.current = false;
    writeGdprConsentDismissed();
    setStatus("dismissed");
  }, []);

  const showInitialSnack =
    hydrated &&
    status === "unset" &&
    !initialSnackClosing &&
    !isNoIndexPath &&
    !catchupOpen &&
    !hideInitialOnApplyPage;

  const showCatchupSnack =
    hydrated && catchupOpen && status !== "accepted" && (status === "declined" || status === "dismissed" || status === "unset");

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
            className="fixed bottom-4 right-4 z-[480] w-[min(100vw-2rem,420px)] max-w-[420px] sm:bottom-6 sm:right-6"
          >
            <div
              className="relative rounded-xl border border-[#C9A84C]/22 px-4 pb-4 pt-10 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              style={{ background: "rgba(13, 27, 42, 0.95)" }}
            >
              <GdprConsentForm
                compact
                showLearnMore
                showDismiss
                onDismiss={requestDismissInitial}
                onAccept={accept}
                onLearnMore={learnMoreOpenPrivacy}
              />
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
            className="fixed bottom-4 right-4 z-[485] w-[min(100vw-2rem,420px)] max-w-[420px] sm:bottom-6 sm:right-6"
          >
            <div
              className="relative rounded-xl border border-[#C9A84C]/22 px-4 pb-4 pt-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              style={{ background: "rgba(13, 27, 42, 0.95)" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Consent required</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/68">
                Accept below to unlock applications and candidate profile features.
              </p>
              <div className="mt-4">
                <GdprConsentForm
                  compact
                  showLearnMore={false}
                  catchupMode
                  onAccept={accept}
                  onCatchupCancel={closeCatchup}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </GdprConsentContext.Provider>
  );
}
