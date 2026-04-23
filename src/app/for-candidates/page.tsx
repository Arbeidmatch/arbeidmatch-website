import type { Metadata } from "next";
import Link from "next/link";
import {
  Bolt,
  Briefcase,
  Building2,
  Factory,
  HardHat,
  HeartPulse,
  House,
  Landmark,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
} from "lucide-react";

import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";

export const metadata: Metadata = {
  title: "Find Your Next Job in Norway | ArbeidMatch",
  description:
    "EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Find Your Next Job in Norway | ArbeidMatch",
    description:
      "EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Next Job in Norway | ArbeidMatch",
    description:
      "EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.",
  },
};

const WHY_CARDS = [
  {
    title: "Legal Employment",
    description:
      "Norwegian employment contracts, full worker rights, and legal hiring through an Arbeidstilsynet-authorized company.",
    icon: ShieldCheck,
  },
  {
    title: "Accommodation Support",
    description: "We help you secure accommodation and prioritize single room setups where possible.",
    icon: House,
  },
  {
    title: "English-Friendly",
    description: "Most open roles are available in English, so Norwegian language is not required for many positions.",
    icon: UserCheck,
  },
  {
    title: "Pre-departure Support",
    description: "Guidance with documentation, D-number setup, and key certifications before your departure.",
    icon: Building2,
  },
] as const;

const HOW_IT_WORKS = [
  { title: "Create Profile", description: "Share your trade, experience, and availability." },
  { title: "We Match You", description: "Our team connects your profile with relevant employers." },
  { title: "Interview", description: "Meet the employer and confirm fit, terms, and start date." },
  { title: "Start Working", description: "Travel with a clear plan and begin your legal employment in Norway." },
] as const;

const CATEGORIES = [
  { title: "Construction & Civil", icon: HardHat },
  { title: "Electrical & Technical", icon: Bolt },
  { title: "Logistics & Transport", icon: Truck },
  { title: "Industry & Production", icon: Factory },
  { title: "Cleaning & Facility", icon: Sparkles },
  { title: "Hospitality & Healthcare", icon: HeartPulse },
] as const;

const LEGAL_RIGHTS_LINKS = [
  {
    title: "Arbeidstilsynet",
    description: "Official guidance on workplace rights, contracts, safety, and legal conditions in Norway.",
    href: "https://www.arbeidstilsynet.no/en/",
  },
  {
    title: "NAV",
    description: "Norway's social welfare and employment services for workers and residents.",
    href: "https://www.nav.no/en",
  },
  {
    title: "Skatteetaten",
    description: "Tax registration, tax card requirements, and D-number related tax information.",
    href: "https://www.skatteetaten.no/en/",
  },
] as const;

export default function ForCandidatesPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="relative overflow-hidden border-b border-[#C9A84C]/15 py-16 md:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 75% 60% at 50% -10%, rgba(201,168,76,0.18), transparent 58%), radial-gradient(ellipse 50% 35% at 100% 50%, rgba(201,168,76,0.09), transparent 55%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-content px-4 text-center md:px-12 lg:px-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">For Candidates</p>
          <h1 className="mt-5 text-balance break-words text-3xl font-bold leading-tight text-white md:text-5xl lg:text-7xl">
            Find Your Next Job in Norway
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">
            EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.
          </p>
          <div className="mt-10">
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-4 text-base font-semibold text-[#0D1B2A] transition hover:bg-[#b8953f]"
            >
              Create Your Profile
            </a>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <div className="w-full rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-r from-[#C9A84C]/20 to-[#C9A84C]/5 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <Briefcase size={36} className="text-[#C9A84C]" aria-hidden />
                <h2 className="mt-4 text-2xl font-bold text-white">Browse Open Positions</h2>
                <p className="mt-2 text-white/60">Find your next job in Norway. New positions added regularly.</p>
              </div>
              <a
                href="https://jobs.arbeidmatch.no"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-4 text-lg font-semibold text-[#0D1B2A]"
              >
                View All Jobs
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a1624] py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <h2 className="text-balance break-words text-center text-3xl font-bold text-white md:text-4xl">Why Work Through ArbeidMatch</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {WHY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-2xl border border-[#C9A84C]/20 bg-white/[0.03] p-6">
                  <div className="inline-flex rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 p-2.5">
                    <Icon className="h-5 w-5 text-[#C9A84C]" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{card.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <h2 className="text-balance break-words text-center text-3xl font-bold text-white md:text-4xl">How It Works</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-[#C9A84C]/20 bg-white/[0.03] p-6">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 text-sm font-bold text-[#C9A84C]">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0a1624] py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <h2 className="text-balance break-words text-center text-3xl font-bold text-white md:text-4xl">Available Categories</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <a
                  key={category.title}
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer rounded-2xl border border-[#C9A84C]/20 bg-white/[0.03] p-6 transition duration-200 hover:scale-[1.02] hover:border-[#C9A84C]/60"
                >
                  <div className="inline-flex rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 p-2.5">
                    <Icon className="h-5 w-5 text-[#C9A84C]" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{category.title}</h3>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <h2 className="text-balance break-words text-center text-3xl font-bold text-white md:text-4xl">Legal &amp; Your Rights</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {LEGAL_RIGHTS_LINKS.map((resource) => (
              <a
                key={resource.title}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-[#C9A84C]/20 bg-white/[0.03] p-6 transition hover:border-[#C9A84C]/45 hover:bg-[#C9A84C]/5"
              >
                <div className="inline-flex rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 p-2.5">
                  <Landmark className="h-5 w-5 text-[#C9A84C]" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-[#C9A84C]">{resource.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{resource.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-[#C9A84C]">Visit official site →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-[#C9A84C]/15 py-16 text-center md:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.14), transparent 58%)" }}
        />
        <div className="relative mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
          <h2 className="text-balance break-words text-3xl font-bold text-white md:text-4xl">Ready to Start?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Build your profile in minutes and explore open jobs for legal, structured work in Norway.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[210px] items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-4 text-base font-semibold text-[#0D1B2A] transition hover:bg-[#b8953f]"
            >
              Create Your Profile
            </a>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[210px] items-center justify-center rounded-xl border border-[#C9A84C]/45 bg-transparent px-8 py-4 text-base font-semibold text-[#C9A84C] transition hover:bg-[#C9A84C]/10"
            >
              Browse Jobs
            </a>
          </div>
        </div>
      </section>

      <PreFooterCrossLinks variant="candidates" />
    </div>
  );
}
