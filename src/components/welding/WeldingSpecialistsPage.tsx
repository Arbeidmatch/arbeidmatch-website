"use client";

import Link from "next/link";
import { Award, FileText, ShieldCheck, Users } from "lucide-react";

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

      {/* Authorizations for shipyards */}
      <section className="px-6 py-16 text-white md:py-20 lg:py-[80px]" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            Required certifications
          </p>
          <h2 className="mt-3 text-[28px] font-bold text-white">
            What authorizations do welders need for Norwegian shipyards?
          </h2>
          <p className="mt-3 max-w-[800px] text-[15px] font-semibold leading-snug text-white/[0.85]">
            Certifications required for shipyard and offshore welding in Norway
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="rounded-[16px] border border-white/[0.08] bg-[#0f1923] p-6">
              <Award className="text-gold" size={28} strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-white">ISO 9606-1 Welder Qualification</h3>
              <p className="mt-2 text-[14px] leading-[1.75] text-white/[0.65]">
                The primary international standard for fusion welding qualification. Covers welding of steels and is
                recognized across Norwegian shipyards and offshore facilities. Must be valid and renewed every 2 years with
                6-month radiographic testing.
              </p>
              <a
                href="https://www.iso.org/standard/54936.html"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[11px] font-medium text-gold underline-offset-4 hover:underline"
              >
                ISO.org
              </a>
            </article>
            <article className="rounded-[16px] border border-white/[0.08] bg-[#0f1923] p-6">
              <ShieldCheck className="text-gold" size={28} strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-white">NORSOK M-101 and DNV Standards</h3>
              <p className="mt-2 text-[14px] leading-[1.75] text-white/[0.65]">
                Norwegian shipyards and offshore operators often require compliance with NORSOK M-101 (structural steel
                fabrication) and DNV rules for ships and offshore structures. These are applied on top of ISO 9606
                qualification.
              </p>
              <a
                href="https://www.standard.no"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[11px] font-medium text-gold underline-offset-4 hover:underline"
              >
                Standard Norge
              </a>
            </article>
            <article className="rounded-[16px] border border-white/[0.08] bg-[#0f1923] p-6">
              <FileText className="text-gold" size={28} strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-white">EN ISO 15614 Procedure Qualification</h3>
              <p className="mt-2 text-[14px] leading-[1.75] text-white/[0.65]">
                Welding Procedure Specification (WPS) and Procedure Qualification Record (PQR) per EN ISO 15614-1 are
                required for structural and pressure vessel work at Norwegian facilities. The employer typically provides
                the WPS.
              </p>
            </article>
            <article className="rounded-[16px] border border-white/[0.08] bg-[#0f1923] p-6">
              <Users className="text-gold" size={28} strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-white">NDT Operator Certification (if applicable)</h3>
              <p className="mt-2 text-[14px] leading-[1.75] text-white/[0.65]">
                For inspection roles, NDT (Non-Destructive Testing) certification per EN ISO 9712 or ASNT is required. Levels
                II and III are commonly requested for weld inspection at Norwegian shipyards.
              </p>
              <a
                href="https://www.iso.org/standard/75361.html"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[11px] font-medium text-gold underline-offset-4 hover:underline"
              >
                EN ISO 9712
              </a>
            </article>
          </div>
          <div
            className="mt-10 max-w-[800px] rounded-lg border-l-[3px] border-[#C9A84C] px-6 py-5"
            style={{ background: "rgba(201,168,76,0.06)" }}
          >
            <h3 className="text-[15px] font-semibold text-white">Certificate validity is verified before every placement</h3>
            <p className="mt-2 text-[14px] leading-[1.7] text-white/[0.7]">
              ArbeidMatch verifies the validity and renewal status of all ISO and welding certifications before presenting a
              candidate to an employer. Expired certificates cannot be presented.
            </p>
          </div>
          <h3 className="mt-12 text-[20px] font-bold text-white">Transport and accommodation for shipyard placements</h3>
          <p className="mt-3 max-w-[800px] text-[14px] leading-[1.8] text-white/[0.65]">
            For most shipyard and offshore welding placements in Norway, employers provide transport from the candidate home
            country and accommodation at or near the work site. This is standard practice in the Norwegian maritime and
            offshore sector. Specific arrangements are confirmed during the placement process and documented in the
            employment contract.
          </p>
          <p className="mt-3 max-w-[800px] text-[11px] italic text-white/[0.4]">
            Accommodation and transport arrangements vary by employer and project. ArbeidMatch confirms specifics during the
            matching process. This is not a guarantee for all placements.
          </p>
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
