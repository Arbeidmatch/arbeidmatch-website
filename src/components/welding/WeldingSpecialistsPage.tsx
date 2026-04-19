"use client";

import Link from "next/link";
import WeldingCertGrid from "./WeldingCertGrid";

const GOLD = "#C9A84C";

const INDUSTRIES = [
  "Oil and Gas",
  "Offshore Structures",
  "Shipbuilding and Naval",
  "Industrial Manufacturing",
  "Pressure Vessels and Pipelines",
  "Construction and Infrastructure",
] as const;

export default function WeldingSpecialistsPage() {
  return (
    <main>
      {/* Section 1 Hero */}
      <section className="bg-[#0f1923] px-6 pb-12 pt-16 text-white md:pb-20 md:pt-24 lg:pb-20 lg:pt-[100px]">
        <div className="mx-auto max-w-content">
          <span
            className="inline-block rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: "rgba(201,168,76,0.1)",
              borderColor: "rgba(201,168,76,0.35)",
              color: GOLD,
            }}
          >
            Welding Specialists
          </span>
          <h1 className="mt-6 font-extrabold leading-[1.1] text-white [font-size:clamp(36px,5vw,60px)]">
            ISO-Certified Welders for Demanding Norwegian Projects
          </h1>
          <p className="mt-6 max-w-[640px] text-lg leading-[1.75] text-white/[0.65]">
            ArbeidMatch recruits and pre-screens welders and technical specialists holding valid ISO, EN, NORSOK, and DNV
            certifications. We verify every certificate before presenting a candidate.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/request"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3.5 text-[15px] font-bold text-[#0f1923] transition-colors duration-200 hover:bg-[#b8953f]"
            >
              Request Welding Specialists
            </Link>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-[#C9A84C] bg-transparent px-8 py-3.5 text-[15px] font-semibold text-[#C9A84C] transition-colors duration-200 hover:bg-[#C9A84C]/10"
            >
              View all open positions
            </a>
          </div>
        </div>
      </section>

      {/* Section 2 Stats */}
      <section className="bg-[#0f1923]">
        <div
          className="mx-auto grid max-w-content grid-cols-2 gap-10 px-6 py-12 md:grid-cols-4 md:gap-8 md:px-6 lg:px-20"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {[
            ["30+", "EU/EEA source countries"],
            ["ISO 9606", "Primary certification standard"],
            ["2 weeks", "Average candidate delivery"],
            ["100%", "Certificate verification on every candidate"],
          ].map(([num, label]) => (
            <div key={label} className="text-center md:text-left">
              <p className="text-[40px] font-extrabold leading-none" style={{ color: GOLD }}>
                {num}
              </p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 certifications */}
      <section className="bg-white px-6 py-16 md:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">Certification coverage</p>
          <h2 className="mt-3 text-[36px] font-bold text-[#0f1923]">Every major welding standard, verified.</h2>
          <div className="mt-12">
            <WeldingCertGrid variant="light" />
          </div>
        </div>
      </section>

      {/* Section 4 How it works */}
      <section className="bg-[#0f1923] px-6 py-16 text-white md:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            Simple process
          </p>
          <h2 className="mt-3 text-[32px] font-bold text-white">From request to certified welder on site</h2>
          <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:gap-8">
            {[
              {
                n: "01",
                t: "Tell us your project requirements",
                b: "Submit your request with details on certification standard required, welding process, material type, and project location. We assess your needs within 24 hours.",
              },
              {
                n: "02",
                t: "We source and verify",
                b: "Our recruiters identify candidates from our EU/EEA network. Every ISO and EN certificate is verified for validity and expiry. Only pre-screened candidates are presented.",
              },
              {
                n: "03",
                t: "Candidate arrives ready",
                b: "The selected welder arrives with valid, verified documentation. We handle employment contracts, payroll compliance with Norwegian law, and pre-arrival logistics support.",
              },
            ].map((step) => (
              <div key={step.n} className="min-w-0 flex-1">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[32px] font-extrabold leading-none"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    color: GOLD,
                  }}
                >
                  {step.n}
                </div>
                <h3 className="mt-4 text-[18px] font-bold text-white">{step.t}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-white/[0.6]">{step.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 Industries */}
      <section className="bg-white px-6 py-16 md:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">Industries we serve</p>
          <h2 className="mt-3 text-[32px] font-bold text-[#0f1923]">Where our welding specialists work</h2>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {INDUSTRIES.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-black/[0.12] bg-white px-5 py-2.5 text-[14px] text-[#374151] transition-colors duration-200 hover:border-[#C9A84C] hover:text-[#C9A84C]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 Legal */}
      <section className="bg-white px-6 pb-16 md:pb-20">
        <div
          className="mx-auto max-w-[800px] rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6"
          style={{ background: "rgba(201,168,76,0.06)" }}
        >
          <h2 className="text-[15px] font-semibold text-[#0f1923]">About staffing and direct hire options</h2>
          <p className="mt-3 text-[14px] leading-[1.7] text-[#374151]">
            ArbeidMatch offers both staffing (innleie) and direct hire (fast ansettelse) solutions for welding specialists.
            Staffing arrangements comply with Norwegian labor law requirements under arbeidsmiljøloven. We will advise you
            on the most suitable employment structure for your project type and duration during our initial consultation.
          </p>
          <a
            href="https://www.arbeidstilsynet.no"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] font-medium text-gold underline-offset-4 hover:underline"
          >
            Read Norwegian staffing regulations at Arbeidstilsynet.no
          </a>
        </div>
      </section>

      {/* Section 7 CTA */}
      <section className="bg-[#0f1923] px-6 py-16 text-center md:py-20 lg:py-[80px]">
        <div className="mx-auto max-w-content">
          <h2 className="text-[36px] font-bold text-white">Ready to find your certified welder?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-white/[0.6]">
            Tell us your project requirements and we will present pre-screened candidates within 2 weeks.
          </p>
          <Link
            href="/request"
            className="mt-10 inline-flex min-h-[52px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-12 py-4 text-[16px] font-bold text-[#0f1923] transition-colors duration-200 hover:bg-[#b8953f]"
          >
            Request Welding Specialists Now
          </Link>
        </div>
      </section>
    </main>
  );
}
