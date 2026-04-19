"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";
import { DSB_DISCOUNT } from "@/lib/dsbDiscountPricing";

import { DSB_DISCOUNT_LS_COUPON, DSB_DISCOUNT_LS_GUIDE } from "@/lib/dsbDiscountStorage";

const SESSION_SHOWN = "am_dsb_exit_popup_shown";
const LS_COUPON = DSB_DISCOUNT_LS_COUPON;
const LS_GUIDE = DSB_DISCOUNT_LS_GUIDE;

const POPUP_SECONDS = 10 * 60;

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function hasStoredCoupon(): boolean {
  try {
    return Boolean(localStorage.getItem(LS_COUPON)?.trim());
  } catch {
    return false;
  }
}

function sessionShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_SHOWN) === "1";
  } catch {
    return false;
  }
}

function setSessionShown() {
  try {
    sessionStorage.setItem(SESSION_SHOWN, "1");
  } catch {
    /* ignore */
  }
}

type Props = { guideType: DsbDiscountGuideType };

export default function DsbExitDiscountPopup({ guideType }: Props) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [reused, setReused] = useState(false);
  const [countdown, setCountdown] = useState(POPUP_SECONDS);
  const openedRef = useRef(false);

  const pricing = DSB_DISCOUNT[guideType];

  useEffect(() => {
    setMounted(true);
  }, []);

  const tryOpen = useCallback(() => {
    if (openedRef.current) return;
    if (sessionShown()) return;
    if (hasStoredCoupon()) return;
    openedRef.current = true;
    setSessionShown();
    setOpen(true);
    setCountdown(POPUP_SECONDS);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setOpen(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (hasStoredCoupon() || sessionShown()) return;

    const mobileTimer = window.setTimeout(() => {
      tryOpen();
    }, 45_000);

    const onMouseOut = (e: MouseEvent) => {
      if (typeof window === "undefined") return;
      if (window.matchMedia("(max-width: 767px)").matches) return;
      const to = e.relatedTarget as Node | null;
      if (!to && e.clientY < 24) {
        tryOpen();
      }
    };

    document.addEventListener("mouseout", onMouseOut);
    return () => {
      window.clearTimeout(mobileTimer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [tryOpen]);

  useEffect(() => {
    if (!success || !open) return;
    const t = window.setTimeout(() => setOpen(false), reused ? 4500 : 3000);
    return () => window.clearTimeout(t);
  }, [success, open, reused]);

  const submit = async () => {
    setError("");
    const em = email.trim().toLowerCase();
    if (!em.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dsb-guide/discount-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, guide_type: guideType, website: "" }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        couponCode?: string;
        reused?: boolean;
      };
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }
      try {
        localStorage.setItem(LS_COUPON, data.couponCode || "");
        localStorage.setItem(LS_GUIDE, guideType);
      } catch {
        /* ignore */
      }
      setSuccessEmail(em);
      setReused(Boolean(data.reused));
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => setOpen(false);

  if (!mounted) return null;

  const portal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dsb-exit-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dsb-exit-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            className="dsb-exit-sheet dsb-exit-modal-desktop"
            initial={reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: "100%", scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "100%", scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <button type="button" className="dsb-exit-close dsb-tap-scale" onClick={close} aria-label="Close">
              ×
            </button>

            {!success ? (
              <>
                <p className="dsb-exit-eyebrow">⚡ Wait - before you go</p>
                <h2 id="dsb-exit-title" className="dsb-exit-title">
                  Get {pricing.percentLabel} off today only
                </h2>
                <span className="dsb-exit-limited">Limited offer</span>

                <div className="dsb-exit-pricebox">
                  <div className="dsb-exit-price-row">
                    <span className="dsb-exit-reg">€{pricing.regular}</span>
                    <span className="dsb-exit-arrow">→</span>
                    <span className="dsb-exit-sale">€{pricing.discounted}</span>
                  </div>
                  <p className="dsb-exit-countdown-label">Offer closes in</p>
                  <p className="dsb-exit-countdown">{formatMmSs(countdown)}</p>
                </div>

                <p className="dsb-exit-lead">
                  Enter your email for instant access to your exclusive discount code:
                </p>
                <input
                  type="email"
                  className="dsb-exit-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {error && <p className="dsb-exit-error">{error}</p>}
                <button
                  type="button"
                  className="dsb-exit-cta dsb-tap-scale"
                  disabled={loading}
                  onClick={submit}
                >
                  {loading ? <span className="dsb-exit-spinner" aria-hidden /> : `Get My Discount - €${pricing.discounted} →`}
                </button>
                <ul className="dsb-exit-trust">
                  <li>One-time use code</li>
                  <li>Valid 7 days</li>
                  <li>Applied at checkout</li>
                </ul>
                <button type="button" className="dsb-exit-dismiss dsb-tap-scale" onClick={close}>
                  No thanks, I&apos;ll pay full price
                </button>
              </>
            ) : (
              <div className="dsb-exit-success">
                <div className="dsb-exit-success-icon" aria-hidden>
                  ✓
                </div>
                {reused ? (
                  <>
                    <p className="dsb-exit-success-title">You already have an active discount</p>
                    <p className="dsb-exit-success-copy">
                      Use the same email at checkout. If you need the code again, check your inbox for{" "}
                      <strong>{successEmail}</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="dsb-exit-success-title">Your discount code has been sent</p>
                    <p className="dsb-exit-success-copy">
                      Check your inbox now at <strong>{successEmail}</strong>.
                    </p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(portal, document.body);
}
