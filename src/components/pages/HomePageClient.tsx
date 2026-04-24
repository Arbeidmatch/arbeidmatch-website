"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import { trackEvent } from "@/lib/analytics";
import { writeHomeUserType } from "@/lib/homeUserType";
import {
  Building2,
  Factory,
  Forklift,
  HardHat,
  HeartPulse,
  Hotel,
  Sparkles,
  Zap,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import BemanningCard from "@/components/home/BemanningCard";
import HomeWelcomeUserTypeSlideup from "@/components/home/HomeWelcomeUserTypeSlideup";
import WeldingSpecialistsCard from "@/components/welding/WeldingSpecialistsCard";
import ScrollReveal, { ScrollRevealGrid } from "@/components/ScrollReveal";

const HERO_DURATION = 0.72;
const HERO_TITLE_LINES = [
  "Qualified workers,",
  "delivered to your",
  "Norwegian business.",
] as const;

const homeCtaPrimary =
  "btn-gold-premium relative inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl bg-gold px-8 py-3.5 text-[15px] font-semibold tracking-tight text-[#0D1B2A] transition-colors hover:bg-gold-hover sm:w-auto";

const homeCtaSecondary =
  "inline-flex min-h-[52px] w-full min-w-[44px] items-center justify-center rounded-xl border border-[rgba(201,168,76,0.35)] bg-transparent px-8 py-3.5 text-[15px] font-medium tracking-tight text-white/90 transition-colors duration-300 hover:border-[#C9A84C]/55 hover:bg-[rgba(201,168,76,0.08)] sm:w-auto";

const homeCtaPrimaryLg =
  "btn-gold-premium relative mx-auto inline-flex min-h-[54px] w-full max-w-md items-center justify-center rounded-xl bg-gold px-10 py-4 text-[16px] font-semibold tracking-tight text-[#0D1B2A] transition-colors hover:bg-gold-hover sm:inline-block sm:w-auto sm:max-w-none";

type Props = {
  howItWorksSlot: ReactNode;
  testimonialsSlot: ReactNode;
};

export default function HomePageClient({ howItWorksSlot, testimonialsSlot }: Props) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [sessionRoleBanner, setSessionRoleBanner] = useState<null | "employer" | "candidate">(null);

  useEffect(() => {
    try {
      const role = window.sessionStorage.getItem("roleSelected");
      if (role === "employer") startTransition(() => setSessionRoleBanner("employer"));
      else if (role === "candidate") startTransition(() => setSessionRoleBanner("candidate"));
    } catch {
      /* ignore */
    }
  }, []);

  const goHire = useCallback(() => {
    trackEvent("home_user_type", { userType: "employer", source: "hero_cards" });
    writeHomeUserType("employer");
    router.push("/for-employers");
  }, [router]);

  const goWork = useCallback(() => {
    trackEvent("home_user_type", { userType: "candidate", source: "hero_cards" });
    writeHomeUserType("candidate");
    router.push("/for-candidates");
  }, [router]);

  const fade = (delaySec: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: HERO_DURATION, delay: delaySec, ease: EASE_PREMIUM },
        };

  const heroTitleClass =
    "mb-10 min-w-0 max-w-full text-balance break-words font-sans font-extrabold tracking-[-0.04em] text-white sm:max-w-[22ch]";

  const hero = !reduce ? (
    <div className="min-w-0">
      <motion.p
        className="am-eyebrow mb-8 font-semibold uppercase tracking-[0.14em] text-[#C9A84C]"
        {...fade(0)}
      >
        EU/EEA Workforce Solutions · Norway
      </motion.p>
      <h1 className={heroTitleClass} style={{ fontSize: "clamp(2.2rem, 6.2vw, 5.35rem)", lineHeight: 1.04 }}>
        {HERO_TITLE_LINES.map((line, i) => (
          <motion.span key={line} className="block" {...fade(0.08 + i * 0.1)}>
            {line}
          </motion.span>
        ))}
      </h1>
      <motion.p className="text-home-lead mb-14 max-w-[40rem]" {...fade(0.42)}>
        We source and screen pre-qualified EU/EEA workers for Norwegian businesses in construction, logistics, and industry.
        Employers remain responsible for compliance with applicable Norwegian labor law and collective agreements.
      </motion.p>
      <motion.div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5" {...fade(0.58)}>
        <Link href="/request" className={homeCtaPrimary}>
          Request candidates
        </Link>
        <Link href="/#how-it-works" className={homeCtaSecondary}>
          How it works
        </Link>
      </motion.div>
    </div>
  ) : (
    <div className="min-w-0">
      <p className="am-eyebrow mb-8 font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
        EU/EEA Workforce Solutions · Norway
      </p>
      <h1 className={heroTitleClass} style={{ fontSize: "clamp(2.2rem, 6.2vw, 5.35rem)", lineHeight: 1.04 }}>
        {HERO_TITLE_LINES.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>
      <p className="text-home-lead mb-14 max-w-[40rem]">
        We source and screen pre-qualified EU/EEA workers for Norwegian businesses in construction, logistics, and industry.
        Employers remain responsible for compliance with applicable Norwegian labor law and collective agreements.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <Link href="/request" className={homeCtaPrimary}>
          Request candidates
        </Link>
        <Link href="/#how-it-works" className={homeCtaSecondary}>
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

  const hireWorkCardClass =
    "group flex min-h-[220px] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-left shadow-none backdrop-blur-md transition duration-300 hover:border-[#C9A84C]/25 hover:bg-white/[0.06] md:min-h-[260px] md:p-10 md:hover:-translate-y-0.5 md:hover:shadow-[0_24px_56px_rgba(0,0,0,0.22)]";

  const hireWorkGridVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.14, delayChildren: 0.06 },
    },
  } as const;

  const hireWorkItemVariants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.58, ease: EASE_PREMIUM },
    },
  } as const;

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      <HomeWelcomeUserTypeSlideup />
      <section className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-[#0D1B2A] py-20 md:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-[#0D1B2A]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_72%_58%_at_50%_42%,rgba(201,168,76,0.11),transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_65%_at_50%_115%,rgba(13,27,42,0.92),transparent_52%)]" />
          <div className="absolute inset-0 opacity-[0.035] [background-image:repeating-linear-gradient(-12deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_3px)]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">{hero}</div>
      </section>
      <section className="border-b border-white/[0.06] bg-[#0D1B2A] px-4 py-16 md:px-12 md:py-24 lg:px-20 lg:py-28">
        {!reduce ? (
          <motion.div
            className="mx-auto grid max-w-content grid-cols-1 gap-8 md:grid-cols-2 md:gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.22 }}
            variants={hireWorkGridVariants}
          >
            <motion.button type="button" onClick={goHire} className={hireWorkCardClass} variants={hireWorkItemVariants}>
              <Building2 className="text-[#C9A84C]" size={32} strokeWidth={1.5} aria-hidden />
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">I&apos;m looking to hire</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                Find qualified EU/EEA candidates for your Norwegian business
              </p>
              <span className="mt-auto pt-8 text-sm font-semibold text-[#C9A84C] transition group-hover:translate-x-0.5">
                Continue as employer →
              </span>
            </motion.button>
            <motion.button type="button" onClick={goWork} className={hireWorkCardClass} variants={hireWorkItemVariants}>
              <User className="text-[#C9A84C]" size={32} strokeWidth={1.5} aria-hidden />
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">I&apos;m looking for work</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                Discover job opportunities in Norway matched to your skills
              </p>
              <span className="mt-auto pt-8 text-sm font-semibold text-[#C9A84C] transition group-hover:translate-x-0.5">
                Continue as candidate →
              </span>
            </motion.button>
          </motion.div>
        ) : (
          <div className="mx-auto grid max-w-content grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            <button type="button" onClick={goHire} className={hireWorkCardClass}>
              <Building2 className="text-[#C9A84C]" size={32} strokeWidth={1.5} aria-hidden />
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">I&apos;m looking to hire</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                Find qualified EU/EEA candidates for your Norwegian business
              </p>
              <span className="mt-auto pt-8 text-sm font-semibold text-[#C9A84C] transition group-hover:translate-x-0.5">
                Continue as employer →
              </span>
            </button>
            <button type="button" onClick={goWork} className={hireWorkCardClass}>
              <User className="text-[#C9A84C]" size={32} strokeWidth={1.5} aria-hidden />
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">I&apos;m looking for work</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
                Discover job opportunities in Norway matched to your skills
              </p>
              <span className="mt-auto pt-8 text-sm font-semibold text-[#C9A84C] transition group-hover:translate-x-0.5">
                Continue as candidate →
              </span>
            </button>
          </div>
        )}
      </section>

      <BemanningCard />

      {sessionRoleBanner === "employer" ? (
        <motion.div
          className="border-b border-white/[0.06] bg-white/[0.04] px-4 py-3 backdrop-blur-sm md:px-12 lg:px-20"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
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
          className="border-b border-white/[0.06] bg-white/[0.04] px-4 py-3 backdrop-blur-sm md:px-12 lg:px-20"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
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

      <section className="bg-[#0D1B2A] py-10 md:py-12">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="mx-auto flex w-[90%] max-w-2xl items-center justify-between gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-none backdrop-blur-md md:gap-8 md:p-8">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 shrink-0 text-[#C9A84C]" aria-hidden>
                  <Zap size={20} strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight text-white">Electricians in Norway</p>
                  <p className="mt-1 text-sm text-white/60">
                    Authorization guide, DSB requirements and official resources.
                  </p>
                </div>
              </div>
              <Link
                href="/electricians-norway"
                className="shrink-0 rounded-xl border border-[rgba(201,168,76,0.35)] px-5 py-2.5 text-sm font-medium tracking-tight text-white/90 transition-colors duration-300 hover:border-[#C9A84C]/55 hover:bg-[rgba(201,168,76,0.08)]"
              >
                Learn More
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal variant="fadeIn">{howItWorksSlot}</ScrollReveal>

      <section className="bg-[#0D1B2A] py-20 md:py-28 lg:py-36">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 heading-premium-xl text-balance break-words font-sans font-extrabold tracking-[-0.03em] text-white">
              Industries we serve
            </h2>
          </ScrollReveal>
          <ScrollRevealGrid
            className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-14 lg:grid-cols-3 lg:gap-16"
            items={industries}
            itemKey={([, title]) => title}
            renderItem={([Icon, title, text]) => (
              <article className="industry-card card-premium group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-9 shadow-none backdrop-blur-md transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#C9A84C]/22 md:hover:-translate-y-0.5 md:hover:shadow-[0_24px_52px_rgba(0,0,0,0.22)]">
                <Icon className="shrink-0 text-[#C9A84C]" size={22} strokeWidth={1.5} />
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">{title}</h3>
                <p className="text-home-subtle mt-3 text-[14px] md:text-[15px]">{text}</p>
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

      <section className="bg-[#0D1B2A] py-20 md:py-28 lg:py-36">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/[0.08] bg-white/[0.04] p-10 shadow-none backdrop-blur-md md:p-14 lg:p-[4.5rem]">
              <h2 className="am-h2 heading-premium-xl mb-10 text-balance break-words font-extrabold tracking-[-0.03em] text-white">
                Recruitment that works. For everyone.
              </h2>
              <p className="text-home-lead max-w-none">
                We have not invented anything new. But we organize the process as well as we can, so that candidates from
                different cultures, backgrounds and religions experience respect and clarity from the first contact. And so
                that Norwegian employers get workers who genuinely fit their environment.
              </p>
              <p className="text-home-lead mt-6 max-w-none">
                And we believe that good work, done with dignity and mutual respect, is something everyone deserves access
                to.
              </p>
              <ul className="mt-14 space-y-8">
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
                    <span className="text-[15px] leading-[1.72] tracking-[-0.01em] text-white/[0.78]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {testimonialsSlot}

      <section className="bg-[#0D1B2A] py-20 md:py-28 lg:py-36">
        <WeldingSpecialistsCard />
      </section>

      <section className="mesh-cta-wrap bg-[#0D1B2A] py-20 text-center md:py-28 lg:py-36">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 heading-premium-xl mb-8 text-balance break-words font-extrabold tracking-[-0.03em] text-white">
              Ready to find your next workers?
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="text-home-lead mx-auto mb-14 max-w-xl">
              Contact us today. Our goal is to connect you with pre-qualified candidates within about two weeks.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link href="/request" className={homeCtaPrimaryLg}>
              Request candidates now
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
