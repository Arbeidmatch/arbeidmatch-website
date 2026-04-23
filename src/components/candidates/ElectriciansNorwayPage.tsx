"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const GOLD = "#C9A84C";
const DSB_INFO_URL =
  "https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/";

export default function ElectriciansNorwayPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("section") !== "dsb") return;
    const el = document.getElementById("dsb-authorization-guide");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  return (
    <main className="bg-[#0f1923] text-white">
      <section className="px-6 pb-14 pt-14 md:pb-20 md:pt-20">
        <div className="mx-auto max-w-content">
          <p className="inline-block rounded-full border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">
            Free information, no paid access
          </p>
          <h1 className="mt-6 max-w-4xl font-extrabold leading-[1.08] text-white [font-size:clamp(30px,4.5vw,52px)]">
            Working as an electrician in Norway
          </h1>
          <p className="mt-5 max-w-3xl text-[17px] leading-[1.75] text-white/[0.72]">
            This page provides transparent public guidance for electricians who plan to work in Norway. It explains DSB
            authorization, recognition of qualifications, and documentation requirements. It does not sell guides, access, or
            payment-based content.
          </p>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.15)] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-content">
          <div className="rounded-[20px] border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8">
            <h2 className="text-2xl font-bold text-white md:text-[28px]">What DSB authorization means</h2>
            <ul className="mt-5 space-y-3 text-[15px] leading-[1.75] text-white/75">
              <li>It is the official authorization framework for electrical professionals performing electrical work in Norway.</li>
              <li>Requirements depend on your training, practical experience, and the scope of work you will perform.</li>
              <li>Final requirements and decisions are made by Norwegian authorities, based on submitted documentation.</li>
            </ul>
            <p className="mt-6 text-sm text-white/70">
              Official source:{" "}
              <a href={DSB_INFO_URL} target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] underline underline-offset-2">
                DSB.no, authorization for electrical professionals
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section
        id="dsb-authorization-guide"
        className="scroll-mt-[calc(4rem+8px)] border-t-2 border-[rgba(201,168,76,0.28)] px-6 py-14 text-white md:py-16"
        style={{ background: "linear-gradient(180deg,#0f1923 0%,#0f1c30 55%,#0D1B2A 100%)" }}
      >
        <div className="mx-auto max-w-content">
          <div className="flex items-start gap-4 rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8">
            <ShieldCheck className="mt-1 h-9 w-9 shrink-0 text-gold" strokeWidth={1.4} aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                Recognition process
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-[26px]">Qualification recognition and documentation</h2>
              <ul className="mt-6 max-w-3xl space-y-3 text-[15px] leading-[1.7] text-white/72">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span>
                    Prepare complete copies of trade certificates, diplomas, transcripts, and documentation of practical
                    experience. Missing or unclear documentation can delay the process.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span>
                    Documents may need translation if they are not in Norwegian or English. Always check current language and
                    formatting requirements on DSB.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span>
                    Keep your CV aligned with your formal qualifications and tasks. Norwegian employers often ask for clear
                    evidence that matches the authorized scope of electrical work.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.15)] px-6 py-14 md:py-16">
        <div className="mx-auto max-w-content">
          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="font-semibold text-white">Official DSB page</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Primary source for requirements and application guidance.</p>
              <a href={DSB_INFO_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-[#C9A84C] underline underline-offset-2">
                Open DSB.no
              </a>
            </article>
            <article className="rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="font-semibold text-white">Norwegian regulations</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Legal texts and regulations are published by Norwegian authorities and may be updated.</p>
              <a href="https://www.lovdata.no" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-[#C9A84C] underline underline-offset-2">
                Open Lovdata.no
              </a>
            </article>
            <article className="rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-5">
              <h3 className="font-semibold text-white">Work environment rules</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Health and safety requirements for work in Norway are described by Arbeidstilsynet.</p>
              <a href="https://www.arbeidstilsynet.no/en/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-[#C9A84C] underline underline-offset-2">
                Open Arbeidstilsynet.no
              </a>
            </article>
          </div>
          <p className="mt-8 text-sm text-white/65">
            ArbeidMatch is a private company, not an official authority. This page is informational and free. For final
            decisions, always rely on current official guidance from DSB and other Norwegian authorities.
          </p>
          <p className="mt-4 text-sm text-white/65">
            Related free information:{" "}
            <Link href="/outside-eu-eea" className="text-[#C9A84C] underline underline-offset-2">
              Working in Norway from outside EU/EEA
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
