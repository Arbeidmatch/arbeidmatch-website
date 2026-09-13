import Image from "next/image";
import Link from "next/link";
import { ForsidenDoors } from "@/components/home/ForsidenDoors";
import { ForsidenJobCard } from "@/components/home/ForsidenJobCard";
import { IndustryStrip } from "@/components/home/IndustryStrip";
import { JobSearchBar } from "@/components/home/JobSearchBar";
import { ForsidenFaq, ForsidenFaqJsonLd } from "@/components/seo/ForsidenFaqJsonLd";
import { JobPostingJsonLd, OrganizationJsonLd } from "@/components/seo/JobPostingJsonLd";
import { getBoard } from "@/lib/jobs-facets";

const COPY = {
  en: {
    headline: "Your next job", emphasis: "in Norway.", lede: "Find work that matches your trade.",
    search: { role: "Your trade", rolePlaceholder: "e.g. carpenter, mechanic", where: "Location", everywhere: "All of Norway", company: "Company, optional", companyPlaceholder: "any", search: "Find jobs" },
    open: "Open positions", all: "View all jobs", results: "open positions",
    error: "The job list could not be loaded. Please try again shortly, or contact us.",
    empty: "No positions are open right now. You can create a profile to tell us about your trade.",
    requirement: "For qualified tradespeople from the EU and EEA",
  },
  no: {
    headline: "Din neste jobb", emphasis: "i Norge.", lede: "Finn arbeid som passer faget ditt.",
    search: { role: "Ditt fag", rolePlaceholder: "f.eks. tømrer, mekaniker", where: "Sted", everywhere: "Hele Norge", company: "Bedrift, valgfritt", companyPlaceholder: "alle", search: "Finn jobber" },
    open: "Ledige stillinger", all: "Se alle jobber", results: "ledige stillinger",
    error: "Stillingslisten kunne ikke lastes. Prøv igjen snart, eller kontakt oss.",
    empty: "Ingen stillinger er ledige akkurat nå. Opprett en profil og fortell oss om faget ditt.",
    requirement: "For kvalifiserte fagfolk fra EU og EØS",
  },
} as const;

export async function Forsiden({ lang = "en" }: { lang?: "en" | "no" }) {
  const { jobs, totalOpen, industries, locations, ok } = await getBoard();
  const copy = COPY[lang];
  return (
    <div className="bg-white text-navy">
      <OrganizationJsonLd openJobs={totalOpen} />
      <JobPostingJsonLd jobs={jobs} />
      <ForsidenFaqJsonLd />
      <section className="relative isolate overflow-hidden bg-navy">
        <div className="absolute inset-y-0 right-0 -z-20 hidden w-[60%] md:block">
          <Image src="/images/home/carpenter-watermarked.webp" alt="" fill priority sizes="60vw" className="object-contain object-right" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/95 to-navy/10" />
        <div className="mx-auto max-w-content px-5 py-6 sm:px-6 md:py-12">
          <p className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.16em] text-gold md:block">ArbeidMatch</p>
          <h1 className="max-w-2xl text-[34px] font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-white">{copy.headline}</span><br /><span className="text-gold">{copy.emphasis}</span>
          </h1>
          <p className="mt-3 text-base text-white/85 md:text-lg">{copy.lede}</p>
          <JobSearchBar locations={locations} resultsCount={totalOpen} labels={copy.search} compact />
          <p className="mt-4 text-xs text-white/75">{copy.requirement}</p>
          <IndustryStrip industries={industries} lang={lang} compact />
        </div>
      </section>
      <section id="open-jobs" className="mx-auto max-w-content px-5 py-6 sm:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-2xl font-bold tracking-tight md:text-3xl">{copy.open}</h2>
            {ok && <p className="mt-2 text-sm text-text-secondary">{totalOpen} {copy.results}</p>}
          </div>
          <Link href="/jobs" className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-gold-ink hover:underline">{copy.all} <span aria-hidden="true">→</span></Link>
        </div>
        {!ok || jobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-text-secondary">
            <p>{!ok ? copy.error : copy.empty}</p>
            <Link href={!ok ? "/contact" : "/candidate-request"} className="mt-3 inline-block font-semibold text-gold-ink underline">{!ok ? (lang === "en" ? "Contact us" : "Kontakt oss") : (lang === "en" ? "Create profile" : "Opprett profil")}</Link>
          </div>
        ) : (
          <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.slice(0, 6).map((job) => <ForsidenJobCard key={job.id} job={job} lang={lang} />)}
          </div>
        )}
        {jobs.length > 6 && <div className="mt-7 text-center"><Link href="/jobs" className="inline-flex min-h-12 items-center rounded-lg border border-navy px-6 font-semibold hover:bg-surface">{copy.all} ({totalOpen}) →</Link></div>}
      </section>
      <ForsidenDoors lang={lang} />
      <div className="mx-auto max-w-content"><ForsidenFaq /></div>
    </div>
  );
}
