"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  DsbGuideDecorIcon,
  IconListCheckDrawn,
  IconLock,
  IconMail,
  IconShield,
  type DsbGuideDecorIconName,
} from "@/components/dsb/DsbIcons";
import { DSB_PAYMENT_ENABLED } from "@/lib/dsbPaymentClient";

type GuideSlug = "eu" | "non-eu";

const GOLD = "#C9A84C";

type PillDef = { icon: DsbGuideDecorIconName; text: string };
type ItemDef = { text: string; icon: DsbGuideDecorIconName };

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
  subtitle: "EU/EEA electricians",
  pills: [
    { icon: "clock", text: "2-4 months" },
    { icon: "shield", text: "No visa required" },
    { icon: "graph", text: "Job placement available" },
  ],
  items: [
    { text: "Process: 2-4 months", icon: "clock" },
    { text: "No visa required", icon: "shield" },
    { text: "Job placement available", icon: "graph" },
    { text: "Full written guide", icon: "check" },
    { text: "Instant delivery", icon: "lightning" },
  ],
  ctaLabel: "Get the EU Guide",
  crossLinkHref: "/dsb-support/non-eu",
  crossLinkLabel: "Not EU/EEA? See the Non-EU guide",
};

const NON_EU_CONFIG: VariantConfig = {
  slug: "non-eu",
  region: "non-eu",
  badge: "Non-EU Citizens",
  heroEmoji: "🌍",
  title: "DSB Authorization Guide for Non-EU Electricians",
  subtitle: "Non-EU electricians",
  pills: [
    { icon: "clock", text: "6-12 months" },
    { icon: "airplane", text: "Work visa required" },
    { icon: "document", text: "Individual DSB assessment" },
  ],
  items: [
    { text: "Process: 6-12 months", icon: "clock" },
    { text: "Work visa required (provided by employer)", icon: "airplane" },
    { text: "Individual DSB assessment", icon: "document" },
    { text: "Document translation required", icon: "translate" },
    { text: "Full written guide", icon: "shield" },
    { text: "Instant delivery", icon: "lightning" },
  ],
  ctaLabel: "Get the Non-EU Guide",
  crossLinkHref: "/dsb-support/eu",
  crossLinkLabel: "EU/EEA citizen? See the EU guide",
  importantNote:
    "This guide covers DSB authorization only. Your work visa must be arranged separately with your Norwegian employer.",
};

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
        <DsbGuideDecorIcon name={item.icon} />
      </div>
    </motion.div>
  );
}

export default function DsbGuideCheckoutMobileLayout({ variant }: { variant: GuideSlug }) {
  const cfg = variant === "eu" ? EU_CONFIG : NON_EU_CONFIG;
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const sectionHeadRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(sectionHeadRef, { once: true, amount: 0.35 });

  const heroHighlight = cfg.region === "eu" ? "EU/EEA" : "NON-EU";

  if (!DSB_PAYMENT_ENABLED) {
    return (
      <section className="mx-auto w-full max-w-content px-4 py-14 md:px-6">
        <h1 className="text-2xl font-bold text-navy md:text-3xl">Read the guide on this site</h1>
        <p className="mt-4 max-w-2xl text-text-secondary">
          The DSB authorization walkthrough for electricians is published here at no cost. Pick the path that matches your
          nationality, then use official DSB sources for final checks.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dsb-support/eu"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-gold-hover"
          >
            Read the EU/EEA guide
          </Link>
          <Link
            href="/dsb-support/non-eu"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-surface"
          >
            Read the non-EU guide
          </Link>
          <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
            Contact us
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dsb-guide/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideType: cfg.slug,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string; details?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.details || data.error || "Could not start the session. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className={`dsb-decor-shelf-page dsb-mobile-page dsb-decor-shelf-page--${cfg.region}`}>
      <section className="dsb-decor-shelf-hero">
        <div className="dsb-decor-shelf-hero-mesh" aria-hidden />
        <div className="dsb-decor-shelf-hero-noise" aria-hidden />
        <div className="dsb-decor-shelf-hero-orb hero-orb" aria-hidden />

        <div className="dsb-decor-shelf-hero-inner">
          <div className="dsb-decor-shelf-hero-top">
            <motion.span
              className="dsb-decor-shelf-hero-emoji"
              initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduceMotion ? 0 : 0.05 }}
              aria-hidden
            >
              {cfg.heroEmoji}
            </motion.span>
            <div className="dsb-decor-shelf-badge-wrap">
              <div className="dsb-decor-shelf-badge-spin" aria-hidden />
              <span className="dsb-decor-shelf-badge">{cfg.badge}</span>
            </div>
          </div>

          <h1 className="dsb-decor-shelf-hero-title">
            <span className="dsb-decor-shelf-hero-line">DSB Authorization</span>
            <span className="dsb-decor-shelf-hero-line">Guide for</span>
            <span className="dsb-decor-shelf-hero-line">
              <span className="dsb-decor-shelf-hero-highlight">{heroHighlight}</span> Electricians
            </span>
          </h1>

          <motion.p
            className="dsb-decor-shelf-hero-sub"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.35, duration: 0.5, ease: spring }}
          >
            {cfg.subtitle}
          </motion.p>

          <motion.div
            className="dsb-decor-shelf-pills"
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
                className="dsb-decor-shelf-pill"
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: spring } },
                }}
              >
                <DsbGuideDecorIcon name={pill.icon} className="dsb-decor-shelf-pill-icon" />
                {pill.text}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={sectionRef} className="dsb-decor-shelf-body">
        <div className="dsb-decor-shelf-body-inner">
          {cfg.importantNote && (
            <motion.div
              className="dsb-decor-shelf-alert"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.55, ease: spring }}
            >
              {cfg.importantNote}
            </motion.div>
          )}

          <motion.div
            className="dsb-decor-shelf-reveal"
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
            {cfg.region === "eu" ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>EU/EEA guide</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Electricians</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  Any amount is shown on the next screen before you continue.
                </p>
                <p className="dsb-price-note" style={{ marginTop: 12 }}>
                  Taxes may apply according to your location.
                </p>
                <ul className="dsb-price-trust">
                  <li>Full written guide</li>
                  <li>Instant delivery</li>
                  <li>No recurring billing</li>
                </ul>
              </>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>Non-EU guide</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Electricians</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  Any amount is shown on the next screen before you continue.
                </p>
                <p className="dsb-price-note" style={{ marginTop: 12 }}>
                  Taxes may apply according to your location.
                </p>
                <ul className="dsb-price-trust">
                  <li>Full written guide</li>
                  <li>Instant delivery</li>
                  <li>No recurring billing</li>
                </ul>
              </>
            )}
          </motion.div>

          <div className="dsb-form-shell">
            <div className="dsb-form-stack">
              {error ? <p className="dsb-form-error">{error}</p> : null}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="dsb-cta-sales dsb-tap-scale"
              >
                {loading ? (
                  <span className="dsb-cta-loading">
                    <span className="dsb-cta-spinner" aria-hidden />
                    <span className="sr-only">Redirecting</span>
                    Redirecting…
                  </span>
                ) : (
                  cfg.ctaLabel
                )}
              </button>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                You continue on a secure external page to confirm your contact details.
              </p>
            </div>

            <div className="dsb-trust-row">
              <div className="dsb-trust-item">
                <IconLock className="dsb-trust-icon" />
                <span>Secure connection</span>
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
    </div>
  );
}
