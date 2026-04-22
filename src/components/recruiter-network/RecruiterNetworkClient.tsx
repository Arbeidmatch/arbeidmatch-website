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
import {
  RECRUITER_EEA_COUNTRIES,
  filterCountriesByPrefix,
  filterRegionsByPrefix,
  regionsForCountry,
} from "@/lib/recruiterNetworkGeo";
import RecruiterNetworkPremiumApplyModal from "@/components/recruiter-network/RecruiterNetworkPremiumApplyModal";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;

const RN_LABEL = "mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55";
const RN_INPUT =
  "rn-recruiter-field w-full rounded-[12px] border border-[rgba(201,168,76,0.22)] bg-[#0D1B2A] px-[18px] py-[14px] text-[15px] text-white placeholder:text-white/40 shadow-none transition-[border-color,box-shadow] duration-200 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/35";
const RN_LIST =
  "absolute z-[80] mt-1.5 max-h-[min(280px,50vh)] w-full overflow-y-auto overscroll-contain rounded-[12px] border border-[rgba(201,168,76,0.35)] bg-[#0D1B2A] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.55)]";
const RN_LIST_ITEM =
  "w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white/90 transition-colors hover:bg-[rgba(201,168,76,0.14)] focus:bg-[rgba(201,168,76,0.14)] focus:outline-none";

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

const ICON_SPRING_EASE = [0.34, 1.56, 0.64, 1] as const;

function IconReveal({
  children,
  className = "",
  isMobile,
  staggerIndex = 0,
}: {
  children: ReactNode;
  className?: string;
  isMobile: boolean;
  staggerIndex?: number;
}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  if (reduce) {
    return (
      <div className={`rn-icon-wrap rn-icon-wrap--static ${className}`}>
        <span className="rn-icon-inner">{children}</span>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`rn-icon-wrap ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={isInView ? { opacity: [0, 1, 1], scale: [0, 1.1, 1] } : {}}
      transition={{
        delay: staggerIndex * 0.1,
        duration: isMobile ? 0.55 : 0.6,
        times: [0, 0.52, 1],
        ease: ICON_SPRING_EASE,
      }}
    >
      <span className="rn-icon-inner">{children}</span>
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
  const [motivation, setMotivation] = useState("");
  const [form, setForm] = useState({
    country: "",
    region: "",
    city: "",
    businessType: "",
  });
  const [countryTypeahead, setCountryTypeahead] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [regionTypeahead, setRegionTypeahead] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [premiumApplyOpen, setPremiumApplyOpen] = useState(false);
  const countryComboRef = useRef<HTMLDivElement | null>(null);
  const regionComboRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocMouseDown = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (countryComboRef.current && !countryComboRef.current.contains(t)) setCountryOpen(false);
      if (regionComboRef.current && !regionComboRef.current.contains(t)) setRegionOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

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
      icon: <IconMegaphone size={48} />,
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
      icon: <IconNetworkPeople size={48} />,
      badge: "Experienced professional",
      title: "The Recruiter",
      headline: "You know the game.",
      body: "You have experience in recruitment, HR or staffing. You understand the process. Now build your own regional business under a strong brand with full infrastructure.",
      bullets: [
        "Background in recruitment or HR",
        "Network in your region",
        "If you plan to operate in Norway, we can help you set up an ENK or AS. Outside Norway, business structures differ, and we'll do our best to guide you.",
      ],
    },
    {
      icon: <IconBookUp size={48} />,
      badge: "Starting from zero",
      title: "The Learner",
      headline: "You want to learn.",
      body: "No experience? No problem. We train you from scratch. If you are motivated, speak English and want to build something real, we will teach you everything about recruitment, compliance and the Norwegian market.",
      bullets: ["Strong motivation and work ethic", "Professional English", "Willingness to learn and commit"],
    },
  ] as const;

  const whatYouGet = [
    {
      icon: <IconMapCoverage size={48} />,
      title: "Your Own Market",
      text: "Exclusive regional coverage. Clients in your region are yours. We route clients from other regions to you.",
    },
    {
      icon: <IconLayers size={48} />,
      title: "Full Infrastructure",
      text: "ArbeidMatch website, ATS and CRM, ready from day one. No setup costs. No technical headaches.",
    },
    {
      icon: <IconVenn size={48} />,
      title: "Shared Database",
      text: "Access our pool of pre-screened EU/EEA candidates and Norwegian employer clients from day one.",
    },
    {
      icon: <IconTrend size={48} />,
      title: "Commission Model",
      text: "You earn on every placement. If you plan to operate in Norway, we can help you set up an ENK or AS to invoice legally. Outside Norway, business structures differ, and we'll do our best to guide you.",
    },
  ] as const;

  const steps = [
    {
      icon: <IconDocCheck size={36} />,
      title: "Apply",
      text: "Fill out the form. We review your profile, reach and motivation.",
    },
    {
      icon: <IconMonitor size={36} />,
      title: "Get onboarded",
      text: "We set up your account, train you on the platform and introduce you to our processes.",
    },
    {
      icon: <IconPeopleArrow size={36} />,
      title: "Start recruiting",
      text: "Use our full infrastructure to serve clients and source candidates in your region.",
    },
    {
      icon: <IconHandshake size={36} />,
      title: "Earn together",
      text: "Commission on every placement. Scale at your own pace. Grow with the network.",
    },
  ] as const;

  const requirements = [
    "Active presence: social media, community or professional network",
    "100K+ monthly reach (for influencer track) or relevant experience",
    "Professional English communication",
    "If you plan to operate in Norway, we can help you set up an ENK or AS. Outside Norway, business structures differ, and we'll do our best to guide you.",
    "Exclusive focus on your designated region",
    "Genuine interest in building something long-term",
  ] as const;

  const mapBusinessTypeToHasCompany = (value: string) => {
    if (!value) return "";
    if (value === "no_business") return "not_yet";
    if (value === "freelancer_platform") return "want_setup";
    return "yes";
  };

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
      let resolvedCountry = form.country.trim();
      if (!resolvedCountry && countryTypeahead.trim()) {
        const guess = RECRUITER_EEA_COUNTRIES.find((c) => c.toLowerCase() === countryTypeahead.trim().toLowerCase());
        if (guess) resolvedCountry = guess;
      }
      if (!resolvedCountry) {
        setError("Please select your country from the list.");
        return;
      }
      if (!form.region.trim()) {
        setError("Please enter or select your region.");
        return;
      }
      if (!form.city.trim()) {
        setError("Please enter your city.");
        return;
      }

      const payload = {
        full_name: String(fd.get("full_name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        country: resolvedCountry,
        region: form.region.trim(),
        city: form.city.trim(),
        partner_type: String(fd.get("partner_type") || "").trim(),
        social_url: String(fd.get("social_url") || "").trim(),
        monthly_reach: String(fd.get("monthly_reach") || "").trim(),
        has_company: mapBusinessTypeToHasCompany(form.businessType),
        business_type: form.businessType,
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
      setForm({ country: "", region: "", city: "", businessType: "" });
      setCountryTypeahead("");
      setRegionTypeahead("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const stagger = isMobile ? 0.04 : 0.08;
  const stepStagger = isMobile ? 0.05 : 0.1;
  const reqStagger = isMobile ? 0.03 : 0.06;

  const regionChoicesList = regionsForCountry(form.country);
  const countryFiltered = filterCountriesByPrefix(countryTypeahead);
  const regionFiltered =
    regionChoicesList && regionChoicesList.length > 0
      ? filterRegionsByPrefix(regionChoicesList, regionTypeahead)
      : [];
  const hasCommittedCountry = Boolean(form.country.trim());
  const hasRegion = Boolean(form.region.trim());

  return (
    <>
    <div className="bg-[#06090e] text-white">
      <section className="recruiter-network-hero flex min-h-[88vh] flex-col justify-center py-12 md:py-20">
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
                  onClick={() => setPremiumApplyOpen(true)}
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
                  onClick={() => setPremiumApplyOpen(true)}
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

      <section id="three-paths" className="border-t border-white/5 py-12 md:py-20">
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
                <article className="rn-card-net flex h-full flex-col p-8">
                  <IconReveal isMobile={isMobile} className="mb-5" staggerIndex={i}>
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

      <section className="border-t border-white/5 py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {whatYouGet.map((item, i) => (
              <Reveal key={item.title} isMobile={isMobile} delay={i * stagger} className="h-full">
                <article className="rn-card-net flex h-full flex-col p-8">
                  <IconReveal isMobile={isMobile} className="mb-5" staggerIndex={i}>
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

      <section className="border-t border-white/5 py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              How it works.
            </h2>
          </Reveal>

          <div ref={stepsRef} className="relative mx-auto mt-16 max-w-[600px] px-4">
            <div className="relative">
              {/* pl-12 (48px) + half of 40px dot = 68px - line through dot centers */}
              <div
                className="pointer-events-none absolute bottom-6 left-[68px] top-6 z-0 w-[2px] -translate-x-1/2 rounded-full bg-[#C9A84C]/30"
                aria-hidden
              />

              <ol className="relative z-[1] flex flex-col gap-8 pl-12">
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  className="group relative flex items-start gap-4"
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * stepStagger, duration: isMobile ? 0.42 : 0.55, ease: HERO_EASE }}
                >
                  <div
                    className="relative z-[2] flex h-10 min-h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A84C] bg-[rgba(201,168,76,0.15)] transition-[border-color,background-color] duration-200 ease-out group-hover:border-[#C9A84C] group-hover:bg-[rgba(201,168,76,0.25)]"
                    aria-hidden
                  >
                    <span className="inline-flex origin-center transition-transform duration-[180ms] ease-out group-hover:scale-110">
                      {step.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-2">
                    <h3 className="mb-1 text-base font-semibold text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-white/60">{step.text}</p>
                  </div>
                </motion.li>
              ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-12 md:py-20">
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

      <section ref={formRef} id="apply" className="border-t border-white/5 py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <Reveal isMobile={isMobile}>
            <h2 className="text-center font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              Ready to build with us?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-white/60">
              Tell us about yourself.
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
                  We will contact you at <span className="text-[#B8860B]">{successEmail}</span>.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="rn-card-net space-y-8 border border-white/15 bg-white/[0.05] p-7 md:p-10">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                <div>
                  <label htmlFor="rn-full-name" className={RN_LABEL}>
                    Full name *
                  </label>
                  <input
                    id="rn-full-name"
                    name="full_name"
                    required
                    placeholder="Your name"
                    className={RN_INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="rn-email" className={RN_LABEL}>
                    Email address *
                  </label>
                  <input
                    id="rn-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    className={RN_INPUT}
                  />
                </div>

                <div ref={countryComboRef} className="relative">
                  <label htmlFor="rn-country-input" className={RN_LABEL}>
                    Country *
                  </label>
                  <p className="mb-2.5 text-[12px] leading-relaxed text-white/45">
                    Type a letter to filter. All EU/EEA countries; Norway, Denmark and Sweden appear first in the list.
                  </p>
                  <input
                    id="rn-country-input"
                    type="text"
                    autoComplete="off"
                    value={countryTypeahead}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCountryTypeahead(v);
                      setCountryOpen(true);
                      setForm((f) => ({ ...f, country: "", region: "", city: "" }));
                      setRegionTypeahead("");
                    }}
                    onFocus={() => setCountryOpen(true)}
                    onBlur={() => {
                      const match = RECRUITER_EEA_COUNTRIES.find(
                        (c) => c.toLowerCase() === countryTypeahead.trim().toLowerCase(),
                      );
                      if (match) {
                        setForm((f) => ({ ...f, country: match, region: "", city: "" }));
                        setCountryTypeahead(match);
                        setRegionTypeahead("");
                      }
                      setCountryOpen(false);
                    }}
                    placeholder="Start typing a country…"
                    className={RN_INPUT}
                    aria-autocomplete="list"
                    aria-expanded={countryOpen}
                    aria-controls="rn-country-listbox"
                  />
                  {countryOpen && countryFiltered.length > 0 ? (
                    <ul
                      id="rn-country-listbox"
                      role="listbox"
                      className={RN_LIST}
                    >
                      {countryFiltered.map((c) => (
                        <li key={c} role="none">
                          <button
                            type="button"
                            role="option"
                            className={RN_LIST_ITEM}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              setForm((f) => ({ ...f, country: c, region: "", city: "" }));
                              setCountryTypeahead(c);
                              setCountryOpen(false);
                              setRegionTypeahead("");
                              setRegionOpen(false);
                            }}
                          >
                            {c}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {hasCommittedCountry ? (
                  <div className="space-y-1">
                    <label htmlFor={regionChoicesList ? "rn-region-input" : "rn-region-manual"} className={RN_LABEL}>
                      Region *
                    </label>
                    <p className="mb-2.5 text-[12px] leading-relaxed text-white/45">
                      {regionChoicesList
                        ? "Choose your county or region (Norway, Denmark, Sweden). Type to narrow the list."
                        : "Enter your region, county or state as used locally in your country."}
                    </p>
                    {regionChoicesList ? (
                      <div ref={regionComboRef} className="relative">
                        <input
                          id="rn-region-input"
                          type="text"
                          autoComplete="off"
                          value={regionTypeahead}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRegionTypeahead(v);
                            setRegionOpen(true);
                            setForm((f) => ({ ...f, region: "", city: "" }));
                          }}
                          onFocus={() => {
                            setRegionOpen(true);
                            if (form.region) setRegionTypeahead(form.region);
                          }}
                          onBlur={() => {
                            const list = regionChoicesList;
                            const match = list.find((r) => r.toLowerCase() === regionTypeahead.trim().toLowerCase());
                            if (match) {
                              setForm((f) => ({ ...f, region: match, city: "" }));
                              setRegionTypeahead(match);
                            }
                            setRegionOpen(false);
                          }}
                          placeholder="Search regions…"
                          className={RN_INPUT}
                          aria-autocomplete="list"
                          aria-expanded={regionOpen}
                          aria-controls="rn-region-listbox"
                        />
                        {regionOpen && regionFiltered.length > 0 ? (
                          <ul id="rn-region-listbox" role="listbox" className={RN_LIST}>
                            {regionFiltered.map((r) => (
                              <li key={r} role="none">
                                <button
                                  type="button"
                                  role="option"
                                  className={RN_LIST_ITEM}
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    setForm((f) => ({ ...f, region: r, city: "" }));
                                    setRegionTypeahead(r);
                                    setRegionOpen(false);
                                  }}
                                >
                                  {r}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : (
                      <input
                        id="rn-region-manual"
                        type="text"
                        value={form.region}
                        onChange={(e) => {
                          const r = e.target.value;
                          setForm((f) => ({
                            ...f,
                            region: r,
                            city: r.trim() ? f.city : "",
                          }));
                        }}
                        placeholder="Enter your region"
                        className={RN_INPUT}
                      />
                    )}
                  </div>
                ) : null}

                {hasCommittedCountry && hasRegion ? (
                  <div>
                    <label htmlFor="rn-city" className={RN_LABEL}>
                      City *
                    </label>
                    <input
                      id="rn-city"
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Enter your city"
                      className={RN_INPUT}
                    />
                  </div>
                ) : null}

                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">
                    How do you invoice?
                  </legend>
                  <p className="mb-3 text-xs text-white/40">
                    We work with invoicing only. Select how you prefer to invoice.
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        value: "company",
                        title: "Registered company (e.g. Norwegian AS/ENK or local equivalent)",
                        subtitle: "I invoice through my own registered business",
                      },
                      {
                        value: "sole_trader",
                        title: "Sole trader / self-employed (e.g. ENK in Norway)",
                        subtitle: "I am self-employed and invoice under my personal business number",
                      },
                      {
                        value: "freelancer_platform",
                        title: "Freelancer via invoicing platform",
                        subtitle: "I use a platform such as Factofly, Frilansfinans, or similar to invoice",
                      },
                      {
                        value: "no_business",
                        title: "I do not have a business yet",
                        subtitle: "I am interested but need to set up invoicing first. We can help guide you.",
                      },
                    ].map((option) => {
                      const checked = form.businessType === option.value;
                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-start gap-3 rounded-[10px] border p-[14px_16px]"
                          style={{
                            background: checked ? "rgba(201,168,76,0.10)" : "rgba(255,255,255,0.06)",
                            borderColor: checked ? "#C9A84C" : "rgba(255,255,255,0.18)",
                            transition: "all 180ms",
                          }}
                        >
                          <input
                            type="radio"
                            name="business_type"
                            value={option.value}
                            checked={checked}
                            onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                            required
                            className="sr-only"
                          />
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: `2px solid ${checked ? "#C9A84C" : "rgba(255,255,255,0.2)"}`,
                              marginTop: 2,
                              position: "relative",
                              flexShrink: 0,
                            }}
                          >
                            {checked ? (
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "#C9A84C",
                                  position: "absolute",
                                  left: "50%",
                                  top: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                            ) : null}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-white">{option.title}</span>
                            <span className="block text-xs text-white/50">{option.subtitle}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
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
                  <label htmlFor="rn-social" className={RN_LABEL}>
                    Social media or professional profile link *
                  </label>
                  <input
                    id="rn-social"
                    name="social_url"
                    type="url"
                    required
                    placeholder="https://"
                    className={RN_INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="rn-reach" className={RN_LABEL}>
                    Monthly reach / visitors *
                  </label>
                  <input
                    id="rn-reach"
                    name="monthly_reach"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 150,000"
                    className={RN_INPUT}
                  />
                </div>

                <input type="hidden" name="has_company" value={mapBusinessTypeToHasCompany(form.businessType)} />

                <div>
                  <label htmlFor="rn-motivation" className={RN_LABEL}>
                    Tell us why you want to join
                  </label>
                  <textarea
                    id="rn-motivation"
                    name="motivation"
                    maxLength={500}
                    rows={4}
                    placeholder="What drives you? What is your market? What makes you the right partner?"
                    value={motivation}
                    onChange={(ev) => setMotivation(ev.target.value)}
                    className={`${RN_INPUT} min-h-[120px] resize-y`}
                  />
                  <p className="mt-1 text-right text-[11px] text-white/40">{motivation.length}/500</p>
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
    <RecruiterNetworkPremiumApplyModal open={premiumApplyOpen} onClose={() => setPremiumApplyOpen(false)} />
    </>
  );
}
