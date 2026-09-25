import Link from "next/link";
import { CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";

export function ForsidenDoors({ lang = "en" }: { lang?: "en" | "no" }) {
  const no = lang === "no";
  const steps = no ? [
    { title: "Finn en stilling", text: "Se jobber som passer faget og erfaringen din.", href: "/jobs" },
    { title: "Sign Up", text: "Fortell oss om erfaringen din og legg til CV-en din.", href: CANDIDATE_PORTAL_SIGNUP_URL },
    { title: "Send søknaden", text: "Les kravene i annonsen og søk på stillingen.", href: "/jobs" },
  ] : [
    { title: "Find a role", text: "Explore jobs that match your trade and experience.", href: "/jobs" },
    { title: "Sign Up", text: "Tell us about your experience and add your CV.", href: CANDIDATE_PORTAL_SIGNUP_URL },
    { title: "Apply for the job", text: "Check the requirements in the advert and send your application.", href: "/jobs" },
  ];
  return <>
    <section className="bg-navy text-white">
      <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-6 px-5 py-9 sm:px-6 md:flex-row md:items-center md:py-11">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">{no ? "For bedrifter" : "For employers"}</p>
          <h2 className="text-2xl font-bold md:text-3xl">{no ? "Trenger du folk til teamet?" : "Need people for your team?"}</h2>
          <p className="mt-3 text-sm text-white/75">{no ? "Rekruttering, bemanning og stillingsannonser." : "Recruitment, staffing and job advertising."}</p></div>
        <Link href="/request" className="inline-flex min-h-12 shrink-0 items-center gap-5 rounded-lg bg-gold px-6 font-bold text-navy hover:bg-gold-hover">{no ? "Be om kandidater" : "Request candidates"} <span aria-hidden="true">→</span></Link>
      </div>
    </section>
    <section className="mx-auto max-w-content px-5 py-10 sm:px-6 md:py-14">
      <h2 className="text-2xl font-bold text-navy md:text-3xl">{no ? "Slik kommer du i gang" : "Your next step starts here"}</h2>
      <ol className="mt-7 grid gap-7 md:grid-cols-3">{steps.map((step, index) => <li key={step.title} className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-ink">{index + 1}</span>
        <div><Link href={step.href} className="font-bold text-navy underline-offset-4 hover:underline">{step.title}</Link><p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.text}</p></div>
      </li>)}</ol>
    </section>
  </>;
}
