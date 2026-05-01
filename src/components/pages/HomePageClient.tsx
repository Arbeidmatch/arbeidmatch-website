"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import { trackEvent } from "@/lib/analytics";
import { writeHomeUserType } from "@/lib/homeUserType";
import {
  BadgeCheck,
  Building2,
  MessageSquare,
  Search,
  Users,
  Zap,
  User,
} from "lucide-react";

import BemanningCard from "@/components/home/BemanningCard";
import HomeIndustriesSection from "@/components/home/HomeIndustriesSection";
import HomeWhyArbeidMatchSection from "@/components/home/HomeWhyArbeidMatchSection";
import HomeWelcomeUserTypeSlideup from "@/components/home/HomeWelcomeUserTypeSlideup";
import WeldingSpecialistsCard from "@/components/welding/WeldingSpecialistsCard";
import ScrollReveal from "@/components/ScrollReveal";
const HERO_DURATION = 0.72;

const HERO_H1_TEXT = `Qualified workers,
delivered to your
Norwegian business.`;

const homeCtaPrimaryLg =
  "btn-gold-premium relative mx-auto inline-flex min-h-[54px] w-full max-w-md items-center justify-center rounded-xl bg-gold px-10 py-4 text-[16px] font-semibold tracking-tight text-[#0D1B2A] transition-colors hover:bg-gold-hover sm:inline-block sm:w-auto sm:max-w-none";

type Props = {
  testimonialsSlot: ReactNode;
};

const HOW_IT_WORKS_STEPS: { title: string; text: string; Icon: typeof MessageSquare }[] = [
  {
    title: "Tell us what you need",
    text: "Share your role, headcount and timeline so we can align on expectations.",
    Icon: MessageSquare,
  },
  {
    title: "We source and screen",
    text: "We search our network and verify skills, experience and availability.",
    Icon: Search,
  },
  {
    title: "Review candidates",
    text: "You receive short profiles that match your requirements before interviews.",
    Icon: Users,
  },
  {
    title: "Make the hire",
    text: "Move forward with contracts and onboarding with our support where needed.",
    Icon: BadgeCheck,
  },
];

export default function HomePageClient({ testimonialsSlot }: Props) {
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

  const heroPrimaryCtaClass =
    "inline-flex min-h-[48px] min-w-[44px] flex-1 items-center justify-center rounded-md bg-[#C9A84C] px-[28px] py-[14px] text-center text-[15px] font-bold tracking-tight text-[#0D1B2A] transition-colors duration-300 hover:bg-[#b8953f] sm:flex-none";

  const heroSecondaryCtaClass =
    "inline-flex min-h-[48px] min-w-[44px] flex-1 items-center justify-center rounded-md border border-solid border-[rgba(255,255,255,0.2)] px-[28px] py-[14px] text-center text-[15px] font-medium tracking-tight text-white transition-colors duration-300 hover:border-[#C9A84C] sm:flex-none";

  const hero = !reduce ? (
    <div className="min-w-0 max-w-full lg:max-w-none">
      <motion.span
        className="inline-block rounded-[20px] border border-solid border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)] px-3 py-1 text-[12px] font-medium leading-tight text-[#C9A84C]"
        {...fade(0)}
      >
        EU/EEA Recruitment for Norway
      </motion.span>
      <motion.h1
        className="mt-5 min-w-0 max-w-full whitespace-pre-line break-words font-sans font-extrabold tracking-[-0.03em] text-white"
        style={{ fontSize: "clamp(40px,5vw,72px)", fontWeight: 800, lineHeight: 1.1 }}
        {...fade(0.08)}
      >
        {HERO_H1_TEXT}
      </motion.h1>
      <motion.p
        className="mt-5 max-w-[480px] text-[18px] leading-snug text-[rgba(255,255,255,0.65)]"
        {...fade(0.22)}
      >
        We source and screen pre-qualified EU/EEA workers for Norwegian businesses in construction, logistics, and industry.
      </motion.p>
      <motion.div
        className="mt-8 flex min-w-0 flex-col flex-wrap gap-3 sm:mt-8 sm:flex-row sm:items-stretch sm:gap-4"
        {...fade(0.36)}
      >
        <Link href="/request" className={heroPrimaryCtaClass}>
          Request candidates →
        </Link>
        <Link href="/#how-it-works" className={heroSecondaryCtaClass}>
          Learn how it works
        </Link>
      </motion.div>
    </div>
  ) : (
    <div className="min-w-0 max-w-full lg:max-w-none">
      <span className="inline-block rounded-[20px] border border-solid border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)] px-3 py-1 text-[12px] font-medium leading-tight text-[#C9A84C]">
        EU/EEA Recruitment for Norway
      </span>
      <h1
        className="mt-5 min-w-0 max-w-full whitespace-pre-line break-words font-sans font-extrabold tracking-[-0.03em] text-white"
        style={{ fontSize: "clamp(40px,5vw,72px)", fontWeight: 800, lineHeight: 1.1 }}
      >
        {HERO_H1_TEXT}
      </h1>
      <p className="mt-5 max-w-[480px] text-[18px] leading-snug text-[rgba(255,255,255,0.65)]">
        We source and screen pre-qualified EU/EEA workers for Norwegian businesses in construction, logistics, and industry.
      </p>
      <div className="mt-8 flex min-w-0 flex-col flex-wrap gap-3 sm:flex-row sm:items-stretch sm:gap-4">
        <Link href="/request" className={heroPrimaryCtaClass}>
          Request candidates →
        </Link>
        <Link href="/#how-it-works" className={heroSecondaryCtaClass}>
          Learn how it works
        </Link>
      </div>
    </div>
  );

  const hireWorkCardClass =
    "group flex min-h-[220px] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 text-left shadow-none backdrop-blur-md transition duration-300 hover:border-[#C9A84C]/25 hover:bg-white/[0.06] md:min-h-[260px] md:p-10 md:hover:-translate-y-0.5";

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
      <section className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-[#0D1B2A] py-16 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div className="absolute inset-0 bg-[#0D1B2A]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_42%,rgba(201,168,76,0.06),transparent_55%)]" />
        </div>
        <div className="relative z-10 mx-auto grid w-full max-w-content grid-cols-1 items-center gap-10 px-4 md:px-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12 lg:px-20">
          <div className="min-w-0">{hero}</div>
          <div className="relative w-full max-lg:mx-auto max-lg:max-w-xl lg:max-w-none lg:justify-self-end">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-solid border-[rgba(201,168,76,0.15)] lg:rounded-xl">
              <Image
                src="/images/ai/am-ai-hero-home.webp"
                alt="Diverse blue-collar workers in high-visibility vests and hard hats during a safety briefing at a Norwegian industrial workplace."
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                quality={85}
                decoding="async"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(13,27,42,0)] to-[rgba(13,27,42,0.3)]"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-[100px] border-b border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(13,27,42,0.96)_45%,#0D1B2A_100%)] py-16 md:py-20 lg:py-24"
      >
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 font-display font-extrabold tracking-[-0.03em] text-white">How it works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-white/60 md:text-lg">
              From request to placement in days, not months.
            </p>
          </ScrollReveal>

          <div className="mt-12 lg:mt-16">
            <div className="flex flex-col gap-10 lg:grid lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[rgba(201,168,76,0.22)]">
              {HOW_IT_WORKS_STEPS.map(({ title, text, Icon }, index) => (
                <ScrollReveal key={title} variant="fadeUp">
                  <div
                    className={`relative flex flex-col items-center px-0 text-center lg:px-6 ${
                      index > 0 ? "border-t border-[rgba(201,168,76,0.15)] pt-10 lg:border-t-0 lg:pt-0" : ""
                    }`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)] text-[#C9A84C]">
                      <Icon size={24} strokeWidth={1.65} aria-hidden />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-white/55 lg:max-w-none">{text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          <ScrollReveal variant="fadeUp" className="mt-12 flex justify-center lg:mt-14">
            <Link
              href="/request"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#C9A84C] px-8 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Start your request →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <HomeIndustriesSection />

      <HomeWhyArbeidMatchSection />

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
