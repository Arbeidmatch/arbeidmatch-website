"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

function UnsubscribedContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = (params.get("email") || "").trim().toLowerCase();
  const [feedback, setFeedback] = useState("");
  const [step, setStep] = useState<"confirm" | "done">("confirm");
  const [submitting, setSubmitting] = useState(false);

  async function handleUnsubscribe() {
    if (!email.includes("@")) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feedback: feedback.trim() }),
      });
      if (response.ok) setStep("done");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResubscribe() {
    if (!email.includes("@")) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/unsubscribe/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D1B2A] px-4 py-8">
      <AnimatePresence mode="wait">
        {step === "confirm" ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-[520px] rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.04)] p-6 md:p-8"
          >
            <BellOff className="mx-auto h-10 w-10 text-[#C9A84C]" />
            <h1 className="mt-4 text-center text-2xl font-bold text-white">Are you sure you want to unsubscribe?</h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-white/65">
              You will no longer receive any emails from ArbeidMatch, including job alerts, profile updates, and important
              notifications.
            </p>
            <label className="mt-5 block text-sm text-white/75">
              Would you like to tell us why? (optional)
              <textarea
                maxLength={300}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2 min-h-[110px] w-full rounded-xl border border-[rgba(201,168,76,0.3)] bg-[#0D1B2A] p-3 text-sm text-white outline-none focus:border-[#C9A84C]"
              />
            </label>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void handleUnsubscribe()}
                disabled={submitting || !email.includes("@")}
                className="h-14 w-full rounded-xl border border-red-400/50 text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50"
              >
                Yes, unsubscribe me
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="h-14 w-full rounded-xl bg-[#C9A84C] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
              >
                No, keep me subscribed
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-[520px] rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.04)] p-6 text-center md:p-8"
          >
            <h2 className="text-2xl font-bold text-white">You have been unsubscribed.</h2>
            <p className="mt-3 text-sm text-white/65">If this was a mistake, click below to resubscribe.</p>
            <button
              type="button"
              onClick={() => void handleResubscribe()}
              disabled={submitting || !email.includes("@")}
              className="mt-5 h-14 w-full rounded-xl bg-[#C9A84C] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:opacity-50"
            >
              Resubscribe
            </button>
            <p className="mt-4 text-sm text-white/65">Thank you for being part of ArbeidMatch.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-[#C9A84C] hover:underline">
              Back to homepage
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      {!email.includes("@") ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
          Missing or invalid email in URL. Please use a valid unsubscribe link.
        </div>
      ) : null}
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense>
      <UnsubscribedContent />
    </Suspense>
  );
}
