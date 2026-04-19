"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, Zap } from "lucide-react";

const GOLD = "#C9A84C";
const CARD_BG = "#0f1923";

type Glow = { x: number; y: number };

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

function TradeCaptureForm({
  specialty,
  guideWanted,
  submitLabel,
  successMessage,
  successNote,
}: {
  specialty: "electrician" | "welder";
  guideWanted?: boolean;
  submitLabel: string;
  successMessage: string;
  successNote?: string;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/guide-interest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          specialty,
          consent: true,
          ...(guideWanted ? { guideWanted: true } : {}),
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

  if (status === "success") {
    return (
      <div className="mt-3">
        <p className="text-[13px]" style={{ color: GOLD }}>
          {successMessage}
        </p>
        {successNote ? <p className="mt-2 text-[11px] text-white/[0.4]">{successNote}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 overflow-hidden">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="w-full rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
        autoComplete="email"
      />
      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-white/[0.5]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>I agree to receive job-related emails from ArbeidMatch</span>
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-3 w-full rounded-[8px] py-2.5 text-[13px] font-semibold text-[#0f1923] transition-opacity duration-200 disabled:opacity-60"
        style={{ background: GOLD }}
      >
        {submitLabel}
      </button>
      {status === "error" ? <p className="mt-2 text-[13px] text-red-400">Something went wrong. Please try again.</p> : null}
    </form>
  );
}

function SalaryInfoBox({
  label,
  value,
  note,
  sourceHref,
}: {
  label: string;
  value: string;
  note: string;
  sourceHref: string;
}) {
  return (
    <div className="mt-4 rounded-[8px] px-4 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
        {label}
      </p>
      <p className="text-[15px] font-bold text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-[1.5] text-white/[0.4]">{note}</p>
      <a
        href={sourceHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-[10px] font-medium text-gold underline-offset-2 hover:underline"
      >
        Source: Arbeidstilsynet.no
      </a>
    </div>
  );
}

function SpecialistCard({
  icon,
  eyebrow,
  title,
  body,
  features,
  salaryBox,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  capture,
  reducedMotion,
  reveal,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  features: string[];
  salaryBox: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  capture: {
    specialty: "electrician" | "welder";
    guideWanted?: boolean;
    submitLabel: string;
    successMessage: string;
    successNote?: string;
  };
  reducedMotion: boolean;
  reveal: boolean;
}) {
  const [glow, setGlow] = useState<Glow>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
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
      className="relative box-border w-full min-w-0 overflow-hidden rounded-[20px] border border-[rgba(201,168,76,0.15)] px-6 py-7 md:px-8 md:py-10"
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
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${glow.x}px ${glow.y}px, rgba(201,168,76,0.14), transparent 60%)`,
        }}
        aria-hidden
      />
      <div className="relative z-[1]">
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
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-white/[0.7]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {salaryBox}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPrimary}
            className="w-full rounded-[10px] py-3.5 text-[14px] font-bold text-[#0f1923] transition-opacity duration-200 hover:opacity-95"
            style={{ background: GOLD }}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowCapture((v) => !v)}
            className="w-full rounded-[10px] border border-[rgba(201,168,76,0.3)] bg-transparent py-3.5 text-[14px] font-bold transition-colors duration-200 hover:border-[rgba(201,168,76,0.5)]"
            style={{ color: GOLD }}
          >
            {secondaryLabel}
          </button>
        </div>
        <div
          className="grid transition-[grid-template-rows,opacity] duration-200 ease-out"
          style={{
            gridTemplateRows: showCapture ? "1fr" : "0fr",
            opacity: showCapture ? 1 : 0,
          }}
        >
          <div className="min-h-0 overflow-hidden">
            <TradeCaptureForm
              specialty={capture.specialty}
              guideWanted={capture.guideWanted}
              submitLabel={capture.submitLabel}
              successMessage={capture.successMessage}
              successNote={capture.successNote}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const ARBEIDSTILSYNET_MIN =
  "https://www.arbeidstilsynet.no/en/pay-and-engagement-of-employees/pay-and-minimum-rates-of-pay/minimum-wage/";

export default function TradeSpecialistCards() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const [card1, setCard1] = useState(reducedMotion);
  const [card2, setCard2] = useState(reducedMotion);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

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
      <div className="mx-auto grid w-full max-w-content gap-6 px-6 md:grid-cols-2 md:px-12 lg:gap-8 lg:px-20">
        <div ref={ref1}>
          <SpecialistCard
            reducedMotion={reducedMotion}
            reveal={card1}
            icon={<Zap size={28} color={GOLD} strokeWidth={1.5} />}
            eyebrow="Are you an electrician?"
            title="Work legally in Norway as a qualified electrician"
            body="To work as an electrician in Norway, you need DSB authorization. We help EU/EEA electricians navigate the approval process and connect with Norwegian employers who need your skills."
            features={[
              "DSB authorization guidance included",
              "Pre-screened job matches in your specialty",
              "Support before and after arrival in Norway",
            ]}
            salaryBox={
              <SalaryInfoBox
                label="Typical salary range"
                value="260 to 330 NOK per hour"
                note="Based on collective agreements (tariffavtale). Actual salary depends on DSB authorization level, experience, certifications, and employer. Norwegian employer references are highly valued and can significantly influence your rate."
                sourceHref={ARBEIDSTILSYNET_MIN}
              />
            }
            primaryLabel="Get DSB Authorization Guide"
            onPrimary={() => router.push("/dsb-support")}
            secondaryLabel="Register for job opportunities"
            capture={{
              specialty: "electrician",
              submitLabel: "Notify me of matching jobs",
              successMessage: "You are on the list. We will contact you when we have a match.",
            }}
          />
        </div>
        <div ref={ref2}>
          <SpecialistCard
            reducedMotion={reducedMotion}
            reveal={card2}
            icon={<Flame size={28} color={GOLD} strokeWidth={1.5} />}
            eyebrow="Are you a welder?"
            title="ISO-certified welders wanted for Norwegian shipyards"
            body="Norwegian shipyards and offshore companies are actively looking for ISO 9606 certified welders. Transport and accommodation are typically provided for project placements. We connect certified welders directly with employers."
            features={[
              "ISO 9606 and EN 287 certification required",
              "Free transport and accommodation typically included",
              "Direct placement at Norwegian shipyards and offshore sites",
            ]}
            salaryBox={
              <SalaryInfoBox
                label="Typical salary range"
                value="280 to 330 NOK per hour"
                note="Based on market rates for ISO-certified welders at Norwegian shipyards. Salary varies based on certifications held, years of experience, welding processes mastered, and Norwegian employer references. Some projects also include daily allowances. Rotation schedules are typically 4 weeks on, 2 weeks off or 6 weeks on, 2 weeks off."
                sourceHref={ARBEIDSTILSYNET_MIN}
              />
            }
            primaryLabel="View welding opportunities"
            onPrimary={() => router.push("/welding-specialists")}
            secondaryLabel="Get notified when welder guide is ready"
            capture={{
              specialty: "welder",
              guideWanted: true,
              submitLabel: "Notify me when guide is ready",
              successMessage:
                "Thank you. We will notify you when the welding guide is available and when we have matching opportunities.",
              successNote: "Your email is used only for this purpose. Unsubscribe anytime.",
            }}
          />
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-[680px] px-6 text-center text-[12px] italic text-[#6b7280]">
        Salary ranges shown are general market estimates based on collective agreements and publicly available data from
        Arbeidstilsynet.no. Actual compensation depends on individual qualifications, employer, project type, and negotiation.
        ArbeidMatch does not guarantee any specific salary level.
      </p>
    </section>
  );
}
