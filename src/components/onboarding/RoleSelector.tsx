"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Briefcase, UserCheck } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const GOLD = "#C9A84C";
const STORAGE_KEY = "roleSelected";

const cardTransition = "all 220ms ease";
const ctaTransition = "all 220ms ease";

function RoleCard({
  icon,
  title,
  subtitle,
  ctaLabel,
  onSelect,
  entranceDelay,
  skipMotion,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onSelect: () => void;
  entranceDelay: number;
  skipMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = hovered || focused;

  return (
    <motion.div
      className="h-full min-h-0 min-w-0 w-full"
      initial={skipMotion ? false : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        skipMotion
          ? { duration: 0 }
          : { duration: 0.5, delay: entranceDelay, ease: "easeOut" }
      }
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={onSelect}
        className="role-card group relative box-border flex h-full w-full min-w-0 cursor-pointer flex-col break-words"
        style={{
          borderRadius: 20,
          padding: "32px 28px",
          borderTop: active ? "2px solid rgba(201,168,76,0.4)" : "2px solid rgba(201,168,76,0.35)",
          border: active ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(201,168,76,0.15)",
          background: active ? "rgba(201,168,76,0.05)" : "rgba(255,255,255,0.04)",
          transition: cardTransition,
          transform: active && !skipMotion ? "translateY(-3px)" : "translateY(0)",
        }}
      >
        {active ? (
          <span
            className="pointer-events-none absolute right-4 top-4 h-2 w-2 rounded-full md:right-5 md:top-5"
            style={{ background: GOLD }}
            aria-hidden
          />
        ) : null}

        <div
          className="pointer-events-none absolute left-6 right-6 top-0 h-[2px]"
          style={{ background: "rgba(201,168,76,0.4)" }}
          aria-hidden
        />
        <div className="flex flex-1 flex-col">
          <span className="relative z-[1] mb-3 flex h-8 w-8 items-center justify-center text-[#C9A84C] [&>svg]:h-8 [&>svg]:w-8 md:mb-5 md:h-12 md:w-12 md:[&>svg]:h-12 md:[&>svg]:w-12">
            {icon}
          </span>
          <h2
            className="text-white"
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>
          <p className="mb-3 overflow-hidden text-[12px] leading-[1.5] text-white/[0.6] role-subtitle md:mb-0 md:text-[14px] md:leading-[1.7]">
            {subtitle}
          </p>
        </div>
        <div className="mt-auto pt-0 md:mt-6 md:pt-0">
          <span
            className="flex w-full items-center justify-center gap-2 whitespace-nowrap font-bold"
          style={{
            background: GOLD,
            color: "#0D1B2A",
            fontWeight: 700,
            borderRadius: 10,
            padding: "14px 20px",
            minHeight: 48,
            width: "100%",
            fontSize: 13,
            letterSpacing: "0.01em",
            transition: ctaTransition,
            pointerEvents: "none",
          }}
          aria-hidden
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function RoleSelector() {
  const router = useRouter();
  const reduceMotion = Boolean(useReducedMotion());
  const [shouldRender, setShouldRender] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const pendingRedirect = useRef<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => {
      setShouldRender(true);
      setIsOpen(true);
    }, 800);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!shouldRender || !isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shouldRender, isOpen]);

  const finishExit = useCallback(() => {
    const path = pendingRedirect.current;
    pendingRedirect.current = null;
    setShouldRender(false);
    if (path) router.push(path);
  }, [router]);

  const closeWithOptionalRedirect = (value: "employer" | "candidate" | "skipped", path: string | null) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    pendingRedirect.current = path;
    setIsOpen(false);
  };

  if (!shouldRender) return null;

  const skipEntrance = reduceMotion;

  return (
    <AnimatePresence onExitComplete={finishExit}>
      {isOpen ? (
        <motion.div
          key="role-overlay"
          className="fixed inset-0 z-[240] flex items-center justify-center overflow-hidden backdrop-blur-[12px]"
          style={{ background: "rgba(10, 15, 25, 0.92)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.97,
            transition: { duration: 0.25, ease: "easeOut" },
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex h-[100dvh] w-full min-h-0 flex-col items-center justify-center overflow-hidden p-4 min-[640px]:h-full min-[640px]:max-h-[100vh] min-[640px]:p-4"
          >
            <div className="mx-auto box-border flex h-full w-full max-w-[860px] min-h-0 flex-col overflow-hidden px-0 py-0 min-[640px]:max-h-[calc(100dvh-32px)] min-[640px]:gap-5 min-[640px]:overflow-y-auto min-[640px]:overflow-x-hidden min-[640px]:px-6 min-[640px]:py-6">
              <motion.div
                className="shrink-0 text-center mb-3 min-[640px]:mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              >
                <p className="text-[1.3rem] font-bold min-[640px]:text-[22px]">
                  <span style={{ color: GOLD }}>Arbeid</span>
                  <span className="text-white">Match</span>
                </p>
                <p className="mt-1 text-[13px] text-white/[0.6] min-[640px]:mt-2 min-[640px]:text-[15px]">
                  Who are you? Choose your path.
                </p>
              </motion.div>

              <div
                className="mx-auto flex min-h-0 w-full max-w-[800px] flex-1 overflow-hidden rounded-[24px] px-0 py-0 min-[640px]:px-4 min-[640px]:py-8"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)",
                }}
              >
                <div className="grid min-h-0 w-full flex-1 grid-cols-1 items-stretch gap-5 overflow-hidden md:grid-cols-2">
                  <RoleCard
                    icon={<Briefcase stroke={GOLD} strokeWidth={1.5} />}
                    title="I am an employer"
                    subtitle="Norwegian businesses looking for qualified EU/EEA workers in construction, logistics, industry and more."
                    ctaLabel="Get started"
                    entranceDelay={skipEntrance ? 0 : 0.1}
                    skipMotion={skipEntrance}
                    onSelect={() => {
                      trackEvent("select_role", { role: "employer" });
                      closeWithOptionalRedirect("employer", "/for-employers");
                    }}
                  />
                  <RoleCard
                    icon={<UserCheck stroke={GOLD} strokeWidth={1.5} />}
                    title="I am looking for work"
                    subtitle="EU/EEA citizens and international workers looking for legal, well-paid jobs in Norway."
                    ctaLabel="Find my job"
                    entranceDelay={skipEntrance ? 0 : 0.25}
                    skipMotion={skipEntrance}
                    onSelect={() => {
                      trackEvent("select_role", { role: "candidate" });
                      closeWithOptionalRedirect("candidate", "/for-candidates");
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="mt-2 shrink-0 cursor-pointer pt-1 text-center text-[12px] text-white/[0.3] transition-colors hover:text-white/60 md:mt-8 md:text-[13px]"
                onClick={() => {
                  trackEvent("skip_role_selection");
                  closeWithOptionalRedirect("skipped", null);
                }}
              >
                Continue without selecting
              </button>
            </div>
          </motion.div>
          <style jsx>{`
            @media (prefers-reduced-motion: reduce) {
              .role-card {
                transform: none !important;
              }
            }
            @media (min-width: 640px) {
              .role-card {
                padding: 32px 28px !important;
              }
            }
            @media (min-width: 768px) {
              .role-card h2 {
                font-size: 1.5rem !important;
              }
              .role-subtitle {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                min-height: 72px;
              }
              .role-card > span:first-of-type {
                height: 48px;
                align-items: center;
              }
              .role-card > div:last-of-type > span {
                padding: 14px 20px !important;
                width: 100%;
              }
            }
            @media (max-width: 767px) {
              .role-subtitle {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                min-height: 36px;
              }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
