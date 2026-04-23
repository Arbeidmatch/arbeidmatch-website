"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { FileCheck, Megaphone, UserSearch, Users, type LucideIcon } from "lucide-react";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;

type ServiceCard = {
  title: string;
  text: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  badge?: string;
};

const CARDS: ServiceCard[] = [
  {
    title: "Full Recruitment",
    text: "We manage the entire process: sourcing, pre-screening, and candidate presentation. You make the final hiring decision.",
    href: "/request",
    cta: "Request candidates →",
    icon: UserSearch,
  },
  {
    title: "Staffing & Bemanning",
    text: "We become the employer of record. We handle contracts, payroll, and HR administration. You focus on the work.",
    href: "/request",
    cta: "View staffing options →",
    icon: Users,
  },
  {
    title: "Direct Advertising",
    text: "We publish your position across our EU/EEA networks and channels. You receive applications and hire directly.",
    href: "/contact",
    cta: "Ask about advertising →",
    icon: Megaphone,
  },
  {
    title: "You Found the Candidate — We Employ Them",
    text: "Already found the right person? We can act as employer of record and handle the legal employment on your behalf. Available for most sectors. Note: restrictions apply in construction (bygg og anlegg) per Norwegian law from 2023.",
    href: "/contact",
    cta: "Talk to us →",
    icon: FileCheck,
    badge: "Subject to sector eligibility",
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

export default function ForEmployersExtendedServices() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobileWidth();
  const gridRef = useRef(null);
  const headRef = useRef(null);
  const gridInView = useInView(gridRef, { once: true, margin: "0px 0px -8% 0px", amount: 0.12 });
  const headInView = useInView(headRef, { once: true, amount: 0.2 });
  const stagger = isMobile ? 0.06 : 0.1;

  return (
    <section className="border-t border-white/5 bg-[#06090e] py-16 md:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <motion.div
          ref={headRef}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: isMobile ? 0.45 : 0.6, ease: HERO_EASE }}
        >
          <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
            Need candidates but want to hire directly?
          </h2>
        </motion.div>
        <div ref={gridRef} className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:mt-20 lg:gap-10">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                animate={gridInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: reduce ? 0 : i * stagger,
                  duration: isMobile ? 0.45 : 0.58,
                  ease: HERO_EASE,
                }}
                className="h-full"
              >
                <Link
                  href={card.href}
                  className="rn-card-net group flex h-full flex-col p-8 no-underline transition-transform duration-200 md:p-9"
                >
                  <span className="rn-icon-inner inline-flex text-[#C9A84C] transition-transform duration-200 group-hover:scale-105">
                    <Icon className="block h-7 w-7 md:h-9 md:w-9" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-white">{card.title}</h3>
                  {card.badge ? (
                    <span className="mt-4 inline-flex w-fit rounded-full border border-[#B8860B]/50 bg-[#B8860B]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
                      {card.badge}
                    </span>
                  ) : null}
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-white/65 md:text-[15px] md:leading-[1.72]">
                    {card.text}
                  </p>
                  <span className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold text-[#B8860B] underline-offset-4 group-hover:text-gold-hover group-hover:underline">
                    {card.cta}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <motion.p
          className="mx-auto mt-16 max-w-3xl text-center text-[13px] italic leading-relaxed text-white/55 md:mt-20"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={gridInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            delay: reduce ? 0 : CARDS.length * stagger + 0.12,
            duration: 0.55,
            ease: HERO_EASE,
          }}
        >
          ArbeidMatch takes responsibility for what is within our control. We are transparent about process, expectations
          and limitations, and we continuously improve.
        </motion.p>
      </div>
    </section>
  );
}
