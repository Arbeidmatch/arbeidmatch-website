"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Zap } from "lucide-react";

const GOLD = "#C9A84C";
const CARD_BG = "#0f1923";
const GREEN = "#1D9E75";

type Glow = { x: number; y: number };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function InlineSignup({
  open,
  specialty,
  guideWanted,
  successMessage,
  reducedMotion,
}: {
  open: boolean;
  specialty: string;
  guideWanted: boolean;
  successMessage: string;
  reducedMotion: boolean;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setConsent(false);
      setStatus("idle");
      setClientError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setClientError("email");
      return;
    }
    if (!consent) {
      setClientError("consent");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/guide-interest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed.toLowerCase(),
          specialty,
          consent: true,
          guideWanted,
        }),
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

  const transitionMs = reducedMotion ? 0 : 200;

  return (
    <div
      className="grid w-full min-w-0"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: `grid-template-rows ${transitionMs}ms ease-out`,
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="pt-3">
          {status === "success" ? (
            <p className="py-2 text-[13px] font-medium" style={{ color: GREEN }}>
              {successMessage}
            </p>
          ) : (
            <form onSubmit={submit} className="box-border w-full min-w-0">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setClientError(null);
                }}
                placeholder="Your email address"
                className="box-border w-full min-w-0 rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
                autoComplete="email"
              />
              <label className="mt-2 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setClientError(null);
                  }}
                  className="mt-0.5 h-4 min-h-[16px] w-4 min-w-[16px] shrink-0 rounded border-white/20 bg-transparent"
                  style={{ accentColor: GOLD }}
                />
                <span className="text-[11px] leading-[1.5] text-white/[0.5]">
                  I agree to receive job-related emails from ArbeidMatch. Unsubscribe anytime.
                </span>
              </label>
              {clientError === "email" ? (
                <p className="mt-2 text-[13px] text-red-400">Please enter a valid email address.</p>
              ) : null}
              {clientError === "consent" ? (
                <p className="mt-2 text-[13px] text-red-400">Please accept to continue.</p>
              ) : null}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 box-border w-full min-w-0 rounded-[8px] py-2.5 text-[13px] font-bold text-[#0f1923] disabled:opacity-70"
                style={{ background: GOLD }}
              >
                {status === "loading" ? "Sending..." : "Submit"}
              </button>
              {status === "error" ? (
                <p className="mt-2 text-[13px] text-red-400">Something went wrong. Please try again.</p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TradeCardShell({
  children,
  icon,
  eyebrow,
  title,
  body,
  reducedMotion,
  reveal,
}: {
  children: ReactNode;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  reducedMotion: boolean;
  reveal: boolean;
}) {
  const [glow, setGlow] = useState<Glow>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [iconHover, setIconHover] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const visible = reducedMotion || reveal;
  const lift = visible && hovered ? "translateY(-3px)" : visible ? "translateY(0)" : "translateY(24px)";
  const motionStyle = reducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: lift,
        transition: "opacity 500ms ease-out, transform 500ms ease-out, border-color 250ms ease-out",
      };

  return (
    <div
      className="relative box-border w-full min-w-0 max-w-full rounded-[20px] border border-[rgba(201,168,76,0.15)] px-6 py-7 md:px-8 md:py-10"
      style={{
        ...motionStyle,
        background: CARD_BG,
        borderColor: hovered ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.15)",
        ...(reducedMotion
          ? {
              transition: "border-color 250ms ease-out, transform 250ms ease-out",
              transform: hovered ? "translateY(-3px)" : "translateY(0)",
            }
          : {}),
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[20px] transition-opacity duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${glow.x}px ${glow.y}px, rgba(201,168,76,0.14), transparent 60%)`,
        }}
        aria-hidden
      />
      <div className="relative z-[1] min-w-0">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-[rgba(201,168,76,0.2)] transition-all duration-200"
          style={{
            background: iconHover ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)",
            transform: iconHover ? "scale(1.1)" : "scale(1)",
          }}
          onMouseEnter={() => setIconHover(true)}
          onMouseLeave={() => setIconHover(false)}
        >
          {icon}
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
          {eyebrow}
        </p>
        <h3 className="mt-2 text-[22px] font-extrabold leading-[1.2] text-white">{title}</h3>
        <p className="mt-3 text-[14px] leading-[1.7] text-white/[0.6]">{body}</p>
        <div className="my-6 h-px bg-white/[0.06]" />
        {children}
      </div>
    </div>
  );
}

function PathBlockShell({
  borderColor,
  bg,
  children,
}: {
  borderColor: string;
  bg: string;
  children: ReactNode;
}) {
  return (
    <div
      className="box-border w-full min-w-0 max-w-full rounded-[10px] border-l-[3px] border-solid px-5 py-4"
      style={{ borderLeftColor: borderColor, background: bg }}
    >
      {children}
    </div>
  );
}

export default function TradeSpecialistCards() {
  const reducedMotion = usePrefersReducedMotion();
  const [card1, setCard1] = useState(reducedMotion);
  const [card2, setCard2] = useState(reducedMotion);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

  const [elecOpen, setElecOpen] = useState<null | "a" | "b">(null);
  const [weldOpen, setWeldOpen] = useState<null | "a" | "b">(null);

  useEffect(() => {
    if (reducedMotion) {
      setCard1(true);
      setCard2(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          if (en.target === ref1.current) setCard1(true);
          if (en.target === ref2.current) {
            window.setTimeout(() => setCard2(true), 150);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    if (ref1.current) obs.observe(ref1.current);
    if (ref2.current) obs.observe(ref2.current);
    return () => obs.disconnect();
  }, [reducedMotion]);

  return (
    <section className="bg-white py-12 md:py-20">
      <div className="mx-auto box-border grid w-full max-w-content grid-cols-1 gap-4 px-6 md:grid-cols-2 md:gap-5 md:px-12 lg:px-20">
        <div ref={ref1} className="min-w-0">
          <TradeCardShell
            reducedMotion={reducedMotion}
            reveal={card1}
            icon={<Zap size={28} color={GOLD} strokeWidth={1.5} />}
            eyebrow="Are you an electrician?"
            title="Work as an electrician in Norway"
            body="Norway needs qualified electricians. Choose your path below based on your current status."
          >
            <div className="flex w-full min-w-0 flex-col gap-4">
              <PathBlockShell borderColor={GREEN} bg="rgba(29,158,117,0.06)">
                <span
                  className="mb-2.5 inline-block rounded-[20px] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ background: "rgba(29,158,117,0.12)", color: GREEN }}
                >
                  I have DSB authorization
                </span>
                <p className="text-[15px] font-bold leading-snug text-white">Ready to work. Find your next project.</p>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-white/[0.6]">
                  Register your profile and we will match you with Norwegian employers actively looking for DSB-authorized
                  electricians. Norwegian employer references are a strong advantage.
                </p>
                <button
                  type="button"
                  onClick={() => setElecOpen((k) => (k === "a" ? null : "a"))}
                  className="mt-3 box-border w-full min-w-0 rounded-[8px] py-2.5 text-[13px] font-bold text-white"
                  style={{ background: GREEN }}
                >
                  Register and find work
                </button>
                <InlineSignup
                  open={elecOpen === "a"}
                  specialty="electrician-dsb"
                  guideWanted={false}
                  successMessage="Your profile is registered. Our team will contact you when we have a matching opportunity."
                  reducedMotion={reducedMotion}
                />
              </PathBlockShell>

              <PathBlockShell borderColor={GOLD} bg="rgba(201,168,76,0.06)">
                <p className="mb-1.5 text-[18px] font-extrabold" style={{ color: GOLD }}>
                  No DSB yet? No problem.
                </p>
                <p className="text-[13px] leading-[1.6] text-white/[0.6]">
                  DSB authorization is required to work legally as an electrician in Norway. We have a step-by-step guide that
                  walks you through the entire process.
                </p>
                <div className="mt-3 flex w-full min-w-0 flex-col gap-2">
                  <Link
                    href="/dsb-support"
                    className="box-border flex w-full min-w-0 items-center justify-center rounded-[8px] py-2.5 text-center text-[13px] font-bold text-[#0f1923]"
                    style={{ background: GOLD }}
                  >
                    Get the DSB Authorization Guide
                  </Link>
                  <button
                    type="button"
                    onClick={() => setElecOpen((k) => (k === "b" ? null : "b"))}
                    className="box-border w-full min-w-0 rounded-[8px] border border-[rgba(201,168,76,0.3)] bg-transparent py-2.5 text-[13px] font-bold"
                    style={{ color: GOLD }}
                  >
                    Notify me of DSB updates
                  </button>
                </div>
                <InlineSignup
                  open={elecOpen === "b"}
                  specialty="electrician-no-dsb"
                  guideWanted
                  successMessage="You are on the list. We will notify you of new DSB resources and job opportunities."
                  reducedMotion={reducedMotion}
                />
              </PathBlockShell>
            </div>
          </TradeCardShell>
        </div>

        <div ref={ref2} className="min-w-0">
          <TradeCardShell
            reducedMotion={reducedMotion}
            reveal={card2}
            icon={<Flame size={28} color={GOLD} strokeWidth={1.5} />}
            eyebrow="Are you a welder?"
            title="Work as a welder in Norway"
            body="Norwegian shipyards are actively hiring. Choose your path below based on your certification status."
          >
            <div className="flex w-full min-w-0 flex-col gap-4">
              <PathBlockShell borderColor={GREEN} bg="rgba(29,158,117,0.06)">
                <span
                  className="mb-2.5 inline-block rounded-[20px] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ background: "rgba(29,158,117,0.12)", color: GREEN }}
                >
                  I have a valid ISO certificate
                </span>
                <p className="text-[15px] font-bold leading-snug text-white">Apply now for shipyard placements.</p>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-white/[0.6]">
                  ISO 9606 certified welders are in high demand at Norwegian shipyards. Transport and accommodation are
                  typically included. Register your profile and we will match you with active openings.
                </p>
                <p className="mt-2 text-[11px] leading-snug text-white/[0.4]">
                  Typical salary: 280 to 330 NOK per hour. Rotation: 4 weeks on, 2 weeks home or 6 weeks on, 2 weeks home.
                </p>
                <button
                  type="button"
                  onClick={() => setWeldOpen((k) => (k === "a" ? null : "a"))}
                  className="mt-3 box-border w-full min-w-0 rounded-[8px] py-2.5 text-[13px] font-bold text-white"
                  style={{ background: GREEN }}
                >
                  Apply for welding jobs
                </button>
                <InlineSignup
                  open={weldOpen === "a"}
                  specialty="welder-iso"
                  guideWanted={false}
                  successMessage="Your profile is registered. Our team will review your certifications and contact you when we have a matching shipyard placement."
                  reducedMotion={reducedMotion}
                />
              </PathBlockShell>

              <PathBlockShell borderColor={GOLD} bg="rgba(201,168,76,0.06)">
                <p className="mb-1.5 text-[18px] font-extrabold" style={{ color: GOLD }}>
                  No valid ISO yet? Get notified.
                </p>
                <p className="text-[13px] leading-[1.6] text-white/[0.6]">
                  ISO 9606 certification is required to work as a welder at Norwegian shipyards. We are preparing a guide to
                  help you understand the certification process and how to get placed in Norway.
                </p>
                <button
                  type="button"
                  onClick={() => setWeldOpen((k) => (k === "b" ? null : "b"))}
                  className="mt-3 box-border w-full min-w-0 rounded-[8px] border border-[rgba(201,168,76,0.3)] bg-transparent py-2.5 text-[13px] font-bold"
                  style={{ color: GOLD }}
                >
                  Notify me when the guide is ready
                </button>
                <InlineSignup
                  open={weldOpen === "b"}
                  specialty="welder-no-iso"
                  guideWanted
                  successMessage="You are on the list. We will notify you when the welding certification guide becomes available."
                  reducedMotion={reducedMotion}
                />
              </PathBlockShell>
            </div>
          </TradeCardShell>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-[680px] px-6 text-center text-[12px] italic text-[#6b7280]">
        Salary ranges are general market estimates based on publicly available data and collective agreements (tariffavtale).
        Actual compensation depends on individual qualifications, employer, and negotiation. ArbeidMatch does not guarantee
        any specific salary. Norwegian employer references significantly influence placement opportunities.
      </p>
    </section>
  );
}
