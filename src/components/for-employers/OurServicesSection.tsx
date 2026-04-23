"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ClipboardCheck, MapPin, Presentation, RefreshCw, Search, Users, type LucideIcon } from "lucide-react";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;
const GOLD = "#C9A84C";

type ServiceItem = {
  Icon: LucideIcon;
  title: string;
  body: string;
};

const SERVICES: ServiceItem[] = [
  {
    Icon: Search,
    title: "Sourcing & Headhunting",
    body: "We identify qualified EU/EEA candidates through direct networks, not just job boards. Blue-collar, English-speaking, ready to work in Norway.",
  },
  {
    Icon: Users,
    title: "Staffing & Bemanning",
    body: "As an Arbeidstilsynet-authorized staffing company, we handle employment contracts, payroll, and daily staffing administration on your behalf.",
  },
  {
    Icon: ClipboardCheck,
    title: "Candidate Pre-Screening",
    body: "We pre-screen candidates based on their profile responses, CV, and compatibility score before presenting them to you. Full screening applies to candidates employed directly through ArbeidMatch.",
  },
  {
    Icon: MapPin,
    title: "Onboarding Support",
    body: "We coordinate pre-arrival logistics, documentation, and practical onboarding. Your new employee arrives prepared and ready to start on day one.",
  },
  {
    Icon: RefreshCw,
    title: "Follow-up & Retention",
    body: "Regular follow-up with both you and the candidate after placement. We identify and resolve issues early to ensure long-term success.",
  },
  {
    Icon: Presentation,
    title: "Candidate Presentation",
    body: "You receive a structured profile of shortlisted candidates with experience, certifications, and references. Clear, actionable, no noise.",
  },
];

function useIsMobileWidth(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
}

export default function OurServicesSection() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobileWidth();
  const gridRef = useRef(null);
  const isInView = useInView(gridRef, { once: true, margin: "0px 0px -8% 0px", amount: 0.12 });
  const stagger = isMobile ? 0.05 : 0.09;

  return (
    <section className="border-t border-white/5 bg-[#06090e] py-16 md:py-24 lg:py-32">
      <div ref={gridRef} className="mx-auto w-full max-w-content px-4 md:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#B8860B]">What we do</p>
        <h2 className="mt-5 text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
          Our services
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-white/60 md:text-[17px]">
          Everything you need to find, hire, and onboard qualified EU/EEA workers.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
          {SERVICES.map((item, i) => {
            const Icon = item.Icon;
            return (
              <motion.article
                key={item.title}
                className="rn-card-net flex h-full min-h-0 flex-col p-8 md:p-9"
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: reduce ? 0 : i * stagger,
                  duration: isMobile ? 0.45 : 0.58,
                  ease: HERO_EASE,
                }}
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.08)]">
                    <span className="rn-icon-inner inline-flex">
                      <Icon size={22} color={GOLD} strokeWidth={1.5} aria-hidden />
                    </span>
                  </div>
                  <h3 className="mb-2 shrink-0 text-lg font-bold text-white">{item.title}</h3>
                  <p className="min-h-0 flex-1 text-sm leading-relaxed text-white/65 md:text-[15px] md:leading-[1.72]">
                    {item.body}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-16 text-center md:mt-20">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-10 py-4 text-[15px] font-semibold text-[#0D1B2A] hover:bg-gold-hover"
          >
            Request candidates
          </Link>
        </div>
      </div>
    </section>
  );
}
