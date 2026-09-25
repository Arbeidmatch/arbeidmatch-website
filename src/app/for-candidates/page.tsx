import type { Metadata } from "next";
import { ClipboardList, FileText, ShieldCheck, UserCheck } from "lucide-react";

import ScrollReveal from "@/components/ScrollReveal";
import { JOBS_PORTAL_URL } from "@/lib/featureFlags";
import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";

export const metadata: Metadata = {
  alternates: { canonical: "/for-candidates" },
  title: { absolute: "Find work in Norway | ArbeidMatch" },
  description:
    "We connect qualified EU/EEA workers with Norwegian employers in construction, logistics, and industry. Browse open positions in Norway through our jobs portal.",
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
  "Construction & Civil Engineering",
  "Welding",
  "Electrical",
  "Production",
  "Logistics",
  "Cleaning",
  "Hospitality",
  "Automotive",
  "Offshore",
  "Fish Industry",
] as const;

const HOW_STEPS: { title: string; text: string; Icon: typeof FileText }[] = [
  {
    title: "1. Browse open jobs",
    text: "Find a job that matches your trade, experience and preferred location.",
    Icon: FileText,
  },
  {
    title: "2. Choose a position",
    text: "Read the requirements, pay and working conditions in the advert.",
    Icon: UserCheck,
  },
  {
    title: "3. Apply for the job",
    text: "We review your application with the client. If selected, we contact you to arrange an interview.",
    Icon: ClipboardList,
  },
];

const DIRECT_COVERAGE: { title: string; description: string }[] = [
  {
    title: "Construction & Civil Engineering",
    description:
      "Building sites, infrastructure works, concrete, formwork, scaffolding, carpentry, and related construction trades — directly employed by ArbeidMatch under Norwegian contracts.",
  },
];

const PARTNER_COVERAGE: { title: string; description: string }[] = [
  {
    title: "Production",
    description: "Manufacturing, assembly lines, metal processing, and production roles on our own contracts.",
  },
  {
    title: "Electrical",
    description: "Installers, technicians, and control roles matched through vetted staffing partners in Norway.",
  },
  {
    title: "Logistics",
    description: "Drivers, warehouse, and supply chain positions via partners who know local rules and routes.",
  },
  {
    title: "Cleaning",
    description: "Commercial cleaning, property services, and facility teams through specialist agencies.",
  },
  {
    title: "Hospitality",
    description: "Hotels, food service, and front-of-house roles with partners focused on compliance.",
  },
  {
    title: "Automotive",
    description: "Workshops, vehicle maintenance, and technical service introductions from trusted partners.",
  },
  {
    title: "Offshore",
    description: "Energy, marine, and industrial site roles coordinated with partners who hold sector experience.",
  },
];

function IndustryCoverageCard({
  title,
  description,
  badge,
  badgeClassName,
}: {
  title: string;
  description: string;
  badge: string;
  badgeClassName: string;
}) {
  return (
    <article
      className="relative rounded-[12px] border border-[rgba(13,27,42,0.1)] bg-white p-6 transition-transform duration-200 hover:-translate-y-[2px]"
      style={{ padding: "24px", borderRadius: "12px" }}
    >
      <span
        className={`absolute right-6 top-6 whitespace-nowrap text-[10px] font-semibold sm:text-[11px] ${badgeClassName}`}
        style={{ borderRadius: "4px", padding: "4px 8px" }}
      >
        {badge}
      </span>
      <h3 className="pr-24 text-base font-semibold leading-snug text-[#0D1B2A] sm:pr-32" style={{ fontWeight: 600 }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#0D1B2A]/75">{description}</p>
    </article>
  );
}

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
            <a
              href={JOBS_PORTAL_URL}
              className="btn-gold-premium mt-10 inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-3.5 text-[16px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] sm:mx-auto sm:w-auto"
            >
              View open jobs →
            </a>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-14 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 font-display font-extrabold text-white">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 md:text-base">
              Find a suitable position and apply in three clear steps.
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

      <section className="border-t border-[rgba(13,27,42,0.08)] bg-surface py-14 md:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="am-h2 font-display font-extrabold tracking-[-0.02em] text-[#0D1B2A]">Industries we cover</h2>
          </ScrollReveal>

          <div className="mt-14 space-y-14 md:mt-16 md:space-y-16">
            <div>
              <ScrollReveal variant="fadeUp">
                <h3 className="text-center font-display text-lg font-bold text-[#0D1B2A] md:text-xl">
                  Direct employment & hire out
                </h3>
                <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#0D1B2A]/75 md:text-[15px]">
                  We hire you directly and place you with our network of Norwegian clients.
                </p>
              </ScrollReveal>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {DIRECT_COVERAGE.map((item) => (
                  <ScrollReveal key={item.title} variant="fadeUp">
                    <IndustryCoverageCard
                      title={item.title}
                      description={item.description}
                      badge="Direct"
                      badgeClassName="bg-[#C9A84C] text-[#0D1B2A]"
                    />
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div>
              <ScrollReveal variant="fadeUp">
                <h3 className="text-center font-display text-lg font-bold text-[#0D1B2A] md:text-xl">
                  Through our partner network
                </h3>
                <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#0D1B2A]/75 md:text-[15px]">
                  We connect you with verified Norwegian recruitment partners specializing in your field.
                </p>
              </ScrollReveal>
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {PARTNER_COVERAGE.map((item) => (
                  <ScrollReveal key={item.title} variant="fadeUp">
                    <IndustryCoverageCard
                      title={item.title}
                      description={item.description}
                      badge="Partner network"
                      badgeClassName="bg-[#0D1B2A] text-[#C9A84C]"
                    />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.08)] bg-navy py-14 md:py-20 lg:py-24">
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
                <article className="flex h-full flex-col rounded-2xl border border-[rgba(201,168,76,0.18)] bg-white/[0.04] p-6 md:p-7">
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
            <h2 className="am-h2 font-display font-extrabold text-white">Find your next job in Norway</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/65 md:text-base">
              Explore open positions, check the requirements and apply for the job that fits your experience.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <a href={JOBS_PORTAL_URL} className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-lg bg-[#C9A84C] px-8 py-3.5 font-semibold text-[#0D1B2A] hover:bg-[#b8953f]">
              View open jobs →
            </a>
            <div className="mx-auto mt-10 max-w-lg border-t border-white/10 pt-7">
              <p className="text-sm text-white/80">No suitable job right now?</p>
              <a href={CANDIDATE_PORTAL_SIGNUP_URL} className="mt-2 inline-flex min-h-[44px] items-center font-semibold text-[#C9A84C] underline-offset-4 hover:underline">Sign Up →</a>
              <p className="mt-2 text-sm leading-relaxed text-white/65">Save your experience and CV in your profile. Creating a profile does not apply you for a job. Apply separately from the position you choose.</p>
              <p className="mt-5 text-sm text-white/65">Already have a profile? <a href={CANDIDATE_PORTAL_LOGIN_URL} className="inline-flex min-h-[44px] items-center text-[#C9A84C] hover:underline">Sign in</a></p>
              <div className="mt-7 border-t border-white/10 pt-6"><p className="text-sm text-white/80">Prefer to hear about new jobs by email?</p><a href="/newsletter#candidates" className="mt-2 inline-flex min-h-[44px] items-center font-semibold text-[#C9A84C] hover:underline">Choose your job alerts →</a><p className="text-xs text-white/60">Optional and free. No profile needed.</p></div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
