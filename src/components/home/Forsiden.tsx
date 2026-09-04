import Link from "next/link";
import { BeforeYouGo } from "@/components/home/BeforeYouGo";
import { ForsidenDoors } from "@/components/home/ForsidenDoors";
import { ForsidenJobCard } from "@/components/home/ForsidenJobCard";
import { IndustryStrip } from "@/components/home/IndustryStrip";
import { JobSearchBar } from "@/components/home/JobSearchBar";
import { ForsidenFaq, ForsidenFaqJsonLd } from "@/components/seo/ForsidenFaqJsonLd";
import { JobPostingJsonLd, OrganizationJsonLd } from "@/components/seo/JobPostingJsonLd";
import { CANDIDATE_PORTAL_LOGIN_URL } from "@/lib/candidatePortal";
import { getBoard } from "@/lib/jobs-facets";
import { jobCardImage, type PublicJob } from "@/lib/jobs-fetch";

/**
 * The front page answers one question in its first second: what jobs have you got?
 *
 * Not who we are. The search is the first thing on the screen and under it are
 * the adverts with their real photographs, the ones people already see on
 * Facebook. What used to be here talked about the company while the jobs lived
 * on a different host entirely, so a visitor looking for work - and an
 * assistant asked about work in Norway - found a brochure.
 *
 * ENGLISH IS THE DEFAULT, and that is a decision about who is reading. The
 * person looking for work arrives from the EEA and does not read Norwegian yet.
 * Norwegian is second, for the companies here and for the ones already settled.
 *
 * NOTHING ON THIS PAGE SAYS THE WORK IS PERMANENT. Of the postings open on
 * 2 September, three said permanent and six said nothing at all. What each job
 * is belongs in that job's advert, put there by the company hiring. Some
 * projects run to a term, and there is nothing to guarantee before we know.
 */

type Lang = "en" | "no";

/**
 * The town chips lead to the town's own page, not to a query string the list
 * ignores. Slugged the same way lib/jobs-facets does it, including the three
 * Norwegian letters, so a chip and its page cannot disagree.
 */
function townSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const COPY = {
  en: {
    headline: "There is work in Norway",
    headlineEm: "for people with a trade.",
    lede:
      "Building and civil works, industry and manufacturing, electrical installation, and car workshops. What each job runs on, and for how long, is written in the advert itself.",
    search: {
      role: "What role",
      rolePlaceholder: "car mechanic",
      where: "Where",
      everywhere: "All of Norway",
      company: "Company, optional",
      companyPlaceholder: "any",
      search: "Search",
    },
    openPositions: "Open positions",
    resultsSuffix: "updated today",
    eu: "EU/EEA passport required",
    seeAll: "See every open job",
  },
  no: {
    headline: "Det finnes arbeid i Norge",
    headlineEm: "for folk med fagbrev.",
    lede:
      "Bygg og anlegg, industri og produksjon, elektro og bilverksted. Hva hver jobb går på, og hvor lenge, står i annonsen selv.",
    search: {
      role: "Hvilken rolle",
      rolePlaceholder: "bilmekaniker",
      where: "Hvor",
      everywhere: "Hele Norge",
      company: "Bedrift, valgfritt",
      companyPlaceholder: "hvilken som helst",
      search: "Søk",
    },
    openPositions: "Ledige stillinger",
    resultsSuffix: "oppdatert i dag",
    eu: "EU/EØS-pass kreves",
    seeAll: "Se alle ledige jobber",
  },
} as const;

export async function Forsiden({ lang = "en" }: { lang?: Lang }) {
  // Five minutes. The board does not change between one visitor and the next,
  // and a round trip to the ATS in front of every visit is a round trip in
  // front of every visit.
  const { jobs, totalOpen, industries, locations, ok } = await getBoard();
  const copy = COPY[lang];

  // The advert at the top is the widest one, and today that is simply the one
  // with the most interest on it. When a company buys a featured listing this
  // is where it goes; until then the page does not pretend one is sold.
  const featured = jobs.length > 0 ? jobs.reduce((best, job) => ((job.public_views ?? 0) > (best.public_views ?? 0) ? job : best)) : null;
  const rest = featured ? jobs.filter((job) => job.id !== featured.id) : jobs;

  const other = lang === "en" ? { href: "/no", label: "NO" } : { href: "/", label: "EN" };

  return (
    <div className="bg-white">
      {/* Invisible, changes nothing on the page, and is the whole difference
          between a company website and something a machine can quote. */}
      <OrganizationJsonLd openJobs={totalOpen} />
      <JobPostingJsonLd jobs={jobs} />
      <ForsidenFaqJsonLd />

      {/* The two doors and the language, on one line. Log in is the candidate
          portal in the ATS, and a company enters through Post a job or through
          its own workspace link.

          This page had the destination right by hand and every other login on
          the site had it wrong. All of them read one constant now, and it is
          the constant that moved - see lib/candidatePortal. */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-border px-6 py-3">
        <div className="inline-flex overflow-hidden rounded border border-border text-[11px] font-semibold">
          <span className="bg-gold/15 px-3 py-1.5 text-gold">{lang === "en" ? "EN" : "NO"}</span>
          <a href={other.href} className="px-3 py-1.5 text-text-secondary transition hover:text-navy">
            {other.label}
          </a>
        </div>
        <a
          href={CANDIDATE_PORTAL_LOGIN_URL}
          className="rounded border border-border px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold"
        >
          {lang === "en" ? "Log in" : "Logg inn"}
        </a>
        <Link
          href="/request"
          className="rounded bg-gold px-4 py-2 text-sm font-bold text-navy transition hover:bg-gold-hover"
        >
          {lang === "en" ? "Post a job" : "Legg ut en jobb"}
        </Link>
      </div>

      <section className="relative isolate overflow-hidden">
        {featured ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={jobCardImage(featured)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 h-full w-full object-cover"
            />
            {/* Text on a photograph needs a scrim, and a warm one so the page
                and the adverts belong to the same world. */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/40" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-navy" />
        )}

        <div className="mx-auto max-w-content px-6 py-16">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            {copy.headline} <span className="text-gold">{copy.headlineEm}</span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] text-white/80">{copy.lede}</p>

          <JobSearchBar locations={locations} resultsCount={totalOpen} labels={copy.search} />

          <div className="mt-5 flex flex-wrap gap-2">
            {locations.slice(0, 4).map((location) => (
              <a
                key={location.name}
                href={`/jobs/${townSlug(location.name)}`}
                className="rounded-full border border-white/25 bg-navy/40 px-3 py-1.5 text-xs text-white/85 transition hover:border-gold"
              >
                {location.name} <span className="font-semibold text-gold">{location.count}</span>
              </a>
            ))}
            <span className="rounded-full border border-white/25 bg-navy/40 px-3 py-1.5 text-xs text-white/85">
              {copy.eu}
            </span>
          </div>
        </div>
      </section>

      <IndustryStrip industries={industries} lang={lang} />

      <section className="mx-auto max-w-content px-6 py-10">
        <div className="mb-5 flex flex-wrap items-baseline gap-3">
          <h2 className="text-2xl font-bold text-navy">{copy.openPositions}</h2>
          <span className="text-xs text-text-secondary">
            {totalOpen} {totalOpen === 1 ? "result" : "results"} &middot; {copy.resultsSuffix}
          </span>
          <Link href="/jobs" className="ml-auto text-sm font-semibold text-gold hover:underline">
            {copy.seeAll}
          </Link>
        </div>

        {!ok ? (
          // The board could not be read. Said plainly rather than drawn as an
          // empty list, which would read as "no work in Norway".
          <p className="rounded-lg border border-border p-6 text-sm text-text-secondary">
            The job list could not be loaded just now. Try again in a moment, or write to us and we will tell you what is
            open.
          </p>
        ) : jobs.length === 0 ? (
          <p className="rounded-lg border border-border p-6 text-sm text-text-secondary">
            Nothing is open at this minute. Leave a profile and we write when something fits your trade.
          </p>
        ) : (
          <>
            {featured ? (
              <div className="mb-4">
                <ForsidenJobCard job={featured} featured />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rest.map((job) => (
                <ForsidenJobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        )}
      </section>

      <ForsidenDoors />

      <div className="mx-auto max-w-content">
        <ForsidenFaq />
      </div>

      {/* The panel that appears when somebody is leaving, once per session, and
          only when there is something true to say to them. */}
      <BeforeYouGo trades={tradesForPanel(jobs)} />
    </div>
  );
}

/**
 * What the leaving panel is allowed to say, computed from the real board.
 *
 * Every number in that panel is the count of open positions on the trade the
 * visitor searched for. "3 car mechanic jobs are open right now" is a fact; a
 * panel that says "jobs available!" is an advertisement, and the whole reason
 * this one is worth showing is that it is not one.
 */
function tradesForPanel(jobs: PublicJob[]): Array<{ label: string; count: number; several: string | null }> {
  const byTrade = new Map<string, { count: number; several: string | null }>();
  for (const job of jobs) {
    const trade = (job.category ?? "").trim();
    if (!trade) continue;
    const current = byTrade.get(trade) ?? { count: 0, several: null };
    current.count += 1;
    // "One of them takes several people in Strømmen" is only said when a
    // posting really is for more than one person.
    if (!current.several && /several|multiple|flere/i.test(job.title)) {
      current.several = (job.location ?? "").trim() || null;
    }
    byTrade.set(trade, current);
  }
  return [...byTrade.entries()].map(([label, info]) => ({ label, ...info }));
}
