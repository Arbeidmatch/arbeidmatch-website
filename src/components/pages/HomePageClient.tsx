"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
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

import BemanningCard from "@/components/home/BemanningCard";
import RoleSelector from "@/components/onboarding/RoleSelector";
import WeldingSpecialistsCard from "@/components/welding/WeldingSpecialistsCard";
import ScrollReveal, { ScrollRevealGrid } from "@/components/ScrollReveal";
import ComingSoonCapture from "@/components/ui/ComingSoonCapture";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;
const HERO_DURATION = 0.8;

type Props = {
  howItWorksSlot: ReactNode;
  testimonialsSlot: ReactNode;
};

export default function HomePageClient({ howItWorksSlot, testimonialsSlot }: Props) {
  const reduce = useReducedMotion();
  const [sessionRoleBanner, setSessionRoleBanner] = useState<null | "employer" | "candidate">(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = window.sessionStorage.getItem("roleSelected");
      if (v === "employer" || v === "candidate") startTransition(() => setSessionRoleBanner(v));
    } catch {
      /* ignore */
    }
  }, []);

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
        className="am-h1 mb-6 max-w-full break-words font-sans font-extrabold text-white sm:max-w-[22ch]"
        style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
        {...fade(0.1)}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </motion.h1>
      <motion.p className="mb-8 max-w-[480px] leading-[1.6] text-white/70" {...fade(0.25)}>
        We source, screen and work to connect you with pre-qualified EU/EEA workers for construction, logistics and industry.
        We source and screen EU/EEA workers for Norwegian businesses. Employers remain responsible for compliance with
        applicable Norwegian labor law and collective agreements.
      </motion.p>
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" {...fade(0.4)}>
        <Link
          href="/request"
          className="btn-gold-premium relative inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-gold px-6 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:w-auto"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.3)] px-6 py-3 font-medium text-white transition-colors hover:bg-[rgba(201,168,76,0.08)] sm:w-auto"
        >
          How it works
        </Link>
      </motion.div>
    </div>
  ) : (
    <div className="min-w-0">
      <p className="am-eyebrow mb-5 font-semibold uppercase tracking-[0.12em] text-[#B8860B]">
        EU/EEA Workforce Solutions · Norway
      </p>
      <h1
        className="am-h1 mb-6 max-w-full break-words font-sans font-extrabold text-white sm:max-w-[22ch]"
        style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </h1>
      <p className="mb-8 max-w-[480px] leading-[1.6] text-white/70">
        We source, screen and work to connect you with pre-qualified EU/EEA workers for construction, logistics and industry.
        We source and screen EU/EEA workers for Norwegian businesses. Employers remain responsible for compliance with
        applicable Norwegian labor law and collective agreements.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/request"
          className="btn-gold-premium relative inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-gold px-6 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:w-auto"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.3)] px-6 py-3 font-medium text-white transition-colors hover:bg-[rgba(201,168,76,0.08)] sm:w-auto"
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
    <div style={{ background: "#0D1B2A", minHeight: "100vh" }}>
      <RoleSelector />
      <section className="flex items-center bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          {hero}
        </div>
      </section>

      <BemanningCard />

      {sessionRoleBanner === "employer" ? (
        <motion.div
          className="border-b border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.08)] px-6 py-2.5 md:px-12 lg:px-20"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[13px] text-white/70">
            <span>Welcome back.</span>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline"
            >
              Browse open positions
            </a>
          </div>
        </motion.div>
      ) : null}
      {sessionRoleBanner === "candidate" ? (
        <motion.div
          className="border-b border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.08)] px-6 py-2.5 md:px-12 lg:px-20"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[13px] text-white/70">
            <span>Welcome back. Looking for work in Norway?</span>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline"
            >
              Browse open positions
            </a>
          </div>
        </motion.div>
      ) : null}

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl font-sans font-extrabold text-white">Who are you?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" className="text-center">
            <p className="mb-14 mt-4 text-white/70">Two simple paths. Choose yours.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-12">
            <ScrollReveal variant="fadeUp">
              <article className="who-choice-card card-premium rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-10">
                <Building2 className="text-gold" size={32} />
                <h3 className="mt-4 text-2xl font-semibold text-white">I&apos;m an employer</h3>
                <p className="mt-2 text-white/70">Norwegian company looking for qualified workers</p>
                <ul className="mt-6 space-y-2">
                  {[
                    "Fast candidate delivery",
                    "Pre-screened candidate profiles",
                    "Legal and compliant staffing",
                    "Dedicated recruiter support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-white">
                      <Check size={16} className="text-gold" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/for-employers"
                  className="btn-gold-premium relative mt-7 inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:w-auto"
                >
                  Explore employer services →
                </Link>
              </article>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp">
              <article className="who-choice-card card-premium rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-10">
                <User className="text-gold" size={32} />
                <h3 className="mt-4 text-2xl font-semibold text-white">I&apos;m a candidate</h3>
                <p className="mt-2 text-white/70">Looking for legal work in Norway</p>
                <ul className="mt-6 space-y-2">
                  {[
                    "Legal employment contracts",
                    "Clear salary expectations",
                    "Support before and after arrival",
                    "Direct access to active jobs",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-white">
                      <Check size={16} className="text-gold" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/for-candidates"
                  className="mt-7 inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.3)] bg-transparent px-5 py-2.5 font-medium text-white transition hover:bg-[rgba(201,168,76,0.08)] active:scale-[0.98] sm:w-auto"
                >
                  Explore candidate path →
                </Link>
              </article>
            </ScrollReveal>
          </div>
          <ScrollReveal variant="fadeUp" className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setComingSoonFeature("dsb-authorization-guide")}
              className="text-sm font-semibold text-gold hover:text-gold-hover"
            >
              Electrician DSB authorization support, Coming soon
            </button>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{howItWorksSlot}</ScrollReveal>

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl font-sans font-extrabold text-white">Industries we serve</h2>
          </ScrollReveal>
          <ScrollRevealGrid
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12"
            items={industries}
            itemKey={([, title]) => title}
            renderItem={([Icon, title, text]) => (
              <article className="card-premium rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-6 hover:border-gold">
                <Icon className="shrink-0 text-gold" size={24} strokeWidth={1.75} />
                <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-white/70">{text}</p>
                <a
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm text-gold"
                >
                  View roles →
                </a>
              </article>
            )}
          />
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="mx-auto max-w-4xl rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-10 md:p-12">
              <h2 className="am-h2 heading-premium-xl mb-6 font-extrabold text-white">
                Recruitment that works. For everyone.
              </h2>
              <p className="leading-relaxed text-white/80">
                We have not invented anything new. But we organize the process as well as we can, so that candidates from
                different cultures, backgrounds and religions experience respect and clarity from the first contact. And so
                that Norwegian employers get workers who genuinely fit their environment.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Cultural and religious sensitivity throughout our screening process",
                  "Clear communication across languages and expectations",
                  "We do not promise perfection. We work continuously to improve our process and service.",
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

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <WeldingSpecialistsCard />
      </section>

      <section className="mesh-cta-wrap bg-navy py-12 text-center md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 heading-premium-xl mb-4 font-extrabold text-white">Ready to find your next workers?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mb-8 text-lg text-white/70">
              Contact us today. Our goal is to connect you with pre-qualified candidates within about two weeks.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium relative mx-auto inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-4 text-lg font-medium text-[#0D1B2A] hover:bg-gold-hover sm:inline-block sm:w-auto sm:max-w-none"
            >
              Request candidates now
            </Link>
          </ScrollReveal>
        </div>
      </section>
      {comingSoonFeature ? (
        <ComingSoonCapture featureName={comingSoonFeature} isOpen onClose={() => setComingSoonFeature(null)} />
      ) : null}
    </div>
  );
}
