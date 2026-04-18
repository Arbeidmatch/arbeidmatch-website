"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  DsbPremiumIcon,
  IconListCheckDrawn,
  IconLock,
  IconMail,
  IconShield,
  type DsbPremiumIconName,
} from "@/components/dsb/DsbIcons";
import DsbExitDiscountPopup from "@/components/dsb/DsbExitDiscountPopup";
import { DSB_DISCOUNT } from "@/lib/dsbDiscountPricing";
import {
  DSB_DISCOUNT_LS_COUPON,
  DSB_DISCOUNT_LS_GUIDE,
} from "@/lib/dsbDiscountStorage";

type GuideSlug = "eu" | "non-eu";

type PillDef = { icon: DsbPremiumIconName; text: string };
type ItemDef = { text: string; icon: DsbPremiumIconName };

type VariantConfig = {
  slug: GuideSlug;
  badge: string;
  region: "eu" | "non-eu";
  heroEmoji: string;
  title: string;
  subtitle: string;
  pills: PillDef[];
  items: ItemDef[];
  ctaLabel: string;
  crossLinkHref: string;
  crossLinkLabel: string;
  importantNote?: string;
};

const EU_CONFIG: VariantConfig = {
  slug: "eu",
  region: "eu",
  badge: "EU/EEA Citizens Only",
  heroEmoji: "🇪🇺",
  title: "Get Your DSB Authorization in Norway",
  subtitle: "Fast-track your electrical career in Norway. EU recognition means a simpler, faster process.",
  pills: [
    { icon: "clock", text: "2–4 months" },
    { icon: "shield", text: "No visa" },
    { icon: "graph", text: "Job placement" },
  ],
  items: [
    { text: "Step-by-step application process", icon: "lightning" },
    { text: "Complete document checklist", icon: "document" },
    { text: "Official DSB links and forms (inside the guide)", icon: "link" },
    { text: "Processing times and fees explained", icon: "clock" },
    { text: "FAQ and common mistakes", icon: "check" },
    { text: "30-day secure online access", icon: "shield" },
  ],
  ctaLabel: "Get the EU/EEA Guide",
  crossLinkHref: "/dsb-support/non-eu",
  crossLinkLabel: "Not EU/EEA? See the Non-EU guide",
};

const NON_EU_CONFIG: VariantConfig = {
  slug: "non-eu",
  region: "non-eu",
  badge: "Non-EU Citizens",
  heroEmoji: "🌍",
  title: "DSB Authorization Guide for Non-EU Electricians",
  subtitle: "The complete guide to navigating the Norwegian DSB authorization process from outside the EU.",
  pills: [
    { icon: "clock", text: "6–12 months" },
    { icon: "airplane", text: "Work visa" },
    { icon: "document", text: "Individual assessment" },
  ],
  items: [
    { text: "Step-by-step application process", icon: "lightning" },
    { text: "Complete document checklist", icon: "document" },
    { text: "Official DSB links and forms (inside the guide)", icon: "link" },
    { text: "Processing times and fees explained", icon: "clock" },
    { text: "FAQ and common mistakes", icon: "check" },
    { text: "30-day secure online access", icon: "shield" },
    { text: "Document translation requirements", icon: "translate" },
    { text: "Work visa process explained", icon: "airplane" },
    { text: "Timeline and cost breakdown", icon: "graph" },
    { text: "Appeals process", icon: "scale" },
  ],
  ctaLabel: "Get the Non-EU Guide",
  crossLinkHref: "/dsb-support/eu",
  crossLinkLabel: "EU/EEA citizen? See the EU guide",
  importantNote:
    "This guide covers DSB authorization only. Your work visa must be arranged separately with your Norwegian employer.",
};

function titleWords(title: string) {
  return title.split(/\s+/).filter(Boolean);
}

function IncludedRow({
  item,
  index,
  reduceMotion,
}: {
  item: ItemDef;
  index: number;
  reduceMotion: boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const drawn = Boolean(reduceMotion || inView);

  return (
    <motion.div
      ref={ref}
      className="dsb-included-row"
      initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      animate={inView || reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{
        delay: reduceMotion ? 0 : index * 0.08,
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="dsb-included-row-check text-[#B8860B]">
        <IconListCheckDrawn drawn={drawn} />
      </div>
      <p className="dsb-included-row-text">{item.text}</p>
      <div className="dsb-included-row-icon text-[#B8860B]">
        <DsbPremiumIcon name={item.icon} />
      </div>
    </motion.div>
  );
}

function ResendRing({ secondsLeft, total }: { secondsLeft: number; total: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const progress = total > 0 ? secondsLeft / total : 0;
  const offset = c * (1 - progress);
  return (
    <svg className="dsb-resend-ring" viewBox="0 0 52 52" width={52} height={52} aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="#B8860B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
        className="dsb-resend-ring-progress"
      />
    </svg>
  );
}

export default function DsbGuideCheckoutMobilePremium({ variant }: { variant: GuideSlug }) {
  const cfg = variant === "eu" ? EU_CONFIG : NON_EU_CONFIG;
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<"input" | "confirm" | "sent">("input");
  const [email, setEmail] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionHeadRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(sectionHeadRef, { once: true, amount: 0.35 });

  const words = useMemo(() => titleWords(cfg.title), [cfg.title]);

  useEffect(() => {
    if (step !== "sent" || resendCountdown <= 0) return;
    const timer = window.setInterval(() => setResendCountdown((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendCountdown]);

  useEffect(() => {
    try {
      const code = localStorage.getItem(DSB_DISCOUNT_LS_COUPON)?.trim();
      const g = localStorage.getItem(DSB_DISCOUNT_LS_GUIDE)?.trim();
      if (code && g === cfg.slug) {
        setAppliedCoupon(code);
      }
    } catch {
      /* ignore */
    }
  }, [cfg.slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const discountCode = params.get("discount")?.trim();
    if (!discountCode) return;
    try {
      localStorage.setItem(DSB_DISCOUNT_LS_COUPON, discountCode);
      localStorage.setItem(DSB_DISCOUNT_LS_GUIDE, variant);
      setAppliedCoupon(discountCode);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("discount");
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
    window.history.replaceState({}, "", next);
  }, [cfg.slug]);

  const startConfirmation = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setConfirmedEmail(email.trim());
    setStep("confirm");
  };

  const sendLink = async () => {
    if (!confirmedEmail) return;
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/dsb-guide/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guide_slug: cfg.slug,
          email: confirmedEmail,
          website: "",
          ...(appliedCoupon ? { coupon_code: appliedCoupon } : {}),
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Could not send access link.");
        return;
      }
      setStatus("idle");
      setStep("sent");
      setResendCountdown(60);
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const resetToInput = () => {
    setStep("input");
    setStatus("idle");
    setError("");
    setResendCountdown(0);
  };

  const resetSelection = () => {
    try {
      localStorage.removeItem("am_dsb_type");
    } catch {
      /* ignore */
    }
    window.location.href = "/dsb-support";
  };

  const spring = [0.16, 1, 0.3, 1] as const;
  const discountRow = appliedCoupon ? DSB_DISCOUNT[cfg.slug] : null;

  return (
    <div className={`dsb-premium-page dsb-premium-page--${cfg.region}`}>
      <section className="dsb-premium-hero">
        <div className="dsb-premium-hero-mesh" aria-hidden />
        <div className="dsb-premium-hero-noise" aria-hidden />
        <div className="dsb-premium-hero-orb hero-orb" aria-hidden />

        <div className="dsb-premium-hero-inner">
          <div className="dsb-premium-hero-top">
            <motion.span
              className="dsb-premium-hero-emoji"
              initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduceMotion ? 0 : 0.05 }}
              aria-hidden
            >
              {cfg.heroEmoji}
            </motion.span>
            <div className="dsb-premium-badge-wrap">
              <div className="dsb-premium-badge-spin" aria-hidden />
              <span className="dsb-premium-badge">{cfg.badge}</span>
            </div>
          </div>

          <h1 className="dsb-premium-hero-title">
            {words.map((word, i) => {
              const isLast = i === words.length - 1;
              return (
                <motion.span
                  key={`${word}-${i}`}
                  className={`dsb-premium-hero-word${isLast ? " dsb-hero-word-shimmer" : ""}`}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.12 + i * 0.08,
                    duration: 0.55,
                    ease: spring,
                  }}
                >
                  {word}
                  {i < words.length - 1 ? "\u00a0" : ""}
                </motion.span>
              );
            })}
          </h1>

          <motion.p
            className="dsb-premium-hero-sub"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.35, duration: 0.5, ease: spring }}
          >
            {cfg.subtitle}
          </motion.p>

          <motion.div
            className="dsb-premium-pills"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: reduceMotion ? 0 : 0.1, delayChildren: reduceMotion ? 0 : 0.45 },
              },
            }}
          >
            {cfg.pills.map((pill) => (
              <motion.span
                key={pill.text}
                className="dsb-premium-pill"
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: spring } },
                }}
              >
                <DsbPremiumIcon name={pill.icon} className="dsb-premium-pill-icon" />
                {pill.text}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={sectionRef} className="dsb-premium-body">
        <div className="dsb-premium-body-inner">
          {cfg.importantNote && (
            <motion.div
              className="dsb-premium-alert"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.55, ease: spring }}
            >
              {cfg.importantNote}
            </motion.div>
          )}

          <motion.div
            className="dsb-premium-reveal"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, ease: spring }}
          >
            <div ref={sectionHeadRef} className="dsb-section-head">
              <h2 className={`dsb-section-title ${headerInView ? "is-underlined" : ""}`}>What&apos;s included</h2>
              <p className="dsb-section-sub">Everything you need in one clear guide.</p>
            </div>

            <div className="dsb-included-list">
              {cfg.items.map((item, index) => (
                <IncludedRow key={item.text} item={item} index={index} reduceMotion={reduceMotion} />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="dsb-price-card"
            initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, ease: spring }}
          >
            <p className="dsb-price-card-label">One-time access</p>
            <div className="dsb-price-row">
              <div className={`dsb-price-block ${cfg.region === "eu" ? "is-primary" : ""}`}>
                <div className="dsb-price-amount">
                  <span className="dsb-price-currency">€</span>
                  <span className="dsb-price-value">15</span>
                </div>
                <span className="dsb-price-meta">EU/EEA</span>
              </div>
              <div className="dsb-price-divider" aria-hidden />
              <div className={`dsb-price-block ${cfg.region === "non-eu" ? "is-primary" : ""}`}>
                <div className="dsb-price-amount">
                  <span className="dsb-price-currency">€</span>
                  <span className="dsb-price-value">39</span>
                </div>
                <span className="dsb-price-meta">Non-EU</span>
              </div>
            </div>
            <p className="dsb-price-note">Prices include VAT where applicable. You pay after email verification.</p>
            <ul className="dsb-price-trust">
              <li>30-day access</li>
              <li>Instant delivery</li>
              <li>No subscription</li>
            </ul>
          </motion.div>

          <div className="dsb-form-shell">
            {discountRow && (
              <div className="dsb-discount-applied">
                Your discount is applied: <strong>−€{discountRow.save}</strong> (you pay €{discountRow.discounted} at
                checkout).
                <div className="dsb-discount-code">{appliedCoupon}</div>
              </div>
            )}
            {step === "input" && (
              <form onSubmit={startConfirmation} className="dsb-form-stack">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <label className="dsb-form-label">
                  <span className="dsb-form-label-text">Email for receipt &amp; access</span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    className="dsb-email-input-premium"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                {error && <p className="dsb-form-error">{error}</p>}
                <button type="submit" className="dsb-cta-premium dsb-tap-scale">
                  {cfg.ctaLabel}
                </button>
              </form>
            )}

            {step === "confirm" && (
              <div className="dsb-confirm-card">
                <p className="dsb-confirm-label">We will send to:</p>
                <p className="dsb-confirm-email">{confirmedEmail}</p>
                {error && <p className="dsb-form-error">{error}</p>}
                <div className="dsb-confirm-actions">
                  <button
                    type="button"
                    onClick={sendLink}
                    disabled={status === "loading"}
                    className="dsb-cta-premium dsb-tap-scale dsb-cta-confirm"
                  >
                    {status === "loading" ? (
                      <span className="dsb-cta-loading">
                        <span className="dsb-cta-spinner" aria-hidden />
                        <span className="sr-only">Sending</span>
                      </span>
                    ) : (
                      "Yes, send the link"
                    )}
                  </button>
                  <button type="button" onClick={resetToInput} className="dsb-btn-outline dsb-tap-scale">
                    Edit email
                  </button>
                </div>
              </div>
            )}

            {step === "sent" && (
              <div className="dsb-sent-card">
                <motion.div
                  className="dsb-sent-icon text-[#B8860B]"
                  initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <IconMail className="h-12 w-12" />
                </motion.div>
                <h3 className="dsb-sent-title">Check your inbox!</h3>
                <p className="dsb-sent-copy">
                  We sent your secure link to <span className="dsb-sent-email">{confirmedEmail}</span>.
                </p>
                <p className="dsb-sent-copy muted">
                  Open the email and continue to payment. The link expires in 30 minutes.
                </p>
                {error && <p className="dsb-form-error">{error}</p>}
                <div className="dsb-resend-wrap">
                  {resendCountdown > 0 ? (
                    <div className="dsb-resend-countdown">
                      <ResendRing secondsLeft={resendCountdown} total={60} />
                      <span className="dsb-resend-text">Resend in {resendCountdown}s</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={sendLink}
                      disabled={status === "loading"}
                      className={`dsb-btn-resend dsb-tap-scale ${resendCountdown === 0 && step === "sent" ? "is-ready" : ""}`}
                    >
                      {status === "loading" ? (
                        <span className="dsb-cta-loading">
                          <span className="dsb-cta-spinner" aria-hidden />
                        </span>
                      ) : (
                        "Resend email"
                      )}
                    </button>
                  )}
                </div>
                <button type="button" onClick={resetToInput} className="dsb-link-muted dsb-tap-scale">
                  Wrong email? Start over
                </button>
              </div>
            )}

            <div className="dsb-trust-row">
              <div className="dsb-trust-item">
                <IconLock className="dsb-trust-icon" />
                <span>Secure payment</span>
              </div>
              <div className="dsb-trust-item">
                <IconMail className="dsb-trust-icon" />
                <span>Instant access</span>
              </div>
              <div className="dsb-trust-item">
                <IconShield className="dsb-trust-icon" />
                <span>30-day access</span>
              </div>
            </div>
          </div>

          <div className="dsb-footer-links">
            <Link href={cfg.crossLinkHref} className="dsb-footer-link-primary dsb-tap-scale">
              {cfg.crossLinkLabel}
            </Link>
            <button type="button" onClick={resetSelection} className="dsb-footer-link-muted dsb-tap-scale">
              Change my selection
            </button>
          </div>
        </div>
      </section>

      <DsbExitDiscountPopup guideType={cfg.slug} />
    </div>
  );
}
