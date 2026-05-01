import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, FileText, ShieldCheck, UserCheck } from "lucide-react";

import CandidateAuthorityDisclaimerBar from "@/components/for-candidates/CandidateAuthorityDisclaimerBar";
import ScrollReveal from "@/components/ScrollReveal";

import TalentNetworkJoinForm from "./TalentNetworkJoinForm";

export const metadata: Metadata = {
  title: "Find work in Norway | ArbeidMatch",
  description:
    "We connect qualified EU/EEA workers with Norwegian employers in construction, logistics, and industry. Join our talent network.",
};

const OFFER_CARDS: { title: string; text: string }[] = [
  {
    title: "Legal employment contracts",
    text: "Employment agreements aligned with Norwegian labor rules for your role.",
  },
  {
    title: "Accommodation support",
    text: "Guidance on housing options when you plan your move to Norway.",
  },
  {
    title: "Single room housing",
    text: "Where employers provide housing, we help set clear expectations upfront.",
  },
  {
    title: "D-number assistance",
    text: "Practical pointers on identification and tax registration steps in Norway.",
  },
  {
    title: "Norwegian compliance",
    text: "We work with employers who take permits, safety, and payroll seriously.",
  },
  {
    title: "Fair wages per Arbeidstilsynet",
    text: "We encourage transparent pay that follows sector norms and inspections guidance.",
  },
];

const INDUSTRY_CHIPS = [
  "Construction",
  "Logistics",
  "Offshore",
  "Automotive",
  "Warehouse",
  "Industry",
  "Facility services",
  "Hospitality",
  "Healthcare support",
] as const;

const HOW_STEPS: { title: string; text: string; Icon: typeof FileText }[] = [
  {
    title: "1. Submit your CV",
    text: "Share your experience and the roles you want in Norway.",
    Icon: FileText,
  },
  {
    title: "2. We match you",
    text: "Our team reviews your profile against live employer needs.",
    Icon: UserCheck,
  },
  {
    title: "3. Get placed",
    text: "Interview, contract, and onboarding with employer support.",
    Icon: ClipboardList,
  },
];

export default function ForCandidatesPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="border-b border-[rgba(201,168,76,0.12)] bg-[#0D1B2A] py-14 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-content px-6 text-center md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h1 className="am-h1 font-display font-extrabold tracking-[-0.03em] text-white">Find work in Norway</h1>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              We connect qualified EU/EEA workers with Norwegian employers in construction, logistics, and industry.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="#join-talent"
              className="btn-gold-premium mt-10 inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-3.5 text-[16px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] sm:mx-auto sm:w-auto"
            >
              Join our talent network →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-14 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 font-display font-extrabold text-white">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 md:text-base">
              Three clear steps from your first message to a potential contract.
            </p>
          </ScrollReveal>

          <div className="mt-12 flex flex-col gap-10 md:mt-16 md:grid md:grid-cols-3 md:gap-8 md:gap-y-12 lg:gap-12">
            {HOW_STEPS.map(({ title, text, Icon }) => (
              <ScrollReveal key={title} variant="fadeUp">
                <article className="relative flex flex-col items-center text-center md:block md:text-left">
                  <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)] text-[#C9A84C] md:mb-5"
                    aria-hidden
                  >
                    <Icon size={26} strokeWidth={1.6} />
                  </div>
                  <h3 className="text-lg font-semibold text-white md:text-xl">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65 md:text-[15px]">{text}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.08)] bg-[#0a121c] py-14 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 font-display font-extrabold text-white">What we offer</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/60 md:text-base">
              Practical support areas we focus on with candidates and employers.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {OFFER_CARDS.map((card) => (
              <ScrollReveal key={card.title} variant="fadeUp">
                <article className="flex h-full flex-col rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[#0D1B2A] p-6 md:p-7">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.06)]">
                    <ShieldCheck className="text-[#C9A84C]" size={20} strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-white md:text-lg">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{card.text}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-14 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 font-display font-extrabold text-white">Industries hiring now</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 md:text-base">
              Active sectors we regularly recruit for across Norway.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" className="mt-10">
            <div className="flex flex-wrap justify-center gap-2.5 md:gap-3">
              {INDUSTRY_CHIPS.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[13px] font-medium text-white/90 md:text-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section
        id="join-talent"
        className="scroll-mt-[100px] border-t border-[rgba(201,168,76,0.12)] bg-[#0D1B2A] py-14 text-center md:py-20 lg:py-24"
      >
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 font-display font-extrabold text-white">Ready to start?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/65 md:text-base">
              Leave your email and we will open a conversation about roles that fit your profile.
            </p>
          </ScrollReveal>
          <TalentNetworkJoinForm />
          <ScrollReveal variant="fadeUp">
            <p className="mt-8 text-xs text-white/45">
              Prefer browsing first?{" "}
              <a
                href="https://jobs.arbeidmatch.no"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
              >
                View open positions
              </a>
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-[#0a121c]">
        <CandidateAuthorityDisclaimerBar />
      </section>
    </div>
  );
}
