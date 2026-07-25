"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase, Clock, FileCheck } from "lucide-react";

import SourceDisclaimer from "@/components/ui/SourceDisclaimer";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";
const ARBEIDSTILSYNET_MIN =
  "https://www.arbeidstilsynet.no/en/pay-and-engagement-of-employees/pay-and-minimum-rates-of-pay/minimum-wage/";

function InlineRegisterBlock({ onPrimaryCta }: { onPrimaryCta: () => void }) {
  return (
    <div className="mt-8 w-full max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={onPrimaryCta}
          className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] px-8 py-3.5 text-[15px] font-bold text-[#0f1923] transition-opacity duration-200 hover:opacity-95"
          style={{ background: GOLD }}
        >
          Browse electrician roles
        </button>
        <a
          href="https://jobs.arbeidmatch.no/sign-up"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border bg-transparent px-8 py-3.5 text-[15px] font-semibold transition-colors duration-200 hover:bg-[rgba(201,168,76,0.08)]"
          style={{ color: GOLD, borderColor: "rgba(201,168,76,0.45)" }}
        >
          Register for job alerts
        </a>
      </div>
    </div>
  );
}

function RequirementCard({
  icon,
  title,
  body,
  badge,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-8 text-white">
      <div className="text-gold">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-[14px] leading-[1.7] text-white/70">{body}</p>
      <span
        className="mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold"
        style={{ background: "rgba(201,168,76,0.1)", color: GOLD }}
      >
        {badge}
      </span>
    </article>
  );
}

export default function ElectriciansNorwayPage() {
  return (
    <main>
      <section className="bg-[#0f1923] px-6 pb-10 pt-14 text-white md:pb-16 md:pt-20 lg:pb-16 lg:pt-[80px]">
        <div className="mx-auto max-w-content">
          <span
            className="inline-block rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: "rgba(201,168,76,0.1)",
              borderColor: "rgba(201,168,76,0.35)",
              color: GOLD,
            }}
          >
            For Electricians
          </span>
          <h1 className="mt-6 font-extrabold leading-[1.1] text-white [font-size:clamp(32px,5vw,56px)]">
            Work as a Qualified Electrician in Norway
          </h1>
          <p className="mt-5 max-w-[600px] text-[17px] leading-[1.75] text-white/[0.65]">
            Norway has steady demand for qualified electricians. This page covers what the work looks like, what to have
            ready before you apply, and what you can expect to earn.
          </p>
          <InlineRegisterBlock onPrimaryCta={() => { window.location.href = "https://jobs.arbeidmatch.no"; }} />
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-16 text-white" style={{ padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            The basics
          </p>
          <h2 className="mt-2 text-[30px] font-bold text-white">Three things every EU/EEA electrician needs for Norway</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <RequirementCard
              icon={<FileCheck size={32} strokeWidth={1.5} />}
              title="Get your qualification recognised"
              body="Electrical work in Norway is approved by DSB. Start that application early, because it decides when you can begin. DSB publishes the requirements and the current processing times, and we point you to the right page for your situation."
              badge="Start this first"
            />
            <RequirementCard
              icon={<Briefcase size={32} strokeWidth={1.5} />}
              title="Have your papers ready"
              body="Trade certificate, proof of training and employer references covering dates and the type of work you did. Documents not in Norwegian, English, Swedish or Danish need a certified translation. Getting this together early is usually what decides how fast everything else moves."
              badge="Prepare in advance"
            />
            <RequirementCard
              icon={<Clock size={32} strokeWidth={1.5} />}
              title="Know your own experience"
              body="Be able to say clearly what you have worked on: installation, service, industry, high voltage, automation, offshore. That is what an employer asks about first, and it is what we match you on. Certificates for specialised work are worth listing separately."
              badge="Know what you can do"
            />
          </div>
        </div>
      </section>

      <section className="px-6 text-white" style={{ background: NAVY, padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            The work
          </p>
          <h2 className="mt-2 text-[30px] font-bold text-white">What the job looks like here</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article
              className="rounded-[20px] border border-[rgba(201,168,76,0.15)] px-8 py-8"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid #C9A84C" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
                Where you work
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">Sites and sectors</h3>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-white/[0.7]">
                <li>New build and renovation, housing and commercial</li>
                <li>Industry and process plants</li>
                <li>Service and maintenance work</li>
                <li>Specialised work: high voltage, automation, offshore</li>
              </ul>
            </article>
            <article
              className="rounded-[20px] border border-[rgba(201,168,76,0.15)] px-8 py-8"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid #1D9E75" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1D9E75]">Day to day</p>
              <h3 className="mt-2 text-xl font-bold text-white">Conditions on the job</h3>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-white/[0.7]">
                <li>Normally full time, often with a fixed shift rotation</li>
                <li>Away-from-home projects usually include accommodation and travel</li>
                <li>Norwegian or English on site, depending on the employer</li>
                <li>Your own hand tools are often expected, protective equipment is provided</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-16 text-white" style={{ padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            What to expect
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-white">Salary ranges for electricians in Norway</h2>
          <div className="mt-8 rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-8 md:px-8">
            <p className="text-[32px] font-extrabold" style={{ color: GOLD }}>
              260 to 330 NOK per hour
            </p>
            <p className="mt-4 text-[14px] leading-[1.7] text-white/70">
              There is a minimum hourly rate for the electrical trade in Norway, and it is updated from time to time. We tell
              you the rate that applies to your assignment before you accept it, and you can check the current figure
              yourself at the link below.
            </p>
            <p className="mt-3 text-[14px] leading-[1.7] text-white/70">
              What you actually earn on top of that depends on your experience, specialised certifications such as high
              voltage, automation or offshore, how long you have worked in Norway, and references from previous Norwegian
              employers.
            </p>
            <p className="mt-3 text-[14px] leading-[1.7] text-white/70">
              Norwegian employer references are highly valued. A strong recommendation from a previous Norwegian employer can
              significantly improve both your access to better projects and your negotiated rate.
            </p>
            <p className="mt-3 text-[14px] leading-[1.7] text-white/70">
              Some positions also include daily allowances and travel reimbursements, particularly for projects requiring you
              to stay away from home.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  l: "Sector minimum (qualified workers)",
                  v: "See current rate",
                  n: "Set centrally and updated periodically, check the link below",
                },
                {
                  l: "Typical market rate (certified)",
                  v: "approx. 290 to 330 NOK/hour",
                  n: "Estimate only, varies by employer and project",
                },
                { l: "Accommodation", v: "Often provided", n: "For away-from-home assignments, employer typically covers costs" },
                { l: "Overtime", v: "Paid on top", n: "The supplement is stated in your contract before you sign" },
              ].map((row) => (
                <div key={row.l} className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{row.l}</p>
                  <p className="mt-1 text-[15px] font-bold text-white">{row.v}</p>
                  <p className="mt-1 text-[12px] text-white/70">{row.n}</p>
                </div>
              ))}
            </div>
            <SourceDisclaimer
              className="mt-4 text-left"
              text="Salary ranges are general market estimates based on collective agreements and publicly available sources. Actual pay depends on qualifications, employer, project type, and individual negotiation. ArbeidMatch is not responsible for salary outcomes."
              sourceLabel="Source: Arbeidstilsynet.no"
              sourceUrl={ARBEIDSTILSYNET_MIN}
            />
            <p className="mt-2 text-[11px] italic leading-relaxed text-white/70">
              Always confirm the rate for your own assignment with the employer and in your contract before you accept it.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-16 text-white" style={{ padding: "64px 24px" }}>
        <div className="mx-auto max-w-[800px]">
          <div
            className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-6 md:px-7"
          >
            <h2 className="text-[15px] font-semibold text-white">Ready to work as an electrician in Norway?</h2>
            <p className="mt-3 text-[14px] leading-[1.7] text-white/70">
              Browse open roles or register for job alerts. ArbeidMatch connects qualified EU/EEA electricians with
              Norwegian employers.
            </p>
            <Link
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-[8px] px-6 py-3 text-[14px] font-bold text-[#0f1923]"
              style={{ background: GOLD }}
            >
              Browse open positions
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 text-white" style={{ background: NAVY, padding: "64px 24px" }}>
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="text-[28px] font-bold text-white">Already have your DSB? Register now.</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-white/[0.6]">
            Register your profile and we work to connect you with Norwegian employers actively looking for qualified
            electricians. We check each submission and aim to contact you personally when we have a relevant opportunity. We
            cannot guarantee timelines. Norwegian employer references are a strong advantage and help us match you with
            better projects.
          </p>
          <div style={{ marginTop: 24 }}>
            <a
              href="https://jobs.arbeidmatch.no/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#C9A84C",
                color: "#0f1923",
                fontWeight: 700,
                fontSize: 16,
                padding: "16px 40px",
                borderRadius: 12,
                textDecoration: "none",
                transition: "background 180ms",
              }}
            >
              Register your profile
            </a>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 12, lineHeight: 1.6 }}>
              You will be redirected to our job portal to create your candidate profile.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
