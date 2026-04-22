"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { EASE_PREMIUM } from "@/lib/animationConstants";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";
const NAVY_PANEL = "#0D1B2A";
const DSB_INFO_URL =
  "https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/";

function GoldButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] px-8 py-3.5 text-[15px] font-bold text-[#0f1923] shadow-[0_10px_30px_rgba(201,168,76,0.22)] transition hover:-translate-y-0.5 hover:brightness-105"
      style={{
        background: "linear-gradient(135deg, #d6b45a 0%, #c9a84c 45%, #b8953f 100%)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      {children}
    </Link>
  );
}

function OutlineGoldButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] border border-[rgba(201,168,76,0.45)] bg-transparent px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[rgba(201,168,76,0.1)]"
    >
      {children}
    </Link>
  );
}

const cardBaseClass =
  "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border bg-[rgba(255,255,255,0.02)] p-8 transition-all duration-500 ease-out md:p-10 " +
  "border-[rgba(201,168,76,0.32)] shadow-[0_12px_40px_rgba(0,0,0,0.25)] " +
  "hover:-translate-y-[3px] hover:border-[rgba(201,168,76,0.55)] hover:shadow-[0_22px_55px_rgba(0,0,0,0.38),0_0_0_1px_rgba(201,168,76,0.12)]";

const iconWrapClass =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)] text-[#C9A84C] transition duration-500 group-hover:border-[rgba(201,168,76,0.55)] group-hover:bg-[rgba(201,168,76,0.14)]";

function GoldCardCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[12px] px-8 py-3.5 text-[15px] font-bold text-[#0D1B2A] transition duration-300 hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[0_12px_32px_rgba(201,168,76,0.35)]"
      style={{
        background: `linear-gradient(135deg, #e4cf7a 0%, ${GOLD} 42%, #a88a3a 100%)`,
        boxShadow: "0 4px 20px rgba(201,168,76,0.25)",
        border: "1px solid rgba(255,255,255,0.22)",
      }}
    >
      {children}
    </Link>
  );
}

function OutlineGoldCardCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[12px] border-2 border-[#C9A84C] bg-transparent px-8 py-3.5 text-[15px] font-semibold text-[#C9A84C] transition duration-300 hover:-translate-y-0.5 hover:bg-[rgba(201,168,76,0.1)] hover:shadow-[0_0_28px_rgba(201,168,76,0.18)]"
    >
      {children}
    </Link>
  );
}

export default function ElectriciansNorwayPage() {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (searchParams.get("section") !== "dsb") return;
    const el = document.getElementById("dsb-authorization-guide");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  const cardMotionProps = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.55, ease: EASE_PREMIUM, delay },
        };

  return (
    <main>
      <section className="bg-[#0f1923] px-6 pb-14 pt-14 text-white md:pb-20 md:pt-20">
        <div className="mx-auto max-w-content">
          <span
            className="inline-block rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: "rgba(201,168,76,0.1)",
              borderColor: "rgba(201,168,76,0.35)",
              color: GOLD,
            }}
          >
            EU/EEA electricians · Norway
          </span>
          <h1 className="mt-6 max-w-4xl font-extrabold leading-[1.08] text-white [font-size:clamp(30px,4.5vw,52px)]">
            Work as an Electrician in Norway
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-[1.75] text-white/[0.68]">
            High demand, competitive salaries and stable contracts for qualified EU/EEA electricians.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <GoldButton href="/candidates">Create your profile</GoldButton>
            <OutlineGoldButton href="/premium">Get your DSB guide</OutlineGoldButton>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.15)] px-6 py-16 md:py-24" style={{ background: NAVY_PANEL }}>
        <div className="mx-auto max-w-content">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
            <motion.article {...cardMotionProps(0)} className={cardBaseClass}>
              <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,rgba(201,168,76,0.06)_0%,transparent_45%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <div className={iconWrapClass}>
                  <ShieldCheck className="h-7 w-7" strokeWidth={1.6} aria-hidden />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-[26px]">I have DSB authorisation</h2>
                <p className="mt-4 flex-1 text-[15px] leading-[1.75] text-white/70">
                  Ready to work. Create your profile and we match you with Norwegian employers actively hiring.
                </p>
                <div className="mt-10 w-full shrink-0 pt-2">
                  <GoldCardCta href="/candidates">Create your profile</GoldCardCta>
                </div>
              </div>
            </motion.article>

            <motion.article {...cardMotionProps(0.1)} className={cardBaseClass}>
              <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,rgba(201,168,76,0.04)_0%,transparent_50%)] opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <div className={iconWrapClass}>
                  <BookOpen className="h-7 w-7" strokeWidth={1.6} aria-hidden />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-[26px]">I need DSB authorisation</h2>
                <p className="mt-4 flex-1 text-[15px] leading-[1.75] text-white/70">
                  Get our step-by-step guide to prepare your documents and apply with confidence.
                </p>
                <div className="mt-10 w-full shrink-0 pt-2">
                  <OutlineGoldCardCta href="/premium">Get the guide</OutlineGoldCardCta>
                </div>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      <section
        id="dsb-authorization-guide"
        className="scroll-mt-[calc(4rem+8px)] border-t-2 border-[rgba(201,168,76,0.28)] px-6 py-14 text-white md:py-16"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #0f1c30 55%, ${NAVY_PANEL} 100%)` }}
      >
        <div className="mx-auto max-w-content">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-9 w-9 shrink-0 text-gold" strokeWidth={1.4} aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                In practice
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-[26px]">What DSB authorisation means for you</h2>
              <ul className="mt-6 max-w-3xl space-y-3 text-[15px] leading-[1.7] text-white/72">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span>
                    It is the approval foreign electricians need to perform electrical work on installations in Norway in line
                    with Norwegian electrical safety rules.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span>
                    Employers use it as proof that you meet the bar for roles on construction sites, industry, and service
                    contracts.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span>
                    Timelines and requirements depend on your background; our guides focus on how to prepare well and stay
                    hireable while you complete the process.
                  </span>
                </li>
              </ul>
              <p className="mt-8 max-w-2xl text-[13px] leading-relaxed text-white/45">
                Official rules and application forms are published by{" "}
                <a
                  href={DSB_INFO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[rgba(201,168,76,0.85)] underline underline-offset-2 transition hover:text-gold"
                >
                  DSB (Norway)
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
