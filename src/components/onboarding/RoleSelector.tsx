"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, UserCheck } from "lucide-react";

const GOLD = "#C9A84C";
const STORAGE_KEY = "roleSelected";

type Glow = { x: number; y: number };

function RoleCard({
  icon,
  title,
  subtitle,
  features,
  ctaLabel,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  onSelect: () => void;
}) {
  const [glow, setGlow] = useState<Glow>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [touchGlow, setTouchGlow] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    setGlow({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    setTouchGlow(true);
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setTouchGlow(false), 400);
  }, []);

  useEffect(() => {
    return () => {
      if (touchTimer.current) clearTimeout(touchTimer.current);
    };
  }, []);

  const glowOpacity = touchGlow ? 0.5 : hovered ? 1 : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onClick={onSelect}
      className="group relative box-border w-full min-w-0 max-w-[400px] cursor-pointer break-words rounded-[20px] border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-5 py-6 transition-all duration-[250ms] ease-out max-[639px]:max-w-none min-[640px]:flex-1 min-[640px]:py-7 lg:px-7 lg:py-9"
      style={{
        borderColor: hovered ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.08)",
        transform: hovered ? "scale(1.02)" : "scale(1)",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(300px circle at ${glow.x}px ${glow.y}px, rgba(201,168,76,0.12), transparent 60%)`,
        }}
        aria-hidden
      />
      <div className="relative z-[1] min-w-0">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] transition-all duration-200"
          style={{
            background: hovered ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)",
          }}
        >
          <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        </div>
        <h2 className="mt-5 text-[20px] font-extrabold leading-tight text-white min-[640px]:text-[26px]">{title}</h2>
        <p className="mt-2.5 text-[13px] leading-[1.65] text-white/[0.55] min-[640px]:text-sm">{subtitle}</p>
        <div className="my-6 h-px bg-white/[0.06]" />
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-white/[0.7] min-[640px]:text-sm">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: GOLD }}
                aria-hidden
              />
              <span className="min-w-0 break-words">{f}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-6 box-border block w-full rounded-[10px] px-6 py-3.5 text-sm font-bold transition-colors duration-[180ms] min-[640px]:mt-7 min-[640px]:text-[15px]"
          style={{
            display: "block",
            width: "100%",
            visibility: "visible",
            opacity: 1,
            background: hovered ? "#b8953f" : GOLD,
            color: "#0D1B2A",
            fontWeight: 700,
            borderRadius: 10,
            padding: "14px 24px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

export default function RoleSelector() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
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

              <div className="flex min-h-0 w-full flex-col gap-4 min-[640px]:flex-row min-[640px]:gap-5">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0, ease: "easeOut" }}
                  className="flex min-h-0 min-w-0 flex-1 justify-center"
                >
                  <RoleCard
                    icon={<Briefcase className="h-7 w-7" stroke={GOLD} strokeWidth={1.5} />}
                    title="I am an employer"
                    subtitle="Norwegian businesses looking for qualified EU/EEA workers in construction, logistics, industry and more."
                    features={[
                      "Pre-screened candidates delivered within 2 weeks",
                      "Full compliance with Norwegian labor law",
                      "Dedicated recruiter for your business",
                    ]}
                    ctaLabel="Get started"
                    onSelect={() => closeWithOptionalRedirect("employer", "/for-employers")}
                  />
                </motion.div>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="flex min-h-0 min-w-0 flex-1 justify-center"
                >
                  <RoleCard
                    icon={<UserCheck className="h-7 w-7" stroke={GOLD} strokeWidth={1.5} />}
                    title="I am looking for work"
                    subtitle="EU/EEA citizens and international workers looking for legal, well-paid jobs in Norway."
                    features={[
                      "Legal employment contracts in Norway",
                      "Support before and after arrival",
                      "Direct access to active job openings",
                    ]}
                    ctaLabel="Find my job"
                    onSelect={() => closeWithOptionalRedirect("candidate", "/for-candidates")}
                  />
                </motion.div>
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
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
