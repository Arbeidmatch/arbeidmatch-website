"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Handshake, House, ShieldCheck, UserCheck } from "lucide-react";

import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";

const JOBS_URL = "https://jobs.arbeidmatch.no";
const SIGN_UP_URL = "https://jobs.arbeidmatch.no/sign-up";

const WHY_ITEMS = [
  {
    title: "Legal employment",
    line: "Contracts and rights aligned with Norwegian labour rules.",
    icon: ShieldCheck,
  },
  {
    title: "Accommodation support",
    line: "Help finding housing where single rooms are prioritised when possible.",
    icon: House,
  },
  {
    title: "English-speaking process",
    line: "Clear communication without Norwegian as a barrier for many roles.",
    icon: UserCheck,
  },
  {
    title: "Direct employer contact",
    line: "Matched with employers who are actively hiring in your trade.",
    icon: Handshake,
  },
] as const;

const TIMELINE_STEPS = [
  { title: "Create your profile", body: "Add your trade, experience and availability on the job portal." },
  { title: "Get matched", body: "We connect your profile with relevant Norwegian employers." },
  { title: "Start working", body: "Agree terms, travel with a plan and begin legal employment." },
] as const;

const CATEGORY_PILLS = [
  "Construction",
  "Electrical",
  "Logistics",
  "Industry",
  "Cleaning",
  "Hospitality",
] as const;

const LEGAL_LINKS = [
  { label: "arbeidstilsynet.no", href: "https://www.arbeidstilsynet.no/en/", hint: "Workplace rights and safety" },
  { label: "nav.no", href: "https://www.nav.no/en", hint: "Employment services and benefits" },
  { label: "skatteetaten.no", href: "https://www.skatteetaten.no/en/", hint: "Tax and D-number" },
] as const;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function ForCandidatesStatsRow() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [n6, setN6] = useState(0);
  const [n48, setN48] = useState(0);
  const [showRegion, setShowRegion] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setN6(6);
      setN48(48);
      setShowRegion(true);
      setActive(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setActive(true);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (!active || reduceMotion) return;
    const durationMs = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = easeOutCubic(t);
      setN6(Math.round(6 * e));
      setN48(Math.round(48 * e));
      if (t >= 0.35) setShowRegion(true);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion]);

  return (
    <div ref={ref} className="border-y border-white/5 bg-[#0a1624]/80 py-12 md:py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 px-6 sm:grid-cols-3 sm:gap-6 md:px-8">
        <div className="text-center sm:text-left">
          <p className="text-[#C9A84C] text-5xl font-bold tabular-nums">{n6}</p>
          <p className="mt-2 text-white/50 text-sm">categories available</p>
        </div>
        <div className="text-center sm:text-left">
          <p
            className={`text-[#C9A84C] text-5xl font-bold transition-opacity duration-500 ${
              showRegion ? "opacity-100" : "opacity-30"
            }`}
          >
            EU/EEA
          </p>
          <p className="mt-2 text-white/50 text-sm">only</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[#C9A84C] text-5xl font-bold tabular-nums">{`${n48}h`}</p>
          <p className="mt-2 text-white/50 text-sm">response time</p>
        </div>
      </div>
    </div>
  );
}

export default function ForCandidatesPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      {/* HERO */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-20 md:px-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(201,168,76,0.12), transparent 55%), #0D1B2A",
        }}
      >
        <div className="relative z-[1] mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="inline-flex rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
            EU/EEA Workers · Norway
          </span>
          <h1 className="mt-8 text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Find Your Next Job in Norway
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl">
            Legal employment. English-speaking roles. Real opportunities.
          </p>
          <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
            <a
              href={JOBS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3.5 text-base font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] sm:w-auto"
            >
              Browse open positions
            </a>
            <a
              href={SIGN_UP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[10px] border border-[#C9A84C]/45 bg-transparent px-8 py-3.5 text-base font-semibold text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10 sm:w-auto"
            >
              Create your profile
            </a>
          </div>
        </div>
      </section>

      <ForCandidatesStatsRow />

      {/* WHY */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Why ArbeidMatch</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/50">
            Built for EU and EEA workers who want structure, clarity and a serious path into Norway.
          </p>
          <div className="mt-10 flex gap-6 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-12 md:overflow-visible md:pb-0">
            {WHY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="min-w-[240px] shrink-0 md:min-w-0"
                >
                  <Icon className="h-12 w-12 text-[#C9A84C]" strokeWidth={1.25} aria-hidden />
                  <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{item.line}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — timeline */}
      <section className="border-y border-white/5 bg-[#0a1624]/50 py-16 md:py-24">
        <div className="mx-auto max-w-xl px-6 md:px-10">
          <h2 className="text-center text-2xl font-bold text-white md:text-3xl">How it works</h2>
          <ol className="relative mt-12 space-y-0">
            {TIMELINE_STEPS.map((step, i) => (
              <li key={step.title} className="relative flex gap-5 pb-12 last:pb-0">
                {i < TIMELINE_STEPS.length - 1 ? (
                  <div
                    className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-[#C9A84C]/50 to-white/10"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-sm font-bold text-[#0D1B2A]">
                  {i + 1}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CATEGORIES — pills */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-content px-6 md:px-10">
          <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Categories</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Explore roles on the job portal. Tap a category to open listings.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-4">
            {CATEGORY_PILLS.map((label) => (
              <a
                key={label}
                href={JOBS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:border-[#C9A84C]/55 hover:text-[#C9A84C] md:px-8 md:py-4 md:text-base"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LEGAL — single card */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Legal and your rights</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            ArbeidMatch is not an official Norwegian authority. Use these official sources for rules and tax.
          </p>
          <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.03] p-6 md:p-8">
            <ul className="divide-y divide-white/10">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href} className="py-4 first:pt-0 last:pb-0">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-base font-semibold text-[#C9A84C] group-hover:underline">{link.label}</span>
                    <span className="text-sm text-white/45">{link.hint}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="border-t border-white/5 py-20 md:py-28"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%)",
        }}
      >
        <div className="mx-auto max-w-content px-6 text-center md:px-10">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">Ready to start?</h2>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            Open the job portal to browse listings or create your profile in a few minutes.
          </p>
          <a
            href={JOBS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex min-h-[52px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-10 py-3.5 text-base font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            Browse jobs in Norway
          </a>
        </div>
      </section>

      <PreFooterCrossLinks variant="candidates" />
    </div>
  );
}
