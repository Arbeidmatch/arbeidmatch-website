"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Building2, ShieldCheck } from "lucide-react";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";
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

export default function ElectriciansNorwayPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("section") !== "dsb") return;
    const el = document.getElementById("dsb-authorization-guide");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

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
            ArbeidMatch · DSB electricians
          </span>
          <h1 className="mt-6 max-w-4xl font-extrabold leading-[1.08] text-white [font-size:clamp(30px,4.5vw,52px)]">
            Find DSB-authorised electricians for your Norwegian project
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-[1.75] text-white/[0.68]">
            We connect Norwegian employers with verified EU/EEA electricians who hold or are obtaining DSB authorisation.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <GoldButton href="/request">Request authorised candidates</GoldButton>
            <OutlineGoldButton href="/premium">Get your DSB guide</OutlineGoldButton>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.15)] bg-[#0D1B2A] px-6 py-16 text-white md:py-20">
        <div className="mx-auto grid max-w-content gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-8 md:p-10" style={{ borderTop: `3px solid ${GOLD}` }}>
            <div className="flex items-center gap-3 text-gold">
              <Building2 className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                For employers
              </p>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white md:text-[28px]">Looking for authorised electricians?</h2>
            <p className="mt-4 text-[15px] leading-[1.75] text-white/70">
              Every electrician we present for Norwegian roles either already holds DSB authorisation or is actively moving
              through the process with a clear plan. You get fewer surprises on site and faster confidence that electrical
              work can start safely and legally.
            </p>
            <p className="mt-3 text-[15px] leading-[1.75] text-white/70">
              Tell us what you need — we match you with candidates who fit your project and your compliance expectations.
            </p>
            <div className="mt-8">
              <GoldButton href="/request">Request candidates</GoldButton>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-8 md:p-10" style={{ borderTop: `3px solid ${GOLD}` }}>
            <div className="flex items-center gap-3 text-gold">
              <BookOpen className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                For candidates
              </p>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white md:text-[28px]">Need DSB authorisation?</h2>
            <p className="mt-4 text-[15px] leading-[1.75] text-white/70">
              Our guides walk you through what Norwegian employers expect, how authorisation fits into hiring, and how to
              prepare your documentation — in plain language, from a recruitment team that works with electricians every
              week.
            </p>
            <p className="mt-3 text-[15px] leading-[1.75] text-white/70">
              ArbeidMatch does not decide DSB applications; we help you understand the journey and present you to employers
              once you are ready.
            </p>
            <div className="mt-8">
              <GoldButton href="/premium">Get the guide</GoldButton>
            </div>
          </div>
        </div>
      </section>

      <section
        id="dsb-authorization-guide"
        className="scroll-mt-[calc(4rem+8px)] border-t-2 border-[rgba(201,168,76,0.28)] px-6 py-14 text-white md:py-16"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #0f1c30 55%, #0D1B2A 100%)` }}
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
