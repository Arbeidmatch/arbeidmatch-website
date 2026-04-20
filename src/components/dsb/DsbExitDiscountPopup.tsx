"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * EXIT INTENT DISCOUNT POPUP
 * Status: PAUSED
 * Reason: Influencer campaign in progress
 * To re-enable: set EXIT_DISCOUNT_ENABLED = true
 * Last active: April 2026
 */
// FEATURE FLAG: Set to true to re-enable exit intent discount popup
// Currently disabled - influencer campaign pending
const EXIT_DISCOUNT_ENABLED = false;

export interface DsbExitDiscountPopupProps {
  guideType: "eu" | "non-eu";
}

const GOLD = "#C9A84C";
const CARD_BG = "#0f1923";
const GREEN = "#1D9E75";

export default function DsbExitDiscountPopup({ guideType }: DsbExitDiscountPopupProps) {
  if (!EXIT_DISCOUNT_ENABLED) return null;

  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const shownRef = useRef(false);

  const instant = Boolean(reduceMotion);

  const openPopup = useCallback(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    setShown(true);
    setVisible(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (typeof window === "undefined" || window.innerWidth < 768) return;
      if (e.clientY <= 0) openPopup();
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [openPopup]);

  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      if (typeof window === "undefined" || window.innerWidth >= 768) return;
      if (shownRef.current) return;
      const currentY = window.scrollY;
      const currentTime = Date.now();
      const deltaY = lastScrollY - currentY;
      const deltaTime = currentTime - lastScrollTime;
      if (deltaY > 50 && deltaTime < 300 && currentY < 200) {
        openPopup();
      }
      lastScrollY = currentY;
      lastScrollTime = currentTime;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [openPopup]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!shownRef.current) openPopup();
    }, 45000);
    return () => window.clearTimeout(timer);
  }, [openPopup]);

  const handleGetDiscount = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dsb-guide/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideType, withDiscount: true }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Could not start checkout. Please try again.");
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => setVisible(false);

  const copy =
    guideType === "non-eu"
      ? {
          title: "Get the Non-EU Guide for €29 instead of €39",
          body: "Save €10 on your DSB authorization guide. This offer is only available right now.",
          strike: "€39",
          price: "€29",
          badge: "€10 off",
        }
      : {
          title: "Get the EU Guide for €12 instead of €15",
          body: "Save €3 on your EU guide. This offer is only available right now.",
          strike: "€15",
          price: "€12",
          badge: "€3 off",
        };

  function renderContent(layout: "desktop" | "mobile") {
    const titleSize = layout === "mobile" ? 20 : 24;
    return (
      <>
        {layout === "mobile" && (
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
        <div
          style={{
            display: "inline-block",
            background: "rgba(201,168,76,0.1)",
            color: GOLD,
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 600,
          }}
        >
          Wait! Special offer
        </div>
        <h2
          id="dsb-exit-title"
          style={{
            color: "#fff",
            fontSize: titleSize,
            fontWeight: 800,
            marginTop: 16,
            lineHeight: 1.2,
            marginBottom: 0,
            paddingRight: layout === "mobile" ? 40 : 0,
          }}
        >
          {copy.title}
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            lineHeight: 1.7,
            marginTop: 10,
            marginBottom: 0,
          }}
        >
          {copy.body}
        </p>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
            margin: "20px 0",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 16,
              textDecoration: "line-through",
            }}
          >
            {copy.strike}
          </span>
          <span style={{ color: GOLD, fontSize: 32, fontWeight: 800 }}>{copy.price}</span>
          <span
            style={{
              background: "rgba(29,158,117,0.15)",
              color: GREEN,
              fontSize: 11,
              borderRadius: 20,
              padding: "3px 10px",
              fontWeight: 600,
            }}
          >
            {copy.badge}
          </span>
        </div>
        {error ? (
          <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>
        ) : null}
        <button
          type="button"
          onClick={handleGetDiscount}
          disabled={loading}
          style={{
            width: "100%",
            minHeight: layout === "mobile" ? 52 : undefined,
            padding: 16,
            borderRadius: 10,
            border: "none",
            background: GOLD,
            color: "#0f1923",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Getting your discount..." : "Get my discount now"}
        </button>
        <button
          type="button"
          onClick={close}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            marginTop: 14,
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          No thanks, I&apos;ll pay full price
        </button>
      </>
    );
  }

  if (!mounted) return null;

  const backdropTransition = instant ? { duration: 0 } : { duration: 0.3, ease: "easeOut" as const };
  const modalTransition = instant ? { duration: 0 } : { duration: 0.3, ease: "easeOut" as const };
  const sheetTransition = instant ? { duration: 0 } : { duration: 0.35, ease: "easeOut" as const };

  const portal = (
    <AnimatePresence>
      {visible && shown && (
        <motion.div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: isMobile ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.7)",
            backdropFilter: isMobile ? undefined : "blur(8px)",
            display: isMobile ? "block" : "flex",
            alignItems: isMobile ? undefined : "center",
            justifyContent: isMobile ? undefined : "center",
            padding: isMobile ? 0 : 16,
          }}
          initial={{ opacity: instant ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: instant ? 1 : 0 }}
          transition={backdropTransition}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {isMobile ? (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dsb-exit-title"
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                background: CARD_BG,
                borderTop: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "20px 20px 0 0",
                padding: "24px 20px 32px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              initial={{ y: instant ? 0 : "100%" }}
              animate={{ y: 0 }}
              exit={{ y: instant ? 0 : "100%" }}
              transition={sheetTransition}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  margin: "0 auto 20px",
                }}
              />
              {renderContent("mobile")}
            </motion.div>
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dsb-exit-title"
              style={{
                position: "relative",
                background: CARD_BG,
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 20,
                padding: 40,
                maxWidth: 440,
                width: "90vw",
                margin: "auto",
              }}
              initial={instant ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={instant ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={modalTransition}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 36,
                  height: 36,
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
              {renderContent("desktop")}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(portal, document.body);
}
