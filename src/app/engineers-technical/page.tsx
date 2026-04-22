import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Cog, Cpu, DraftingCompass, ShieldCheck, Zap } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Engineers & Technical Staffing | ArbeidMatch",
  description:
    "Hire engineers and technical specialists for Norwegian projects. We source, pre-screen, and support onboarding for EU and EEA talent.",
  robots: { index: false, follow: false },
};

const capabilityCards = [
  {
    title: "Electrical & Automation",
    description:
      "Technicians and engineers for panel building, commissioning, troubleshooting, and maintenance planning in production environments.",
    icon: Zap,
  },
  {
    title: "Mechanical & Industrial",
    description:
      "Mechanical fitters, maintenance engineers, and industrial specialists with proven experience in uptime-critical operations.",
    icon: Cog,
  },
  {
    title: "Design & Project Engineering",
    description:
      "CAD-capable profiles, project support engineers, and technical coordinators ready to align with your timelines and standards.",
    icon: DraftingCompass,
  },
  {
    title: "Controls & Systems",
    description:
      "PLC-focused and systems-oriented profiles for modernization projects, line optimization, and technical handover workflows.",
    icon: Cpu,
  },
];

const processSteps = [
  "Role and environment mapping with your technical leads",
  "Targeted sourcing in EU and EEA candidate networks",
  "Structured pre-screening before profile presentation",
  "Onboarding support aligned with project start requirements",
];

export default function EngineersTechnicalPage() {
  return (
    <main className="bg-[#0D1B2A] text-white">
      <section className="relative overflow-hidden border-t-2 border-t-[#C9A84C] bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.18)_0%,rgba(13,27,42,0)_55%)]" />
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">Technical Staffing</p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">Engineers &amp; Technical</h1>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
              Build stronger delivery capacity with engineering and technical specialists matched to your project context,
              safety requirements, and operating model.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#0D1B2A_0%,#111f30_55%,#0D1B2A_100%)] py-12 md:py-16 lg:py-[100px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(201,168,76,0.2)_0%,transparent_40%),linear-gradient(rgba(201,168,76,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.12)_1px,transparent_1px)] bg-[length:auto,38px_38px,38px_38px] bg-center opacity-45" />
        <div className="relative mx-auto grid w-full max-w-content gap-10 px-6 md:px-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="rounded-xl border border-[rgba(201,168,76,0.22)] bg-[rgba(255,255,255,0.03)] p-8 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Built For Complex Projects</p>
              <h2 className="mt-4 text-2xl font-bold leading-tight md:text-4xl">
                Premium technical recruitment with speed, structure, and clarity.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/75 md:text-base">
                From commissioning waves to scale-ups, we work to connect your team with technical profiles that fit your
                tools, pace, and quality expectations.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/request"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-7 py-3 text-sm font-bold text-[#0D1B2A] transition-all duration-300 hover:bg-[#b8953f]"
                >
                  Request technical candidates
                </Link>
                <Link
                  href="/for-employers"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-transparent px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[rgba(201,168,76,0.09)]"
                >
                  Explore employer services
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp">
            <div className="rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-8 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Delivery model</p>
              <ul className="mt-6 space-y-5">
                {processSteps.map((step) => (
                  <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-white/85 md:text-base">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="text-3xl font-bold md:text-4xl">Technical coverage areas</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70">
              We tailor candidate search to your production footprint, project phase, and technical stack. Every role profile
              is mapped to practical job requirements before sourcing starts.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {capabilityCards.map((card) => {
              const Icon = card.icon;
              return (
                <ScrollReveal key={card.title} variant="fadeUp">
                  <article className="h-full rounded-xl border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-8 transition-[transform,border-color,background-color] duration-300 ease-out hover:-translate-y-1 hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(255,255,255,0.06)] md:p-10">
                    <div className="inline-flex rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)] p-3">
                      <Icon className="h-6 w-6 text-[#C9A84C]" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/75 md:text-base">{card.description}</p>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] pb-12 md:pb-16 lg:pb-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <div className="rounded-xl border border-[rgba(201,168,76,0.25)] bg-[linear-gradient(140deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 md:p-12">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Production-ready support</p>
                  <h2 className="mt-3 text-2xl font-bold md:text-3xl">Plan your next technical hiring cycle with confidence</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                    Share your role requirements and timeline. We will return with a practical delivery approach based on your
                    project reality and staffing priorities.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                  <Link
                    href="/request"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition-all duration-300 hover:bg-[#b8953f]"
                  >
                    Start a request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[10px] border border-[rgba(201,168,76,0.35)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[rgba(201,168,76,0.08)]"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#C9A84C]" />
                    Contact technical desk
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}
