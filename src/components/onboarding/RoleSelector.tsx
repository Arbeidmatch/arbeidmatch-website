"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Briefcase, UserCheck } from "lucide-react";

const GOLD = "#C9A84C";
const STORAGE_KEY = "roleSelected";

const cardTransition = "all 0.25s ease";
const ctaTransition = "all 0.2s ease";

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
      className="flex h-full min-h-0 min-w-0 w-full flex-1"
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
          borderRadius: 16,
          padding: "28px 24px",
          border: active ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(201,168,76,0.2)",
          background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
          boxShadow: active
            ? "0 0 0 1px rgba(201,168,76,0.4), 0 8px 32px rgba(201,168,76,0.08)"
            : "none",
          transition: cardTransition,
          animation: skipMotion ? "none" : "goldPulse 2s ease-in-out infinite alternate",
        }}
      >
        {active ? (
          <span
            className="pointer-events-none absolute right-4 top-4 h-2 w-2 rounded-full md:right-5 md:top-5"
            style={{ background: GOLD }}
            aria-hidden
          />
        ) : null}

        <span className="relative z-[1] flex h-10 w-10 items-center justify-center text-[#C9A84C] [&>svg]:h-10 [&>svg]:w-10">
          {icon}
        </span>
        <h2
          className="mt-4 text-white"
          style={{
            fontSize: "clamp(1rem, 4vw, 1.5rem)",
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          {title}
        </h2>
        <p className="flex-grow text-[14px] leading-[1.6] text-white/[0.55]">{subtitle}</p>
        <span
          className="mt-auto flex w-full items-center justify-center gap-2 whitespace-nowrap font-bold"
          style={{
            background: active ? "#b8953f" : GOLD,
            color: "#0D1B2A",
            fontWeight: 700,
            borderRadius: 12,
            padding: "10px 12px",
            width: "100%",
            fontSize: 13,
            letterSpacing: "0.01em",
            transform: active ? "scale(1.02)" : "scale(1)",
            transition: ctaTransition,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
        </span>
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
            className="flex h-full max-h-[100dvh] w-full min-h-0 flex-col items-center justify-center overflow-hidden p-2 min-[640px]:max-h-[100vh] min-[640px]:p-4"
          >
            <div className="mx-auto box-border flex w-full max-w-[860px] min-h-0 max-h-[calc(100dvh-32px)] flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-4 min-[640px]:gap-5 min-[640px]:px-6 min-[640px]:py-6">
              <motion.div
                className="shrink-0 text-center max-[639px]:mb-4 min-[640px]:mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              >
                <p className="text-[18px] font-bold min-[640px]:text-[22px]">
                  <span style={{ color: GOLD }}>Arbeid</span>
                  <span className="text-white">Match</span>
                </p>
                <p className="mt-2 text-[13px] text-white/[0.6] min-[640px]:text-[15px]">
                  Who are you? Choose your path.
                </p>
              </motion.div>

              <div
                className="w-full rounded-[24px] px-2 py-6 min-[640px]:px-4 min-[640px]:py-8"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 60%, rgba(201,168,76,0.04) 0%, transparent 70%)",
                }}
              >
                <div className="flex min-h-0 w-full flex-col gap-3 md:flex-row md:items-stretch md:gap-5">
                  <RoleCard
                    icon={<Briefcase stroke={GOLD} strokeWidth={1.5} />}
                    title="I am an employer"
                    subtitle="Norwegian businesses looking for qualified EU/EEA workers in construction, logistics, industry and more."
                    ctaLabel="Get started"
                    entranceDelay={skipEntrance ? 0 : 0.1}
                    skipMotion={skipEntrance}
                    onSelect={() => closeWithOptionalRedirect("employer", "/for-employers")}
                  />
                  <RoleCard
                    icon={<UserCheck stroke={GOLD} strokeWidth={1.5} />}
                    title="I am looking for work"
                    subtitle="EU/EEA citizens and international workers looking for legal, well-paid jobs in Norway."
                    ctaLabel="Find my job"
                    entranceDelay={skipEntrance ? 0 : 0.25}
                    skipMotion={skipEntrance}
                    onSelect={() => closeWithOptionalRedirect("candidate", "/for-candidates")}
                  />
                </div>
              </div>

              <button
                type="button"
                className="shrink-0 cursor-pointer pt-1 text-center text-[12px] text-white/[0.3] transition-colors hover:text-white/50 max-[639px]:mt-4 min-[640px]:mt-2 min-[640px]:text-[13px]"
                onClick={() => closeWithOptionalRedirect("skipped", null)}
              >
                Continue without selecting
              </button>
            </div>
          </motion.div>
          <style jsx>{`
            @keyframes goldPulse {
              from {
                border-color: rgba(201, 168, 76, 0.2);
              }
              to {
                border-color: rgba(201, 168, 76, 0.5);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .role-card {
                animation: none !important;
              }
            }
            @media (min-width: 640px) {
              .role-card {
                min-height: 420px;
              }
            }
            @media (max-width: 767px) {
              .role-card {
                min-height: 45vh;
              }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
