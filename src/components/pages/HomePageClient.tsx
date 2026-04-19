"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Check,
  Factory,
  Forklift,
  HardHat,
  HeartPulse,
  Hotel,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import HeroStatsPanel from "@/components/HeroStatsPanel";
import ScrollReveal, { ScrollRevealGrid } from "@/components/ScrollReveal";
import type { CandidateActivityStats } from "@/lib/candidateActivityStats";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;
const HERO_DURATION = 0.8;

type Props = {
  candidateActivity: CandidateActivityStats;
  howItWorksSlot: ReactNode;
  testimonialsSlot: ReactNode;
};

export default function HomePageClient({ candidateActivity, howItWorksSlot, testimonialsSlot }: Props) {
  const reduce = useReducedMotion();

  const fade = (delaySec: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0 } as const,
          animate: { opacity: 1 } as const,
          transition: { duration: HERO_DURATION, delay: delaySec, ease: HERO_EASE },
        };

  const hero = !reduce ? (
    <div className="min-w-0">
      <motion.p
        className="am-eyebrow mb-5 font-semibold uppercase tracking-[0.12em] text-[#B8860B]"
        {...fade(0)}
      >
        EU/EEA Workforce Solutions · Norway
      </motion.p>
      <motion.h1
        className="am-h1 mb-6 max-w-full break-words font-sans font-extrabold text-navy sm:max-w-[22ch]"
        {...fade(0.1)}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </motion.h1>
      <motion.p className="mb-8 max-w-[480px] leading-[1.6] text-[#555555]" {...fade(0.25)}>
        We source, screen and deliver pre-qualified EU/EEA workers for construction, logistics and industry. Fast,
        legal, and fully compliant.
      </motion.p>
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" {...fade(0.4)}>
        <Link
          href="/request"
          className="btn-gold-premium relative inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-gold px-6 py-3 font-medium text-white hover:bg-gold-hover sm:w-auto"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md border border-navy px-6 py-3 font-medium text-navy transition-colors hover:bg-surface sm:w-auto"
        >
          How it works
        </Link>
      </motion.div>
      <motion.div
        className="mt-8 grid grid-cols-2 gap-x-3 gap-y-2 text-center text-[11px] leading-snug text-[#888888] sm:text-xs md:grid-cols-3 md:text-[13px] md:leading-relaxed"
        {...fade(0.55)}
      >
        <span>500+ placements</span>
        <span>50+ Norwegian clients</span>
        <span className="col-span-2 md:col-span-1">2-week delivery</span>
      </motion.div>
    </div>
  ) : (
    <div className="min-w-0">
      <p className="am-eyebrow mb-5 font-semibold uppercase tracking-[0.12em] text-[#B8860B]">
        EU/EEA Workforce Solutions · Norway
      </p>
      <h1 className="am-h1 mb-6 max-w-full break-words font-sans font-extrabold text-navy sm:max-w-[22ch]">
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </h1>
      <p className="mb-8 max-w-[480px] leading-[1.6] text-[#555555]">
        We source, screen and deliver pre-qualified EU/EEA workers for construction, logistics and industry. Fast, legal,
        and fully compliant.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/request"
          className="btn-gold-premium relative inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-gold px-6 py-3 font-medium text-white hover:bg-gold-hover sm:w-auto"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md border border-navy px-6 py-3 font-medium text-navy transition-colors hover:bg-surface sm:w-auto"
        >
          How it works
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-2 text-center text-[11px] leading-snug text-[#888888] sm:text-xs md:grid-cols-3 md:text-[13px] md:leading-relaxed">
        <span>500+ placements</span>
        <span>50+ Norwegian clients</span>
        <span className="col-span-2 md:col-span-1">2-week delivery</span>
      </div>
    </div>
  );

  const statsBlock = (
    <HeroStatsPanel
      candidatesRegisteredToday={candidateActivity.candidatesRegisteredToday}
      activeOnSiteNow={candidateActivity.activeOnSiteNow}
      totalVisits={candidateActivity.totalVisits}
    />
  );

  const industries: [LucideIcon, string, string][] = [
    [HardHat, "Construction & Renovation", "Skilled trades and building teams."],
    [Forklift, "Logistics & Warehouse", "Warehouse, forklift and terminal roles."],
    [Factory, "Industry & Production", "Production lines and factory operations."],
    [Sparkles, "Cleaning & Facility", "Professional cleaning and facility support."],
    [Hotel, "Hotel, Restaurant & Café", "Kitchen, service and housekeeping staff."],
    [HeartPulse, "Care & Health", "Support workers for care-driven services."],
  ];

  return (
    <>
      <section className="flex min-h-screen items-center bg-white py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-8 px-6 md:grid-cols-2 md:gap-10 md:px-12 lg:gap-12 lg:px-20">
          {hero}
          {!reduce ? (
            <motion.div
              className="min-w-0 md:row-span-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: HERO_DURATION, delay: 0.2, ease: HERO_EASE }}
            >
              {statsBlock}
            </motion.div>
          ) : (
            <div className="min-w-0">{statsBlock}</div>
          )}
        </div>
      </section>

      <section className="bg-surface py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl font-sans font-extrabold text-navy">Who are you?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" className="text-center">
            <p className="mb-14 mt-4 text-text-secondary">Two simple paths. Choose yours.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
            <ScrollReveal variant="fadeUp">
              <article className="who-choice-card card-premium rounded-xl border border-border bg-white p-10">
                <Building2 className="text-gold" size={32} />
                <h3 className="mt-4 text-2xl font-semibold text-navy">I&apos;m an employer</h3>
                <p className="mt-2 text-text-secondary">Norwegian company looking for qualified workers</p>
                <ul className="mt-6 space-y-2">
                  {[
                    "Fast candidate delivery",
                    "Pre-screened workers only",
                    "Legal and compliant staffing",
                    "Dedicated recruiter support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-navy">
                      <Check size={16} className="text-gold" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/for-employers"
                  className="btn-gold-premium relative mt-7 inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 font-medium text-white hover:bg-gold-hover sm:w-auto"
                >
                  Explore employer services →
                </Link>
              </article>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp">
              <article className="who-choice-card card-premium rounded-xl border border-border bg-white p-10">
                <User className="text-gold" size={32} />
                <h3 className="mt-4 text-2xl font-semibold text-navy">I&apos;m a candidate</h3>
                <p className="mt-2 text-text-secondary">Looking for legal work in Norway</p>
                <ul className="mt-6 space-y-2">
                  {[
                    "Legal employment contracts",
                    "Clear salary expectations",
                    "Support before and after arrival",
                    "Direct access to active jobs",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-navy">
                      <Check size={16} className="text-gold" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/for-candidates"
                  className="mt-7 inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-navy px-5 py-2.5 font-medium text-white transition active:scale-[0.98] sm:w-auto"
                >
                  Explore candidate path →
                </Link>
              </article>
            </ScrollReveal>
          </div>
          <ScrollReveal variant="fadeUp" className="mt-10 text-center">
            <Link href="/dsb-support" className="text-sm font-semibold text-gold hover:text-gold-hover">
              Electrician DSB authorization support →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{howItWorksSlot}</ScrollReveal>

      <section className="bg-surface py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl font-sans font-extrabold text-navy">Industries we serve</h2>
          </ScrollReveal>
          <ScrollRevealGrid
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12"
            items={industries}
            itemKey={([, title]) => title}
            renderItem={([Icon, title, text]) => (
              <article className="card-premium rounded-xl border border-border bg-white p-6 hover:border-gold">
                <Icon className="shrink-0 text-gold" size={24} strokeWidth={1.75} />
                <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{text}</p>
                <a href="/score" className="mt-4 inline-block text-sm text-gold">
                  View roles →
                </a>
              </article>
            )}
          />
        </div>
      </section>

      <section className="bg-white py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="mx-auto max-w-4xl rounded-xl bg-navy p-10 md:p-12">
              <h2 className="am-h2 heading-premium-xl mb-6 font-extrabold text-white">
                Rekruttering som fungerer - for alle parter
              </h2>
              <p className="leading-relaxed text-white/80">
                Vi tror ikke vi har funnet opp noe nytt. Men vi organiserer prosessen så godt vi kan - slik at kandidater
                fra ulike kulturer, bakgrunner og religioner opplever respekt og klarhet fra første kontakt. Og slik at
                norske arbeidsgivere får arbeidskraft som faktisk fungerer i deres miljø.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Kulturell og religiøs sensitivitet i screening-prosessen",
                  "Tydelig kommunikasjon på tvers av språk og forventninger",
                  "Vi lover ikke perfeksjon - vi lover kontinuerlig forbedring",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white">
                    <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="h-5 w-5 md:h-5 md:w-5">
                        <path
                          d="M12 3l2.4 5.5L20 9.3l-4.3 3.7 1.3 5.5L12 15.9 6 18.5l1.3-5.5L3 9.3l5.6-.8L12 3z"
                          fill="currentColor"
                          opacity={0.9}
                        />
                      </svg>
                    </span>
                    <span className="text-[15px] leading-relaxed text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{testimonialsSlot}</ScrollReveal>

      <section className="mesh-cta-wrap bg-navy py-12 text-center md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 heading-premium-xl mb-4 font-extrabold text-white">Ready to find your next workers?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mb-8 text-lg text-white/70">
              Contact us today and receive pre-qualified candidates within 2 weeks.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium relative mx-auto inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-4 text-lg font-medium text-white hover:bg-gold-hover sm:inline-block sm:w-auto sm:max-w-none"
            >
              Request candidates now
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
