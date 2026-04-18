"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Check,
  CheckCircle2,
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

import { EASE_PREMIUM } from "@/lib/animationConstants";

const EASE = EASE_PREMIUM;

type Props = {
  candidateActivity: CandidateActivityStats;
  /** Optional strip below hero (omit on home to avoid duplicating hero live stats). */
  bannerSlot?: ReactNode;
  howItWorksSlot: ReactNode;
  testimonialsSlot: ReactNode;
};

export default function HomePageClient({
  candidateActivity,
  bannerSlot,
  howItWorksSlot,
  testimonialsSlot,
}: Props) {
  const reduce = useReducedMotion();

  const hero = !reduce ? (
    <motion.div
      className="md:col-span-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
      }}
    >
      <motion.p
        className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold"
        variants={{
          hidden: { opacity: 0, scale: 0.92 },
          visible: { opacity: 1, scale: 1, transition: { delay: 0.05, duration: 0.45, ease: EASE } },
        }}
      >
        EU/EEA Workforce Solutions · Norway
      </motion.p>
      <motion.h1
        className="mb-6 text-4xl font-bold leading-tight text-navy md:text-5xl"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.55, ease: EASE } },
        }}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </motion.h1>
      <motion.p
        className="mb-8 max-w-lg text-lg text-text-secondary"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5, ease: EASE } },
        }}
      >
        We source, screen and deliver pre-qualified EU/EEA workers for construction, logistics and industry. Fast,
        legal, and fully compliant.
      </motion.p>
      <motion.div
        className="flex flex-wrap gap-4"
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.45, ease: EASE } },
        }}
      >
        <Link
          href="/request"
          className="btn-gold-premium relative inline-block min-h-[44px] rounded-md bg-gold px-6 py-3 font-medium text-white hover:bg-gold-hover"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-block min-h-[44px] rounded-md border border-navy px-6 py-3 font-medium text-navy transition-colors hover:bg-surface"
        >
          How it works
        </Link>
      </motion.div>
      <motion.div
        className="mt-8 flex flex-wrap gap-6 text-sm text-text-secondary"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 0.45, duration: 0.4 } },
        }}
      >
        <p>✓ 500+ placements</p>
        <p>✓ 50+ Norwegian clients</p>
        <p>✓ 2-week delivery</p>
      </motion.div>
    </motion.div>
  ) : (
    <div className="md:col-span-3">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">EU/EEA Workforce Solutions · Norway</p>
      <h1 className="mb-6 text-4xl font-bold leading-tight text-navy md:text-5xl">
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </h1>
      <p className="mb-8 max-w-lg text-lg text-text-secondary">
        We source, screen and deliver pre-qualified EU/EEA workers for construction, logistics and industry. Fast,
        legal, and fully compliant.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/request"
          className="btn-gold-premium relative inline-block min-h-[44px] rounded-md bg-gold px-6 py-3 font-medium text-white hover:bg-gold-hover"
        >
          Request candidates
        </Link>
        <Link href="/#how-it-works" className="inline-block min-h-[44px] rounded-md border border-navy px-6 py-3 font-medium text-navy hover:bg-surface">
          How it works
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap gap-6 text-sm text-text-secondary">
        <p>✓ 500+ placements</p>
        <p>✓ 50+ Norwegian clients</p>
        <p>✓ 2-week delivery</p>
      </div>
    </div>
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
      <section className="flex min-h-screen items-center bg-white py-20">
        <div className="mx-auto grid w-full max-w-content gap-10 px-4 md:grid-cols-5 md:px-6">
          {hero}
          <ScrollReveal variant="scaleIn" className="md:col-span-2">
            <HeroStatsPanel
              candidatesRegisteredToday={candidateActivity.candidatesRegisteredToday}
              activeOnSiteNow={candidateActivity.activeOnSiteNow}
              totalVisits={candidateActivity.totalVisits}
            />
          </ScrollReveal>
        </div>
      </section>

      {bannerSlot}

      <section className="bg-surface py-24">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="text-4xl font-bold text-navy">Who are you?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" className="text-center">
            <p className="mb-12 mt-4 text-text-secondary">Two simple paths. Choose yours.</p>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2">
            <ScrollReveal variant="fadeUp">
              <article className="card-premium rounded-xl border border-border bg-white p-10 hover:shadow-lg">
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
                  className="btn-gold-premium relative mt-7 inline-block min-h-[44px] rounded-md bg-gold px-5 py-2.5 font-medium text-white hover:bg-gold-hover"
                >
                  Explore employer services →
                </Link>
              </article>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp">
              <article className="card-premium rounded-xl border border-border bg-white p-10 hover:shadow-lg">
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
                  className="mt-7 inline-block min-h-[44px] rounded-md bg-navy px-5 py-2.5 font-medium text-white transition active:scale-[0.98]"
                >
                  Explore candidate path →
                </Link>
              </article>
            </ScrollReveal>
          </div>
          <ScrollReveal variant="fadeUp" className="mt-8 text-center">
            <Link href="/dsb-support" className="text-sm font-semibold text-gold hover:text-gold-hover">
              Electrician DSB authorization support →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{howItWorksSlot}</ScrollReveal>

      <section className="bg-surface py-24">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="text-4xl font-bold text-navy">Industries we serve</h2>
          </ScrollReveal>
          <ScrollRevealGrid
            className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            items={industries}
            itemKey={([, title]) => title}
            renderItem={([Icon, title, text]) => (
              <article className="card-premium rounded-xl border border-border bg-white p-6 hover:border-gold">
                <Icon className="text-gold" size={28} />
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

      <section className="bg-white py-24">
        <div className="mx-auto grid w-full max-w-content gap-8 px-4 md:grid-cols-2 md:px-6">
          <ScrollReveal variant="fadeLeft" className="rounded-xl bg-navy p-12">
            <h2 className="mb-8 text-3xl font-bold text-white">Why Norwegian companies choose us</h2>
            <ul className="space-y-4">
              {[
                "Pre-screened, fully documented candidates",
                "Workers delivered within 2 weeks",
                "Full Norwegian labor law compliance",
                "Dedicated recruiter per client",
                "Follow-up after every placement",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="text-gold" size={20} /> {item}
                </li>
              ))}
            </ul>
          </ScrollReveal>
          <ScrollReveal variant="fadeRight">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["500+", "Placements completed"],
                ["50+", "Active Norwegian clients"],
                ["10+", "EU source countries"],
                ["98%", "Client satisfaction rate"],
              ].map(([number, label]) => (
                <article key={label} className="card-premium rounded-xl border border-border p-8 text-center">
                  <p className="text-5xl font-bold text-gold">{number}</p>
                  <p className="mt-3 text-text-secondary">{label}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{testimonialsSlot}</ScrollReveal>

      <section className="bg-navy py-24 text-center">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp">
            <h2 className="mb-4 text-4xl font-bold text-white">Ready to find your next workers?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mb-8 text-lg text-white/70">
              Contact us today and receive pre-qualified candidates within 2 weeks.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium relative inline-block min-h-[48px] rounded-md bg-gold px-8 py-4 text-lg font-medium text-white hover:bg-gold-hover"
            >
              Request candidates now
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
