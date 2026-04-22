import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "International Candidates | ArbeidMatch",
  description:
    "ArbeidMatch candidate registration is for EU and EEA residents. Explore DSB guides and resources for international workers in Norway.",
  robots: { index: false, follow: false },
};

const guides = [
  {
    href: "/electricians-norway?section=dsb",
    title: "DSB authorization guide (electricians)",
    body: "Full public guide, checklist, official links, and paid EU / non-EU deep-dive checkout on one page.",
  },
  {
    href: "/outside-eu-eea",
    title: "Working in Norway (outside EU/EEA)",
    body: "Permits, expectations, and practical first steps for skilled workers from third countries.",
  },
  {
    href: "/dsb-support/eu",
    title: "Purchase: EU/EEA DSB guide",
    body: "Secure checkout for the extended EU/EEA guide (30-day access).",
  },
  {
    href: "/dsb-support/non-eu",
    title: "Purchase: non-EU DSB guide",
    body: "Secure checkout for the extended non-EU guide (30-day access).",
  },
] as const;

export default function NonEuCandidatesPage() {
  return (
    <div className="min-h-dvh bg-[#0D1B2A] text-white">
      <div className="container-site py-12 sm:py-16 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">ArbeidMatch</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.5rem] md:leading-tight">
          International Candidates
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Our candidate profile and application flow is built for people who already live in the{" "}
          <span className="font-semibold text-white">European Union</span> or{" "}
          <span className="font-semibold text-white">European Economic Area</span>. That keeps matching, compliance, and
          employer expectations aligned with how we recruit today.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
          If you are based elsewhere, you can still use the resources below to understand Norwegian requirements and to
          prepare conversations with employers or agencies.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/electricians-norway?section=dsb"
            className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] bg-[#C9A84C] px-8 text-sm font-bold text-[#0D1B2A] shadow-[0_12px_32px_rgba(201,168,76,0.28)] transition-colors hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A] sm:w-auto"
          >
            DSB guide for electricians
          </Link>
          <Link
            href="/for-candidates"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[12px] border border-[#C9A84C]/45 px-6 text-sm font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)] sm:w-auto"
          >
            Back to candidate overview
          </Link>
        </div>

        <section className="mt-14" aria-labelledby="guides-heading">
          <h2 id="guides-heading" className="text-lg font-bold text-white sm:text-xl">
            DSB guides and support
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Premium-style cards link to the main compliance and support areas we maintain for international hiring.
          </p>
          <ul className="mt-8 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <li key={g.href}>
                <Link
                  href={g.href}
                  className="group flex h-full min-h-[160px] flex-col rounded-[18px] border border-[#C9A84C]/22 bg-[linear-gradient(165deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-[#C9A84C]/45 hover:shadow-[0_18px_48px_rgba(0,0,0,0.38)]"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/90">Guide</span>
                  <span className="mt-2 text-base font-bold text-white group-hover:text-[#C9A84C]">{g.title}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{g.body}</span>
                  <span className="mt-4 text-sm font-semibold text-[#C9A84C]">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
