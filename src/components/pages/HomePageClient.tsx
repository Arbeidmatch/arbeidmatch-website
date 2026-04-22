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
        className="am-eyebrow mb-6 font-semibold uppercase tracking-[0.14em] text-[#C9A84C]"
        {...fade(0)}
      >
        EU/EEA Workforce Solutions · Norway
      </motion.p>
      <motion.h1
        className="am-h1 mb-8 max-w-full break-words font-sans font-extrabold tracking-tight text-white sm:max-w-[22ch]"
        style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.06 }}
        {...fade(0.1)}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </motion.h1>
      <motion.p
        className="mb-10 max-w-[34rem] text-[17px] font-normal leading-[1.65] tracking-tight text-white/65"
        {...fade(0.25)}
      >
        We source and screen pre-qualified EU/EEA workers for Norwegian businesses in construction, logistics, and industry.
        Employers remain responsible for compliance with applicable Norwegian labor law and collective agreements.
      </motion.p>
      <motion.div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center" {...fade(0.4)}>
        <Link
          href="/request"
          className="btn-gold-premium relative inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl bg-gold px-8 py-3.5 text-[15px] font-semibold tracking-tight text-[#0D1B2A] hover:bg-gold-hover sm:w-auto"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl border border-[rgba(201,168,76,0.22)] px-8 py-3.5 text-[15px] font-medium tracking-tight text-white/90 transition-colors duration-300 hover:border-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.06)] sm:w-auto"
        >
          How it works
        </Link>
      </motion.div>
    </div>
  ) : (
    <div className="min-w-0">
      <p className="am-eyebrow mb-6 font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
        EU/EEA Workforce Solutions · Norway
      </p>
      <h1
        className="am-h1 mb-8 max-w-full break-words font-sans font-extrabold tracking-tight text-white sm:max-w-[22ch]"
        style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.06 }}
      >
        Qualified workers,
        <br />
        delivered to your
        <br />
        Norwegian business.
      </h1>
      <p className="mb-10 max-w-[34rem] text-[17px] font-normal leading-[1.65] tracking-tight text-white/65">
        We source and screen pre-qualified EU/EEA workers for Norwegian businesses in construction, logistics, and industry.
        Employers remain responsible for compliance with applicable Norwegian labor law and collective agreements.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/request"
          className="btn-gold-premium relative inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl bg-gold px-8 py-3.5 text-[15px] font-semibold tracking-tight text-[#0D1B2A] hover:bg-gold-hover sm:w-auto"
        >
          Request candidates
        </Link>
        <Link
          href="/#how-it-works"
          className="inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl border border-[rgba(201,168,76,0.22)] px-8 py-3.5 text-[15px] font-medium tracking-tight text-white/90 transition-colors duration-300 hover:border-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.06)] sm:w-auto"
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
    <div className="min-h-screen bg-[#0D1B2A]">
      <RoleSelector />
      <section className="section-y flex items-center bg-[#0D1B2A]">
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

      <section className="section-y bg-[#0D1B2A]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl font-sans font-extrabold text-white">Who are you?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" className="text-center">
            <p className="mb-16 mt-5 max-w-lg mx-auto text-[17px] font-normal leading-relaxed tracking-tight text-white/60">
              Two simple paths. Choose yours.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
            <ScrollReveal variant="fadeUp">
              <article className="who-choice-card card-premium rounded-2xl border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.025)] p-10 md:p-12">
                <Building2 className="text-[#C9A84C]" size={28} strokeWidth={1.5} />
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-white md:text-2xl">I&apos;m an employer</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/58">Norwegian company looking for qualified workers</p>
                <ul className="mt-8 space-y-3">
                  {[
                    "Fast candidate delivery",
                    "Pre-screened candidate profiles",
                    "Legal and compliant staffing",
                    "Dedicated recruiter support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-white/88">
                      <Check size={17} className="shrink-0 text-[#C9A84C]" strokeWidth={2} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/for-employers"
                  className="btn-gold-premium relative mt-10 inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl bg-gold px-6 py-3 text-[15px] font-semibold tracking-tight text-[#0D1B2A] hover:bg-gold-hover sm:w-auto"
                >
                  Explore employer services →
                </Link>
              </article>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp">
              <article className="who-choice-card card-premium rounded-2xl border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.025)] p-10 md:p-12">
                <User className="text-[#C9A84C]" size={28} strokeWidth={1.5} />
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-white md:text-2xl">I&apos;m a candidate</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/58">Looking for legal work in Norway</p>
                <ul className="mt-8 space-y-3">
                  {[
                    "Legal employment contracts",
                    "Clear salary expectations",
                    "Support before and after arrival",
                    "Direct access to active jobs",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-white/88">
                      <Check size={17} className="shrink-0 text-[#C9A84C]" strokeWidth={2} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/for-candidates"
                  className="btn-micro mt-10 inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl border border-[rgba(201,168,76,0.22)] bg-transparent px-6 py-3 text-[15px] font-medium tracking-tight text-white/90 transition-colors duration-300 hover:border-[rgba(201,168,76,0.38)] hover:bg-[rgba(201,168,76,0.06)] sm:w-auto"
                >
                  Explore candidate path →
                </Link>
              </article>
            </ScrollReveal>
          </div>
          <ScrollReveal variant="fadeUp" className="mt-14 text-center">
            <button
              type="button"
              onClick={() => setComingSoonFeature("dsb-authorization-guide")}
              className="text-[13px] font-medium tracking-wide text-white/45 transition-colors hover:text-[#C9A84C]/90"
            >
              Electrician DSB authorization support — coming soon
            </button>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{howItWorksSlot}</ScrollReveal>

      <section className="section-y bg-[#0D1B2A]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl font-sans font-extrabold text-white">Industries we serve</h2>
          </ScrollReveal>
          <ScrollRevealGrid
            className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3 lg:gap-12"
            items={industries}
            itemKey={([, title]) => title}
            renderItem={([Icon, title, text]) => (
              <article className="industry-card card-premium group rounded-2xl border border-[rgba(201,168,76,0.1)] bg-[rgba(255,255,255,0.025)] p-8 transition-colors duration-300 hover:border-[rgba(201,168,76,0.22)]">
                <Icon className="shrink-0 text-[#C9A84C]" size={22} strokeWidth={1.5} />
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-white/58">{text}</p>
                <a
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-[#C9A84C]/85 underline-offset-4 transition-colors hover:text-[#C9A84C]"
                >
                  View roles
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </a>
              </article>
            )}
          />
        </div>
      </section>

      <section className="section-y bg-[#0D1B2A]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="mx-auto max-w-4xl rounded-2xl border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.025)] p-10 md:p-14 lg:p-16">
              <h2 className="am-h2 heading-premium-xl mb-8 font-extrabold tracking-tight text-white">
                Recruitment that works. For everyone.
              </h2>
              <p className="text-[17px] font-normal leading-[1.7] tracking-tight text-white/65">
                We have not invented anything new. But we organize the process as well as we can, so that candidates from
                different cultures, backgrounds and religions experience respect and clarity from the first contact. And so
                that Norwegian employers get workers who genuinely fit their environment.
              </p>
              <ul className="mt-10 space-y-5">
                {[
                  "Cultural and religious sensitivity throughout our screening process",
                  "Clear communication across languages and expectations",
                  "We do not promise perfection. We work continuously to improve our process and service.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 text-white">
                    <span className="mt-0.5 shrink-0 text-[#C9A84C]" aria-hidden>
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="h-5 w-5 md:h-5 md:w-5">
                        <path
                          d="M12 3l2.4 5.5L20 9.3l-4.3 3.7 1.3 5.5L12 15.9 6 18.5l1.3-5.5L3 9.3l5.6-.8L12 3z"
                          fill="currentColor"
                          opacity={0.9}
                        />
                      </svg>
                    </span>
                    <span className="text-[15px] leading-relaxed text-white/78">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {testimonialsSlot}

      <section className="section-y bg-[#0D1B2A]">
        <WeldingSpecialistsCard />
      </section>

      <section className="mesh-cta-wrap section-y bg-[#0D1B2A] text-center">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 heading-premium-xl mb-6 font-extrabold tracking-tight text-white">
              Ready to find your next workers?
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mb-10 max-w-xl text-[17px] font-normal leading-relaxed tracking-tight text-white/60">
              Contact us today. Our goal is to connect you with pre-qualified candidates within about two weeks.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium relative mx-auto inline-flex min-h-[54px] w-full max-w-md items-center justify-center rounded-xl bg-gold px-10 py-4 text-[16px] font-semibold tracking-tight text-[#0D1B2A] hover:bg-gold-hover sm:inline-block sm:w-auto sm:max-w-none"
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
