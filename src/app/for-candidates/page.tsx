import Link from "next/link";
import { Building2, Landmark, Scale, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerHero from "@/components/premium/StaggerHero";

export const metadata: Metadata = {
  title: "Candidates | Legal work & support in Norway | ArbeidMatch",
  description:
    "Explore legal work in Norway on your terms: official resources, accommodation context, and a profile flow where you choose the pace and what happens next.",
  robots: { index: false, follow: false },
};

const LEGAL_LINKS = [
  {
    name: "Arbeidstilsynet",
    description: "The Norwegian Labour Inspection Authority — rights, safety, and working conditions.",
    href: "https://www.arbeidstilsynet.no/en/",
  },
  {
    name: "NAV",
    description: "Norwegian Labour and Welfare Administration — benefits, registration, and guidance.",
    href: "https://www.nav.no/en",
  },
  {
    name: "Skatteetaten",
    description: "The Norwegian Tax Administration — tax ID, reporting, and deductions.",
    href: "https://www.skatteetaten.no/en/",
  },
] as const;

const HOW_STEPS = [
  {
    title: "Tell us what you're looking for",
    body: "Share your trade, experience, and what matters to you in a role — location, contract type, salary expectations.",
  },
  {
    title: "See what fits you",
    body: "You'll only see roles that match what you told us. No irrelevant offers. You decide what's worth your time.",
  },
  {
    title: "You choose what happens next",
    body: "If something interests you, you take the next step. No pressure, no commitment until you're ready.",
  },
] as const;

function ExternalResourceCard({
  name,
  description,
  href,
}: {
  name: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[rgba(255,255,255,0.04)] p-6 transition-all duration-200 hover:border-[rgba(201,168,76,0.45)] hover:bg-[rgba(201,168,76,0.06)]"
    >
      <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">
        <Landmark className="h-4 w-4 shrink-0" aria-hidden />
        Official resource
      </span>
      <span className="mt-3 text-lg font-semibold text-white group-hover:text-[#C9A84C]">{name}</span>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{description}</p>
      <span className="mt-4 text-sm font-medium text-[#C9A84C] underline-offset-2 group-hover:underline">
        Visit website →
      </span>
    </a>
  );
}

export default function ForCandidatesPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="relative overflow-hidden border-b border-[rgba(201,168,76,0.12)] bg-[#0D1B2A] py-16 md:py-24 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -20%, rgba(201,168,76,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(201,168,76,0.06), transparent 50%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-content px-6 text-center md:px-12 lg:px-20">
          <StaggerHero className="flex flex-col items-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]/90">For candidates</p>
            <h1 className="heading-premium-xl mt-4 max-w-3xl font-display text-4xl leading-tight tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
              Your path to <span className="text-[#C9A84C]">dignified work</span> in Norway
            </h1>
            <p className="subtitle-premium mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              You decide your pace and what you share. Clear structure and plain-language context on Norwegian
              employment help you present yourself confidently — and you&apos;ll see roles that fit your expectations, on
              your timeline.
            </p>
            <Link
              href="/candidates"
              className="btn-gold-premium mt-10 inline-flex min-h-[48px] items-center justify-center rounded-md bg-[#C9A84C] px-10 py-3.5 text-base font-bold text-[#0D1B2A] shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform hover:bg-[#b8953f] hover:opacity-[0.98] md:px-12"
            >
              Start on your own terms
            </Link>
          </StaggerHero>
        </div>
      </section>

      <section className="border-b border-white/[0.06] bg-[#0a1624] py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)]">
              <Scale className="h-6 w-6 text-[#C9A84C]" aria-hidden />
            </div>
            <h2 className="heading-premium-xl mt-5 font-display text-3xl text-white md:text-4xl">Legal employment in Norway</h2>
            <p className="mt-4 text-base leading-relaxed text-white/65">
              Norwegian rules protect workers and set clear expectations for employers. These official sites are the
              authoritative source for rights, welfare, and tax obligations — bookmark them as you plan your move.
            </p>
          </ScrollReveal>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            {LEGAL_LINKS.map((item) => (
              <ScrollReveal key={item.href} variant="fadeUp">
                <ExternalResourceCard {...item} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal variant="fadeUp">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)]">
                <Building2 className="h-6 w-6 text-[#C9A84C]" aria-hidden />
              </div>
              <h2 className="heading-premium-xl mt-5 font-display text-3xl text-white md:text-4xl">Accommodation support</h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Where roles require relocation, many employers help newcomers settle. Arrangements depend on the contract
                and site — you&apos;ll see what&apos;s realistic in each role so you can decide before you commit.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex gap-4 rounded-xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" aria-hidden />
                  <div>
                    <p className="font-semibold text-white">Single room where possible</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">
                      Many placements prioritise a private room or clearly defined single occupancy — especially on
                      longer rotations or remote sites.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4 rounded-xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" aria-hidden />
                  <div>
                    <p className="font-semibold text-white">Company housing options</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">
                      Some employers offer staff housing, camps, or coordinated rentals near the workplace. Terms
                      (cost, deductions, notice) should always be confirmed in writing before you travel.
                    </p>
                  </div>
                </li>
              </ul>
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" className="hidden lg:block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[#0f1f32] via-[#0D1B2A] to-[#0a1624] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                <div className="absolute left-6 top-6 h-1 w-12 rounded-full bg-[#C9A84C]" />
                <p className="mt-10 text-sm font-medium uppercase tracking-[0.14em] text-[#C9A84C]/80">Peace of mind</p>
                <p className="mt-4 text-2xl font-semibold leading-snug text-white">
                  Clear housing expectations, documented terms, and plain language so you always know what you&apos;re
                  signing up for.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-white/50">
                  When you spell out what you need in your profile, employers see what housing setup actually fits you —
                  you stay in control of what you&apos;re willing to accept.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.1)] bg-[#0a1624] py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-display text-3xl text-white md:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/60">
              Three steps — you choose the pace, the detail, and what happens next.
            </p>
          </ScrollReveal>
          <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_STEPS.map((item, index) => (
              <ScrollReveal key={item.title} variant="fadeUp">
                <li className="relative flex h-full flex-col rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-6 pt-10 text-left">
                  <span className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A84C]/40 bg-[rgba(201,168,76,0.12)] text-sm font-bold text-[#C9A84C]">
                    {index + 1}
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{item.body}</p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mesh-cta-wrap relative bg-[#0D1B2A] py-16 text-center md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.12),transparent_55%)]" aria-hidden />
        <div className="relative mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="heading-premium-xl font-display text-3xl text-white md:text-4xl">Your terms, your timeline</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-4 max-w-lg text-base text-white/65">
              Complete your profile when you&apos;re ready. We&apos;ll have relevant roles waiting for you.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/candidates"
              className="btn-gold-premium mt-8 inline-flex min-h-[52px] items-center justify-center rounded-md bg-[#C9A84C] px-12 py-3.5 text-base font-bold text-[#0D1B2A] transition-transform hover:bg-[#b8953f]"
            >
              Start on your own terms
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <PreFooterCrossLinks variant="candidates" />
    </div>
  );
}
