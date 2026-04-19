"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface ComingSoonCaptureProps {
  featureName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ComingSoonCapture({ featureName, isOpen, onClose }: ComingSoonCaptureProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReducedMotion(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!isOpen || reducedMotion) return;
    const el = bellRef.current;
    if (!el) return;
    el.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(-8deg)" },
        { transform: "rotate(8deg)" },
        { transform: "rotate(0deg)" },
      ],
      { duration: 400, iterations: 3, easing: "ease-in-out" },
    );
  }, [isOpen, reducedMotion]);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setConsent(false);
      setStatus("idle");
    }
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), feature: featureName, consent: true }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data.success) {
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (!mounted || !isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        initial={reducedMotion ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: "easeOut" }}
        className="relative w-[90vw] max-w-[440px] rounded-[20px] border border-[rgba(201,168,76,0.25)] px-6 py-7 md:px-8 md:py-10"
        style={{ background: "#0f1923" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-white/40 transition-colors duration-150 hover:text-white"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div ref={bellRef} className="flex justify-center text-[#C9A84C]" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <h2 id="coming-soon-title" className="mt-3 text-center text-[20px] font-bold text-white">
          Coming Soon
        </h2>
        <p className="mt-3 text-center text-[14px] leading-[1.7] text-white/[0.6]">
          This feature is being prepared. Leave your email and we will notify you as soon as it is available.
        </p>
        {status === "success" ? (
          <div className="mt-6 flex flex-col items-center gap-2 text-center text-[14px] text-white/[0.85]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#22c55e]" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>You are on the list. We will email you when this is ready.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
            />
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-[12px] text-white/[0.6]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>I agree to receive updates from ArbeidMatch about this feature</span>
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-4 w-full rounded-[10px] py-3 text-[14px] font-bold text-[#0f1923] transition-opacity disabled:opacity-60"
              style={{ background: "#C9A84C" }}
            >
              Notify Me When Ready
            </button>
            {status === "error" ? (
              <p className="mt-2 text-center text-[13px] text-red-400">Something went wrong. Please try again.</p>
            ) : null}
          </form>
        )}
      </motion.div>
    </div>
  );

  return createPortal(modal, document.body);
}
