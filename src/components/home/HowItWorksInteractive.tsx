"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const GOLD = "#C9A84C";

type CardDef = {
  badge: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  body: string;
  steps: string[];
  cta: { label: string; href: string };
  subscriptionNote?: string;
};

const CARDS: CardDef[] = [
  {
    badge: "01",
    title: "For Staffing Agencies",
    subtitle: "You have the client. We source the candidates.",
    eyebrow: "Staffing Agency Partners",
    body: "You send us the request. We search our EU/EEA network and do the pre-screening. You conduct the interview and handle all legal hiring procedures. We support you with candidate documentation and background information.",
    steps: [
      "You send us the candidate request with requirements",
      "We source and pre-screen across EU and EEA countries",
      "We present qualified candidates to you",
      "You interview, select, and manage the hiring process",
    ],
    cta: { label: "Send us a candidate request", href: "/request" },
  },
  {
    badge: "02",
    title: "For Direct Employers",
    subtitle: "Full service from search to onboarding.",
    eyebrow: "End Client Staffing",
    body: "You send us your request. We search, select, and present candidates. We consult with you on the proposal, hire the candidate on your behalf, handle all legal employment procedures, and prepare the candidate to start. After placement, we do weekly follow-up with both the client and the candidate to make sure everything is working well.",
    steps: [
      "You send us the request with role, location, and requirements",
      "We search and select the best matching candidates",
      "We present our proposal and consult with you",
      "We hire the candidate and handle all legal and administrative steps",
      "Candidate arrives prepared and ready to start",
      "Weekly follow-up with client and candidate as needed",
    ],
    cta: { label: "Request candidates", href: "/request" },
  },
  {
    badge: "03",
    title: "Job Advertising",
    subtitle: "Reach EU/EEA candidates directly on our channels.",
    eyebrow: "Direct Advertising Service",
    body: "Any officially registered Norwegian company can advertise open positions through ArbeidMatch. We publish your vacancy across our EU/EEA online channels and networks in Europe to reach qualified candidates directly. Available as a monthly subscription or per role.",
    steps: [
      "You send us the job posting request",
      "We review it for compliance with Norwegian advertising standards",
      "We publish across our EU/EEA candidate channels in Europe",
      "Candidates apply directly or through us based on your preference",
    ],
    subscriptionNote:
      "Available as a monthly subscription or per position. Contact us for current rates.",
    cta: { label: "Ask about advertising", href: "/contact" },
  },
];

function desktopGridCols(selected: number | null, reduceMotion: boolean): string {
  if (reduceMotion || selected === null) return "md:grid-cols-3";
  if (selected === 0) return "md:grid-cols-[2fr_0.75fr_0.75fr]";
  if (selected === 1) return "md:grid-cols-[0.75fr_2fr_0.75fr]";
  return "md:grid-cols-[0.75fr_0.75fr_2fr]";
}

export default function HowItWorksInteractive() {
  const [selected, setSelected] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const on = mq.matches;
      setReduceMotion(on);
      if (on) setSelected(0);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toggle = (i: number) => {
    setSelected((s) => (s === i ? null : i));
  };

  const gridTransition = reduceMotion ? "" : "md:transition-[grid-template-columns] md:duration-[350ms] md:ease-out";

  return (
    <section id="how-it-works" className="bg-[#0D1B2A] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <h2 className="heading-premium-xl text-center font-display text-4xl text-white">How we work</h2>
        <p className="subheading-premium mt-4 text-center text-white/70">Choose the service that fits your needs.</p>

        <div className={`mt-14 grid grid-cols-1 gap-6 ${desktopGridCols(selected, reduceMotion)} ${gridTransition}`}>
          {CARDS.map((card, i) => {
            const open = reduceMotion ? i === 0 : selected === i;
            const dimOthers = !reduceMotion && selected !== null && !open;

            return (
              <div
                key={card.badge}
                role={reduceMotion ? undefined : "button"}
                tabIndex={reduceMotion ? -1 : 0}
                onClick={() => !reduceMotion && toggle(i)}
                onKeyDown={(e) => {
                  if (reduceMotion) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(i);
                  }
                }}
                className={`relative overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-5 py-6 md:px-7 md:py-8 ${
                  reduceMotion ? "cursor-default" : "cursor-pointer"
                } ${
                  !reduceMotion && !open
                    ? "transition-all duration-[350ms] ease-out md:hover:-translate-y-1 md:hover:border-[rgba(201,168,76,0.4)]"
                    : !reduceMotion
                      ? "transition-all duration-[350ms] ease-out"
                      : ""
                } ${open ? "md:scale-[1.01]" : ""} ${
                  dimOthers ? "md:scale-[0.98] md:opacity-50" : "opacity-100"
                }`}
                style={{
                  borderColor: open ? GOLD : "rgba(201,168,76,0.15)",
                  borderWidth: "1px",
                  transitionProperty: reduceMotion ? "none" : "transform, opacity, border-color, border-width",
                  transitionDuration: reduceMotion ? "0ms" : "350ms",
                  transitionTimingFunction: "ease-out",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[32px] font-extrabold leading-none" style={{ color: GOLD }}>
                      {card.badge}
                    </p>
                    <h3 className="mt-3 text-[18px] font-bold text-white">{card.title}</h3>
                    <p className="mt-2 text-[14px] leading-snug text-white/70">{card.subtitle}</p>
                  </div>
                  <ChevronRight
                    className={`mt-1 h-4 w-4 shrink-0 ${reduceMotion ? "" : "transition-transform duration-300 ease-out"} ${
                      open ? "rotate-90" : ""
                    }`}
                    style={{ color: GOLD }}
                    aria-hidden
                  />
                </div>

                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: open ? 600 : 0,
                    transitionProperty: reduceMotion ? "none" : "max-height, opacity",
                    transitionDuration: reduceMotion ? "0ms" : "350ms",
                    transitionTimingFunction: "ease-out",
                    opacity: open ? 1 : 0,
                  }}
                >
                  <div
                    className="pt-4"
                    style={{
                      opacity: open ? 1 : 0,
                      transitionProperty: reduceMotion ? "none" : "opacity",
                      transitionDuration: reduceMotion ? "0ms" : "200ms",
                      transitionTimingFunction: "ease-out",
                      transitionDelay: open && !reduceMotion ? "150ms" : "0ms",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
                      {card.eyebrow}
                    </p>
                    <p className="mt-3 text-sm leading-[1.75] text-white/70">{card.body}</p>
                    <ul className="mt-4 flex flex-col gap-2.5">
                      {card.steps.map((s) => (
                        <li key={s} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/70">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                    {card.subscriptionNote ? (
                      <div
                        className="mt-4 rounded-lg border-l-[3px] px-4 py-3 text-[13px] leading-relaxed text-white/70"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderLeftColor: GOLD,
                        }}
                      >
                        {card.subscriptionNote}
                      </div>
                    ) : null}
                    <Link
                      href={card.cta.href}
                      className="mt-5 flex w-full items-center justify-center rounded-lg text-center text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-95"
                      style={{ background: GOLD, padding: "12px 20px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {card.cta.label}
                    </Link>
                    {open && !reduceMotion ? (
                      <p className="mt-2.5 text-center text-[11px] text-white/70">Click to collapse</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
