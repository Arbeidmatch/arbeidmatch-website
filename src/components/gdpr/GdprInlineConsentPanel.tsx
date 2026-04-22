"use client";

import { motion } from "framer-motion";

import { useGdprConsent } from "@/components/gdpr/GdprConsentProvider";
import GdprConsentForm from "@/components/gdpr/GdprConsentForm";

/** Shown on noindex routes when the user has not chosen accept vs read-only yet (no full-site overlay there). */
export default function GdprInlineConsentPanel() {
  const { hydrated, status, isNoIndexPath, accept, learnMoreOpenPrivacy } = useGdprConsent();

  if (!hydrated || status !== "unset" || !isNoIndexPath) return null;

  return (
    <div className="container-site py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-lg rounded-[18px] border border-[#C9A84C]/28 bg-[#0A0F18] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.4)] md:p-8"
        role="region"
        aria-label="Privacy and consent"
      >
        <GdprConsentForm showLearnMore onAccept={accept} onLearnMore={learnMoreOpenPrivacy} />
      </motion.div>
    </div>
  );
}
