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

import UnifiedHomeStats from "@/components/UnifiedHomeStats";
import ScrollReveal, { ScrollRevealGrid } from "@/components/ScrollReveal";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;
const HERO_DURATION = 0.8;

type Props = {
  howItWorksSlot: ReactNode;
  testimonialsSlot: ReactNode;
};

export default function HomePageClient({ howItWorksSlot, testimonialsSlot }: Props) {
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
    <div className="max-w-3xl">
      <motion.p
        className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B8860B]"
        {...fade(0)}
      >
        EU/EEA Workforce Solutions · Norway
      </motion.p>
      <motion.h1
        className="mb-6 max-w-full break-words font-sans font-extrabold leading-[1.08] tracking-[-0.04em] text-navy sm:max-w-[22ch]"
        style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        {...fade(0.1)}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </motion.h1>
      <motion.p
        className="mb-8 max-w-[480px] text-[17px] leading-[1.6] text-[#555555]"
        {...fade(0.25)}
      >
        We source, screen and deliver pre-qualified EU/EEA workers for construction, logistics and industry. Fast,
        legal, and fully compliant.
      </motion.p>
      <motion.div className="flex flex-wrap gap-4" {...fade(0.4)}>
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
    </div>
  ) : (
    <div className="max-w-3xl">
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B8860B]">
        EU/EEA Workforce Solutions · Norway
      </p>
      <h1
        className="mb-6 max-w-full break-words font-sans font-extrabold leading-[1.08] tracking-[-0.04em] text-navy sm:max-w-[22ch]"
        style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </h1>
      <p className="mb-8 max-w-[480px] text-[17px] leading-[1.6] text-[#555555]">
        We source, screen and deliver pre-qualified EU/EEA workers for construction, logistics and industry. Fast, legal,
        and fully compliant.
      </p>
      <div className="flex flex-wrap gap-4">
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
      <section className="flex min-h-screen flex-col justify-center bg-white pt-12 md:pt-20">
        <div className="mx-auto w-full max-w-content px-4 pb-10 md:px-6 md:pb-14">
          {!reduce ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
              {hero}
            </motion.div>
          ) : (
            hero
          )}
        </div>
        <UnifiedHomeStats />
      </section>

      <section className="bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-sans text-4xl text-navy">Who are you?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" className="text-center">
            <p className="mb-14 mt-4 text-text-secondary">Two simple paths. Choose yours.</p>
          </ScrollReveal>
          <div className="grid gap-8 md:grid-cols-2">
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
                  className="btn-gold-premium relative mt-7 inline-block min-h-[44px] rounded-md bg-gold px-5 py-2.5 font-medium text-white hover:bg-gold-hover"
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
                  className="mt-7 inline-block min-h-[44px] rounded-md bg-navy px-5 py-2.5 font-medium text-white transition active:scale-[0.98]"
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

      <section className="bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-sans text-4xl text-navy">Industries we serve</h2>
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

      <section className="bg-white py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp">
            <div className="mx-auto max-w-4xl rounded-xl bg-navy p-10 md:p-12">
              <h2 className="heading-premium-xl mb-8 text-3xl text-white">Why Norwegian companies choose us</h2>
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
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{testimonialsSlot}</ScrollReveal>

      <section className="mesh-cta-wrap bg-navy py-12 text-center md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp">
            <h2 className="heading-premium-xl mb-4 text-4xl text-white">Ready to find your next workers?</h2>
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
