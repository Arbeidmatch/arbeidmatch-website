"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  ctaVariant,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  ctaVariant: "gold" | "outline";
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
      className="group relative w-full cursor-pointer overflow-hidden rounded-[20px] border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-7 transition-all duration-[250ms] ease-out max-[640px]:min-h-0 sm:w-[380px] sm:min-h-[340px] sm:px-8 sm:py-10"
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
      <div className="relative z-[1]">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] transition-all duration-200"
          style={{
            background: hovered ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)",
          }}
        >
          <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        </div>
        <h2 className="mt-5 text-[22px] font-extrabold leading-tight text-white sm:text-[26px]">{title}</h2>
        <p className="mt-2.5 text-[14px] leading-[1.65] text-white/[0.55]">{subtitle}</p>
        <div className="my-6 h-px bg-white/[0.06]" />
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/[0.7]">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: GOLD }}
                aria-hidden
              />
              {f}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={
            ctaVariant === "gold"
              ? "mt-7 w-full rounded-[10px] py-3.5 text-[15px] font-bold transition-colors duration-[180ms] sm:mt-7"
              : "mt-7 w-full rounded-[10px] border py-3.5 text-[15px] font-bold transition-all duration-[180ms] sm:mt-7"
          }
          style={
            ctaVariant === "gold"
              ? {
                  background: hovered ? "#b8953f" : GOLD,
                  color: "#0f1923",
                }
              : {
                  background: hovered ? "rgba(201,168,76,0.1)" : "transparent",
                  borderColor: hovered ? GOLD : "rgba(201,168,76,0.5)",
                  color: GOLD,
                }
          }
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
          className="fixed inset-0 z-[240] flex items-center justify-center backdrop-blur-[12px]"
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
            className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 sm:px-6"
          >
            <div className="mx-auto flex w-[92vw] max-w-[840px] flex-col items-center sm:w-[92vw]">
              <motion.div
                className="mb-8 text-center max-[640px]:mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              >
                <p className="text-[22px] font-bold">
                  <span style={{ color: GOLD }}>Arbeid</span>
                  <span className="text-white">Match</span>
                </p>
                <p className="mt-2 text-[13px] text-white/[0.6] sm:text-[15px]">Who are you? Choose your path.</p>
              </motion.div>

              <div className="flex w-full flex-col items-stretch justify-center gap-4 sm:flex-row sm:gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
                  className="w-full sm:w-auto"
                >
                  <RoleCard
                    icon={<Briefcase className="h-7 w-7" stroke={GOLD} strokeWidth={1.5} />}
                    title="Jeg er arbeidsgiver"
                    subtitle="Norske bedrifter som trenger kvalifiserte EU/EEA-arbeidere innen bygg, logistikk, industri og mer."
                    features={[
                      "Pre-screena kandidater levert innen 2 uker",
                      "Full overholdelse av norsk arbeidsrett",
                      "Dedikert rekrutterer for din bedrift",
                    ]}
                    ctaLabel="Kom i gang"
                    ctaVariant="gold"
                    onSelect={() => closeWithOptionalRedirect("employer", "/for-employers")}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
                  className="w-full sm:w-auto"
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
                    ctaVariant="outline"
                    onSelect={() => closeWithOptionalRedirect("candidate", "/for-candidates")}
                  />
                </motion.div>
              </div>

              <button
                type="button"
                className="mt-6 cursor-pointer text-center text-[13px] text-white/[0.3] transition-colors hover:text-white/50"
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
