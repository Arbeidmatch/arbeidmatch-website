"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  IconBookUp,
  IconCheckCircle,
  IconDocCheck,
  IconHandshake,
  IconLayers,
  IconMapCoverage,
  IconMegaphone,
  IconMonitor,
  IconNetworkPeople,
  IconPeopleArrow,
  IconTrend,
  IconVenn,
} from "./RecruiterNetworkIcons";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;

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

function Reveal({
  children,
  className = "",
  delay = 0,
  y = 18,
  isMobile,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  isMobile: boolean;
}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px", amount: 0.12 });
  const d = isMobile ? delay * 0.5 : delay;
  const dur = isMobile ? 0.42 : 0.6;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: dur, delay: d, ease: HERO_EASE }}
    >
      {children}
    </motion.div>
  );
}

function IconReveal({
  children,
  className = "",
  isMobile,
}: {
  children: ReactNode;
  className?: string;
  isMobile: boolean;
}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  if (reduce) {
    return <div className={`rn-icon-wrap ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`rn-icon-wrap ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: isMobile ? 0.35 : 0.5, ease: HERO_EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function RecruiterNetworkClient() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobileWidth();
  const formRef = useRef<HTMLElement | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "0px 0px -10% 0px", amount: 0.2 });
  const reqRef = useRef<HTMLUListElement>(null);
  const reqInView = useInView(reqRef, { once: true, amount: 0.15 });

  const [submitting, setSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heroFade = (delaySec: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0 } as const,
          animate: { opacity: 1 } as const,
          transition: { duration: 0.75, delay: delaySec, ease: HERO_EASE },
        };

  const pathCards = [
    {
      icon: <IconMegaphone size={36} />,
      badge: "100K+ monthly reach",
      title: "The Influencer",
      headline: "You have the audience.",
      body: "If you run an active social media channel focused on jobs, migration, work abroad or careers, your audience is already looking for what we offer. Monetize your reach with real placements.",
      bullets: [
        "Social media channel with 100K+ monthly visitors",
        "Content focused on work, jobs or migration",
        "Professional English communication",
      ],
    },
    {
      icon: <IconNetworkPeople size={36} />,
      badge: "Experienced professional",
      title: "The Recruiter",
      headline: "You know the game.",
      body: "You have experience in recruitment, HR or staffing. You understand the process. Now build your own regional business under a strong brand with full infrastructure.",
      bullets: ["Background in recruitment or HR", "Network in your region", "ENK or AS (we help you set it up)"],
    },
    {
      icon: <IconBookUp size={36} />,
      badge: "Starting from zero",
      title: "The Learner",
      headline: "You want to learn.",
      body: "No experience? No problem. We train you from scratch. If you are motivated, speak English and want to build something real, we will teach you everything about recruitment, compliance and the Norwegian market.",
      bullets: ["Strong motivation and work ethic", "Professional English", "Willingness to learn and commit"],
    },
  ] as const;

  const whatYouGet = [
    {
      icon: <IconMapCoverage size={36} />,
      title: "Your Own Market",
      text: "Exclusive regional coverage. Clients in your region are yours. We route clients from other regions to you.",
    },
    {
      icon: <IconLayers size={36} />,
      title: "Full Infrastructure",
      text: "ArbeidMatch website, ATS and CRM, ready from day one. No setup costs. No technical headaches.",
    },
    {
      icon: <IconVenn size={36} />,
      title: "Shared Database",
      text: "Access our pool of pre-screened EU/EEA candidates and Norwegian employer clients from day one.",
    },
    {
      icon: <IconTrend size={36} />,
      title: "Commission Model",
      text: "Zero upfront investment. You earn on every placement. We help you set up your ENK or AS to invoice legally.",
    },
  ] as const;

  const steps = [
    {
      icon: <IconDocCheck size={28} />,
      title: "Apply",
      text: "Fill out the form. We review your profile, reach and motivation.",
    },
    {
      icon: <IconMonitor size={28} />,
      title: "Get onboarded",
      text: "We set up your account, train you on the platform and introduce you to our processes.",
    },
    {
      icon: <IconPeopleArrow size={28} />,
      title: "Start recruiting",
      text: "Use our full infrastructure to serve clients and source candidates in your region.",
    },
    {
      icon: <IconHandshake size={28} />,
      title: "Earn together",
      text: "Commission on every placement. Scale at your own pace. Grow with the network.",
    },
  ] as const;

  const requirements = [
    "Active presence: social media, community or professional network",
    "100K+ monthly reach (for influencer track) or relevant experience",
    "Professional English communication",
    "ENK or AS in your country: we help you set this up",
    "Exclusive focus on your designated region",
    "Genuine interest in building something long-term",
  ] as const;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const website = fd.get("website");
    if (typeof website === "string" && website.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: String(fd.get("full_name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        country: String(fd.get("country") || "").trim(),
        region: String(fd.get("region") || "").trim(),
        partner_type: String(fd.get("partner_type") || "").trim(),
        social_url: String(fd.get("social_url") || "").trim(),
        monthly_reach: String(fd.get("monthly_reach") || "").trim(),
        has_company: String(fd.get("has_company") || "").trim(),
        motivation: String(fd.get("motivation") || "").trim(),
        gdpr_consent: fd.get("gdpr_consent") === "on",
      };

      const res = await fetch("/api/recruiter-network/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setSuccessEmail(payload.email);
      e.currentTarget.reset();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const stagger = isMobile ? 0.04 : 0.08;
  const stepStagger = isMobile ? 0.05 : 0.1;
  const reqStagger = isMobile ? 0.03 : 0.06;

  return (
    <div className="bg-[#06090e] text-white">
      <section className="recruiter-network-hero min-h-[88vh] flex flex-col justify-center py-24 md:py-32">
        <div className="rn-hero-inner mx-auto w-full max-w-content px-4 md:px-6">
          {!reduce ? (
            <>
              <motion.p
                className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B8860B]"
                {...heroFade(0)}
              >
                RECRUITER NETWORK
              </motion.p>
              <h1
                className="mt-6 min-w-0 break-words font-sans font-extrabold tracking-[-0.04em] text-white"
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)", lineHeight: 1.02 }}
              >
                <motion.span className="block" {...heroFade(0.1)}>
                  Recruit.
                </motion.span>
                <motion.span className="block" {...heroFade(0.2)}>
                  Influence.
                </motion.span>
                <motion.span className="block" {...heroFade(0.3)}>
                  Earn.
                </motion.span>
              </h1>
              <motion.p
                className="mt-8 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl"
                {...heroFade(0.45)}
              >
                Join our network of independent recruiters across Europe. We give you the infrastructure, the brand and
                the training. You bring the drive.
              </motion.p>
              <motion.div className="mt-10 flex flex-wrap items-center gap-4" {...heroFade(0.6)}>
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="btn-gold-premium inline-block min-h-[48px] rounded-md bg-gold px-8 py-3.5 text-base font-semibold text-white hover:bg-gold-hover"
                >
                  Apply to Join →
                </button>
                <a
                  href="#three-paths"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-semibold text-[#B8860B] underline-offset-4 hover:text-gold-hover hover:underline"
                >
                  Learn more ↓
                </a>
              </motion.div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B8860B]">RECRUITER NETWORK</p>
              <h1
                className="mt-6 min-w-0 break-words font-sans font-extrabold tracking-[-0.04em] text-white"
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)", lineHeight: 1.02 }}
              >
                <span className="block">Recruit.</span>
                <span className="block">Influence.</span>
                <span className="block">Earn.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
                Join our network of independent recruiters across Europe. We give you the infrastructure, the brand and
                the training. You bring the drive.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="btn-gold-premium inline-block min-h-[48px] rounded-md bg-gold px-8 py-3.5 text-base font-semibold text-white hover:bg-gold-hover"
                >
                  Apply to Join →
                </button>
                <a
                  href="#three-paths"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-semibold text-[#B8860B] underline-offset-4 hover:underline"
                >
                  Learn more ↓
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      <section id="three-paths" className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              There is a place for you.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-white/60">We work with three types of partners.</p>
          </Reveal>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {pathCards.map((card, i) => (
              <Reveal key={card.title} isMobile={isMobile} delay={i * stagger} className="h-full">
                <article className="rn-card-net card-premium card-premium-gold flex h-full flex-col p-8">
                  <IconReveal isMobile={isMobile} className="mb-5">
                    {card.icon}
                  </IconReveal>
                  <span className="mb-4 inline-flex w-fit rounded-full border border-[#B8860B]/50 bg-[#B8860B]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
                    {card.badge}
                  </span>
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-[#B8860B]">{card.headline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{card.body}</p>
                  <ul className="mt-5 space-y-2 text-sm text-white/80">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8860B]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {whatYouGet.map((item, i) => (
              <Reveal key={item.title} isMobile={isMobile} delay={i * stagger} className="h-full">
                <article className="rn-card-net card-premium card-premium-gold flex h-full flex-col p-8">
                  <IconReveal isMobile={isMobile} className="mb-5">
                    {item.icon}
                  </IconReveal>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              How it works.
            </h2>
          </Reveal>

          <div ref={stepsRef} className="relative mx-auto mt-16 max-w-3xl">
            <div className="pointer-events-none absolute bottom-8 left-[18px] top-8 w-[2px] overflow-hidden rounded-full bg-white/10 md:left-5" aria-hidden>
              <motion.div
                className="w-full rounded-full bg-[#B8860B]"
                initial={{ height: 0 }}
                animate={stepsInView ? { height: "100%" } : {}}
                transition={{ duration: isMobile ? 0.85 : 1.2, ease: HERO_EASE }}
              />
            </div>

            <ol className="relative space-y-12 pl-12 md:pl-14">
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  className="relative"
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * stepStagger, duration: isMobile ? 0.42 : 0.55, ease: HERO_EASE }}
                >
                  <div className="absolute left-0 top-0 flex h-10 w-10 -translate-x-[11px] items-center justify-center md:-translate-x-[10px]">
                    <motion.span
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#B8860B] bg-[#0a0c14] text-sm font-extrabold text-[#B8860B] shadow-[0_0_16px_rgba(184,134,11,0.35)]"
                      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                      animate={stepsInView ? { scale: 1, opacity: 1 } : {}}
                      transition={{
                        delay: i * stepStagger + 0.05,
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                      }}
                    >
                      {i + 1}
                    </motion.span>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <IconReveal isMobile={isMobile} className="shrink-0 pt-1">
                      {step.icon}
                    </IconReveal>
                    <div>
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">{step.text}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              Who we are looking for.
            </h2>
          </Reveal>
          <ul ref={reqRef} className="mx-auto mt-12 max-w-2xl space-y-4">
            {requirements.map((line, i) => (
              <motion.li
                key={line}
                className="flex gap-3 text-sm leading-relaxed text-white/80 md:text-base"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={reqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * reqStagger, duration: isMobile ? 0.35 : 0.5, ease: HERO_EASE }}
              >
                <span
                  className={`rn-check-draw mt-0.5 shrink-0 ${reqInView ? "is-done" : ""}`}
                  style={{ transitionDelay: `${i * (isMobile ? 40 : 60)}ms` }}
                  aria-hidden
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="overflow-visible">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="#B8860B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {line}
              </motion.li>
            ))}
          </ul>
          <Reveal isMobile={isMobile} delay={0.25} className="mx-auto mt-10 max-w-2xl">
            <p className="text-center text-sm leading-relaxed text-white/50">
              We accept partners from all EU/EEA countries. Regional exclusivity is granted per area, not per country. No
              experience? Apply anyway: we evaluate motivation.
            </p>
          </Reveal>
        </div>
      </section>

      <section ref={formRef} id="apply" className="border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              Ready to build with us?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-white/60">
              Tell us about yourself. We respond within 48 hours.
            </p>
          </Reveal>

          <Reveal isMobile={isMobile} delay={0.08} className="mx-auto mt-12 max-w-xl">
            {successEmail ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: HERO_EASE }}
                className="rn-card-net p-10 text-center"
              >
                <div className="mx-auto mb-5 flex justify-center">
                  <motion.div
                    initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.08 }}
                  >
                    <IconCheckCircle />
                  </motion.div>
                </div>
                <p className="text-lg font-semibold text-white">Thank you! Your application is under review.</p>
                <p className="mt-3 text-sm leading-relaxed text-white/65">
                  We will contact you at <span className="text-[#B8860B]">{successEmail}</span> within 48 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="rn-card-net space-y-5 p-8 md:p-10">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Full name *
                  </label>
                  <input name="full_name" required className="rn-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Email address *
                  </label>
                  <input name="email" type="email" required className="rn-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Country *
                  </label>
                  <input name="country" required className="rn-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Region / City you want to cover *
                  </label>
                  <input name="region" required className="rn-input w-full px-4 py-3 text-sm" />
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                    Which path fits you best? *
                  </legend>
                  <div className="space-y-2 text-sm text-white/85">
                    {[
                      ["influencer", "The Influencer"],
                      ["recruiter", "The Recruiter"],
                      ["learner", "The Learner"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2">
                        <input type="radio" name="partner_type" value={value} required className="accent-[#B8860B]" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Social media or professional profile link *
                  </label>
                  <input name="social_url" type="url" required placeholder="https://" className="rn-input w-full px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Monthly reach / visitors *
                  </label>
                  <input
                    name="monthly_reach"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 150,000"
                    className="rn-input w-full px-4 py-3 text-sm"
                  />
                </div>

                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                    Do you have ENK or AS? *
                  </legend>
                  <div className="space-y-2 text-sm text-white/85">
                    {[
                      ["yes", "Yes"],
                      ["want_setup", "No but I want to set one up"],
                      ["not_yet", "Not yet"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2">
                        <input type="radio" name="has_company" value={value} required className="accent-[#B8860B]" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
                    Tell us why you want to join
                  </label>
                  <textarea
                    name="motivation"
                    maxLength={500}
                    rows={4}
                    placeholder="What drives you? What is your market? What makes you the right partner?"
                    className="rn-input w-full resize-y px-4 py-3 text-sm"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-white/80">
                  <input name="gdpr_consent" type="checkbox" required className="mt-1 accent-[#B8860B]" />
                  <span>
                    I agree that ArbeidMatch Norge AS may store and process my information to evaluate my partnership
                    application. *
                  </span>
                </label>

                {error ? <p className="text-sm text-red-300">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold-premium w-full min-h-[48px] rounded-md bg-gold py-3.5 text-base font-semibold text-white hover:bg-gold-hover disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Submit Application →"}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
