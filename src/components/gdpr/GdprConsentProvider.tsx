"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { readGdprConsent, writeGdprConsent, type GdprStoredConsent } from "@/lib/gdpr/consentStorage";
import { isInternalNoIndexPath } from "@/lib/gdpr/noindexRoutes";
import GdprConsentForm from "@/components/gdpr/GdprConsentForm";

export type GdprConsentStatus = "unset" | GdprStoredConsent;

type GdprConsentContextValue = {
  hydrated: boolean;
  status: GdprConsentStatus;
  isNoIndexPath: boolean;
  accept: () => void;
  learnMoreDecline: () => void;
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

export default function GdprConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<GdprConsentStatus>("unset");
  const [catchupOpen, setCatchupOpen] = useState(false);

  const isNoIndexPath = useMemo(() => isInternalNoIndexPath(pathname), [pathname]);

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
    writeGdprConsent("accepted");
    setStatus("accepted");
    setCatchupOpen(false);
  }, []);

  const learnMoreDecline = useCallback(() => {
    writeGdprConsent("declined");
    setStatus("declined");
    setCatchupOpen(false);
    router.push("/privacy");
  }, [router]);

  const reopenForAcceptance = useCallback(() => {
    setCatchupOpen(true);
  }, []);

  const closeCatchup = useCallback(() => {
    setCatchupOpen(false);
  }, []);

  const showInitialOverlay = hydrated && status === "unset" && !isNoIndexPath;
  const showCatchupOverlay = hydrated && catchupOpen && status === "declined";
  const scrollLocked = showInitialOverlay || showCatchupOverlay;

  useEffect(() => {
    if (!scrollLocked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [scrollLocked]);

  const value = useMemo(
    () => ({
      hydrated,
      status,
      isNoIndexPath,
      accept,
      learnMoreDecline,
      reopenForAcceptance,
    }),
    [hydrated, status, isNoIndexPath, accept, learnMoreDecline, reopenForAcceptance],
  );

  return (
    <GdprConsentContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {showInitialOverlay ? (
          <motion.div
            key="gdpr-initial"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[480] flex items-center justify-center bg-[#0D1B2A]/92 px-4 py-8 backdrop-blur-[10px]"
            aria-hidden={false}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your Privacy Matters"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[min(100%,440px)] rounded-[20px] border border-[#C9A84C]/30 bg-[#0A0F18] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.55)] sm:p-8"
            >
              <GdprConsentForm showLearnMore onAccept={accept} onLearnMore={learnMoreDecline} />
            </motion.div>
          </motion.div>
        ) : null}
        {showCatchupOverlay ? (
          <motion.div
            key="gdpr-catchup"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 z-[485] flex items-center justify-center bg-[#0D1B2A]/92 px-4 py-8 backdrop-blur-[10px]"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Update privacy consent"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[min(100%,440px)] rounded-[20px] border border-[#C9A84C]/30 bg-[#0A0F18] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.55)] sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
                Update consent
              </p>
              <p className="mt-2 text-sm text-white/75">
                Accept the terms below to unlock applications and candidate profile features.
              </p>
              <div className="mt-5">
                <GdprConsentForm
                  showLearnMore={false}
                  catchupMode
                  onAccept={accept}
                  onCatchupCancel={closeCatchup}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </GdprConsentContext.Provider>
  );
}
