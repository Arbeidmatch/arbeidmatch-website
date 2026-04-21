import Link from "next/link";

export const metadata = { robots: "noindex, nofollow" };

const benefits = [
  {
    title: "Access to Candidate Profiles",
    text: "Browse anonymized candidate profiles filtered by trade and role. See experience, availability, languages, and more.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.8" />
        <path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Search When You Need",
    text: "No waiting for a recruiter to call back. Access the platform on your schedule and find candidates at your own pace.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Secure and Private",
    text: "All data is handled with full GDPR compliance. Candidate contact details are only shared after mutual agreement.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
        <path d="M12 3 5 6v6c0 4.5 3.1 8.8 7 10 3.9-1.2 7-5.5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Dedicated Support",
    text: "Our team is available to help you find the right candidate and guide you through the process from start to finish.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
        <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 19c.8-2.6 3-4 6-4s5.2 1.4 6 4M12.5 19c.6-2 2.1-3.1 4.5-3.1 2.2 0 3.6 1.1 4 3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "EU and EEA Candidates",
    text: "We work with candidates from across Europe with verified work eligibility for Norway.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
        <path d="m12 3 2.7 5.6 6.2.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1L3 9.5l6.2-.9L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Early Partner Advantage",
    text: "Partners who join now get full platform access during our beta phase and will be first to receive new features.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
        <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function BecomePartnerPage() {
  return (
    <section className="min-h-dvh bg-[#0D1B2A] px-6 py-20 text-white">
      <div className="mx-auto w-full max-w-[900px]">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.06)] px-[14px] py-1 text-[11px] tracking-[0.1em] text-[#C9A84C]">
            Partner Program
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.2] md:text-5xl">
            Work with ArbeidMatch.
            <br />
            <span className="text-[#C9A84C]">Access talent when you need it.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-base leading-[1.7] text-[rgba(255,255,255,0.6)]">
            We connect Norwegian employers with qualified EU and EEA candidates. As a partner, you get direct access to our candidate
            platform and dedicated support from our team.
          </p>
        </div>

        <div className="mx-auto my-12 h-px w-20 bg-[linear-gradient(to_right,transparent,rgba(201,168,76,0.4),transparent)]" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-[16px] border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.03)] p-[28px_24px] transition-all duration-[220ms] hover:border-[rgba(201,168,76,0.35)] hover:bg-[rgba(201,168,76,0.04)]"
            >
              {benefit.icon}
              <h2 className="mt-4 text-lg font-semibold text-white">{benefit.title}</h2>
              <p className="mt-3 text-sm leading-[1.7] text-[rgba(255,255,255,0.6)]">{benefit.text}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto my-12 h-px w-20 bg-[linear-gradient(to_right,transparent,rgba(201,168,76,0.4),transparent)]" />

        <div className="text-center">
          <span className="inline-flex rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.06)] px-[14px] py-1 text-[11px] tracking-[0.1em] text-[rgba(255,255,255,0.5)]">
            Currently in beta
          </span>
          <p className="mx-auto mt-4 max-w-[480px] text-sm leading-[1.7] text-[rgba(255,255,255,0.5)]">
            We are currently onboarding a limited number of partners. Pricing and packages will be announced soon. Partners joining now
            get full access at no cost during the beta period.
          </p>
        </div>

        <div className="mx-auto my-12 h-px w-20 bg-[linear-gradient(to_right,transparent,rgba(201,168,76,0.4),transparent)]" />

        <div className="text-center">
          <h2 className="text-[28px] font-bold text-white">Ready to get started?</h2>
          <p className="mt-2 text-[15px] text-[rgba(255,255,255,0.55)]">Send us a message and we will get back to you within 1 to 2 business days.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#C9A84C] px-9 py-4 text-[15px] font-bold text-[#0D1B2A] sm:w-auto"
            >
              Contact us
            </Link>
            <Link
              href="/request"
              className="inline-flex w-full items-center justify-center rounded-[12px] border border-[rgba(201,168,76,0.25)] bg-transparent px-9 py-4 text-[15px] text-[rgba(255,255,255,0.6)] sm:w-auto"
            >
              Back to search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
