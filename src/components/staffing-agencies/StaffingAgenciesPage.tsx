import Link from "next/link";

const WHAT_WE_DO = [
  {
    title: "Sourcing & Screening",
    text: "We find qualified candidates through our EU/EEA network and pre-screen them against your role requirements.",
  },
  {
    title: "Automated Workflow",
    text: "The process stays streamlined from brief to shortlist, so you step in at interview stage and final decision.",
  },
  {
    title: "More Time For Clients",
    text: "Spend less time on sourcing admin and more time strengthening client relationships and closing new contracts.",
  },
] as const;

const TIMELINE_STEPS = [
  "You send us the brief",
  "We source & pre-screen",
  "You interview shortlisted candidates",
  "Placement confirmed",
] as const;

const ALSO_AVAILABLE = [
  "Advertising across ArbeidMatch channels",
  "Optional co-branding support",
  "Premium website setup for your agency",
  "AI and automation implementation",
] as const;

export default function StaffingAgenciesPage() {
  return (
    <div className="bg-[#0f1923] text-white">
      <section className="border-b border-[rgba(201,168,76,0.2)] px-6 py-16 md:px-12 md:py-24 lg:px-20 lg:py-28">
        <div className="mx-auto max-w-content">
          <p className="am-eyebrow text-center font-semibold uppercase tracking-[0.14em] text-[#C9A84C] lg:text-left">
            For Recruitment Agencies & Independent Recruiters
          </p>
          <h1 className="am-h1 mx-auto mt-5 max-w-4xl text-center font-extrabold leading-tight text-white lg:mx-0 lg:text-left">
            Scale Your Recruitment. Faster.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-white/75 lg:mx-0 lg:text-left">
            We handle sourcing so you can focus on clients and placements.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-content">
          <h2 className="am-h2 text-center font-bold text-white">What We Do For You</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_DO.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.03)] p-7 transition-colors duration-200 hover:border-[#C9A84C]"
              >
                <div className="h-1.5 w-12 rounded-full bg-[#C9A84C]" aria-hidden />
                <h3 className="am-h3 mt-5 font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.16)] px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-content">
          <h2 className="am-h2 text-center font-bold text-white">How It Works</h2>
          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
            {TIMELINE_STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-xl border border-[rgba(201,168,76,0.24)] bg-[rgba(255,255,255,0.02)] px-5 py-4 text-white/80"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9A84C] text-sm font-bold text-[#0f1923]">
                  {index + 1}
                </span>
                <span className="text-sm font-medium leading-relaxed md:text-base">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.16)] px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto max-w-content">
          <h2 className="am-h2 text-center font-bold text-white">Also Available</h2>
          <ul className="mx-auto mt-8 max-w-3xl space-y-3">
            {ALSO_AVAILABLE.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <Link
            href="/become-a-partner"
            className="btn-gold-premium mx-auto mt-12 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 text-sm font-semibold text-white hover:bg-gold-hover sm:w-auto"
          >
            Become a Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
