"use client";

import { useState, type ReactNode } from "react";
import { Briefcase, Clock, FileCheck } from "lucide-react";

import SourceDisclaimer from "@/components/ui/SourceDisclaimer";
import ComingSoonCapture from "@/components/ui/ComingSoonCapture";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";
const ARBEIDSTILSYNET_MIN =
  "https://www.arbeidstilsynet.no/en/pay-and-engagement-of-employees/pay-and-minimum-rates-of-pay/minimum-wage/";

function InlineRegisterBlock({ onPrimaryDsb }: { onPrimaryDsb: () => void }) {
  return (
    <div className="mt-8 w-full max-w-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <a
          href="https://jobs.arbeidmatch.no/sign-up"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border px-8 py-3.5 text-[15px] font-bold text-[#0f1923] shadow-[0_10px_30px_rgba(201,168,76,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(201,168,76,0.38)]"
          style={{
            background: "linear-gradient(135deg, #d6b45a 0%, #c9a84c 45%, #b8953f 100%)",
            borderColor: "rgba(255,255,255,0.25)",
            animation: "premiumPulse 3.2s ease-in-out infinite",
          }}
        >
          Register for job alerts
        </a>
        <button
          type="button"
          onClick={onPrimaryDsb}
          className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border bg-transparent px-8 py-3.5 text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[rgba(201,168,76,0.1)]"
          style={{
            color: "rgba(201,168,76,0.95)",
            borderColor: "rgba(201,168,76,0.38)",
            boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.08)",
            animation: "softGlow 4.5s ease-in-out infinite",
          }}
        >
          Get the Full DSB Guide
        </button>
      </div>
      <style jsx>{`
        @keyframes premiumPulse {
          0%,
          100% {
            filter: saturate(1);
          }
          50% {
            filter: saturate(1.12) brightness(1.03);
          }
        }
        @keyframes softGlow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.08), 0 0 0 rgba(201, 168, 76, 0);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.16), 0 0 20px rgba(201, 168, 76, 0.14);
          }
        }
      `}</style>
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
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

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
            Norway has strong demand for qualified electricians. As an EU/EEA citizen, you have the right to apply for legal
            employment. Here is what you need to know before you start.
          </p>
          <InlineRegisterBlock onPrimaryDsb={() => setComingSoonFeature("dsb-authorization-guide")} />
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
              title="DSB Authorization"
              body="DSB (Directorate for Civil Protection) is the Norwegian authority that approves foreign electricians. DSB authorization is required by law to work on electrical installations in Norway."
              badge="Required by law"
            />
            <RequirementCard
              icon={<Briefcase size={32} strokeWidth={1.5} />}
              title="Valid Trade Certificate"
              body="A recognized trade certificate or equivalent qualification from your home country is the starting point for your DSB application. Documents not in English, Swedish or Danish must be translated by a certified translator."
              badge="Part of DSB application"
            />
            <RequirementCard
              icon={<Clock size={32} strokeWidth={1.5} />}
              title="Documented Work Experience"
              body="At least 1 year of documented practical experience in the electrical trade within the last 10 years is required. Employer references must confirm dates and type of work performed."
              badge="Minimum 1 year required"
            />
          </div>
        </div>
      </section>

      <section className="px-6 text-white" style={{ background: NAVY, padding: "64px 24px" }}>
        <div className="mx-auto max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            Processing time
          </p>
          <h2 className="mt-2 text-[30px] font-bold text-white">Temporary or permanent: choose your path</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article
              className="rounded-[20px] border border-[rgba(201,168,76,0.15)] px-8 py-8"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid #C9A84C" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
                Faster option
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">Temporary Approval</h3>
              <p className="mt-3 text-[32px] font-extrabold text-white">1 to 2 months</p>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-white/[0.7]">
                <li>Valid for maximum 12 months</li>
                <li>DSB initial response within 1 month</li>
                <li>Suitable for project-based work</li>
                <li>Requires project description</li>
              </ul>
            </article>
            <article
              className="rounded-[20px] border border-[rgba(201,168,76,0.15)] px-8 py-8"
              style={{ background: "rgba(255,255,255,0.02)", borderTop: "3px solid #1D9E75" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1D9E75]">Long-term option</p>
              <h3 className="mt-2 text-xl font-bold text-white">Permanent Authorization</h3>
              <p className="mt-3 text-[32px] font-extrabold text-white">Up to 4 months</p>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-white/[0.7]">
                <li>Valid indefinitely</li>
                <li>Recommended for permanent employment</li>
                <li>Full recognition of qualifications</li>
                <li>Required for stable long-term work</li>
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
              Salary for electricians in Norway is governed by collective agreements (tariffavtale) under the allmenngjøring
              system. The electrical sector minimum for qualified workers is set by Tariffnemnda and updated periodically.
            </p>
            <p className="mt-3 text-[14px] leading-[1.7] text-white/70">
              Your actual hourly rate depends on: your DSB authorization level, years of experience in Norway, specialized
              certifications (high-voltage, automation, offshore), and references from previous Norwegian employers.
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
                  v: "270.45 NOK/hour",
                  n: "As of June 2025, electrical sector allmenngjøring",
                },
                {
                  l: "Average market rate (certified)",
                  v: "approx. 290 to 330 NOK/hour",
                  n: "Based on market data, varies by employer and project",
                },
                { l: "Accommodation", v: "Often provided", n: "For away-from-home assignments, employer typically covers costs" },
                { l: "Overtime supplement", v: "Minimum 40%", n: "Per Norwegian Working Environment Act" },
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
              Additional context may include ERI Economic Research Institute Norway 2026 and NorwayExplained.com. Always
              verify current rates with your employer and the relevant collective agreement.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-16 text-white" style={{ padding: "64px 24px" }}>
        <div className="mx-auto max-w-[800px]">
          <div
            className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-6 md:px-7"
          >
            <h2 className="text-[15px] font-semibold text-white">Want the complete step-by-step DSB process?</h2>
            <p className="mt-3 text-[14px] leading-[1.7] text-white/70">
              The full DSB application process, required documents checklist, common rejection reasons, FSE safety
              requirements, and additional authorizations for datacenter or naval work are covered in our detailed DSB
              Authorization Guide.
            </p>
            <button
              type="button"
              onClick={() => setComingSoonFeature("dsb-authorization-guide")}
              className="mt-4 inline-flex items-center justify-center rounded-[8px] px-6 py-3 text-[14px] font-bold text-[#0f1923]"
              style={{ background: GOLD }}
            >
              Get the Full Guide, Coming soon
            </button>
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
      {comingSoonFeature ? (
        <ComingSoonCapture featureName={comingSoonFeature} isOpen onClose={() => setComingSoonFeature(null)} />
      ) : null}
    </main>
  );
}
