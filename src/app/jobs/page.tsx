import type { Metadata } from "next";
import { fetchPublicJobs, jobImage, jobUrl, rateLine, type PublicJob } from "@/lib/jobs-fetch";

export const dynamic = "force-dynamic";

/**
 * The open jobs, on the website, where a job seeker would look for them.
 *
 * The ATS keeps the board's data, the apply form, the attribution and the
 * consent, and it stays that way: this page reads `/api/public/jobs` and hands
 * every visitor straight to the ATS job page to read the advert and apply.
 * Publishing a job is one action in one place, and there is one apply flow to
 * keep working.
 *
 * NOT PUBLIC YET. The middleware answers 404 to anybody without the key the
 * owner has in Slack, and the metadata below says `noindex` as well, so a page
 * that ever slips past the gate still does not end up in a search result.
 */

export const metadata: Metadata = {
  title: "Open jobs | ArbeidMatch",
  description: "Open positions in Norway for skilled trades.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

function JobCard({ job }: { job: PublicJob }) {
  const href = jobUrl(job);
  const rate = rateLine(job);
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norge";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={jobImage(job)} alt={job.title} width={1200} height={630} loading="lazy" className="w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-bold leading-snug text-navy">{job.title}</h2>
        <p className="text-sm text-text-secondary">
          {where}
          {job.category ? ` · ${job.category}` : ""}
        </p>
        {/* The rate is the fact somebody reads this page for, so it is the one
            thing set apart. Absent rather than invented when the posting does
            not state one. */}
        {rate ? <p className="text-base font-semibold text-gold">{rate}</p> : null}
        {job.accommodation_provided ? <p className="text-sm text-text-secondary">Bolig inkludert</p> : null}
        <div className="mt-auto pt-4">
          {href ? (
            <a
              href={href}
              className="inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Se stillingen og søk
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function JobsPage() {
  const { jobs, totalOpen, ok } = await fetchPublicJobs();

  return (
    <main className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
      <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Ledige stillinger</p>
      <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold leading-tight tracking-tight text-navy">
        {totalOpen > 0 ? `${totalOpen} ledige stillinger i Norge` : "Ledige stillinger i Norge"}
      </h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-text-secondary">
        Faste og prosjektbaserte stillinger for fagarbeidere. Du søker direkte, og en rådgiver leser hver søknad.
      </p>

      {/* An empty board and an unreachable ATS look identical to a visitor, and
          they are not the same thing to whoever has to fix it. */}
      {!ok ? (
        <p className="mt-10 text-text-secondary">Stillingene kunne ikke hentes akkurat nå. Prøv igjen om litt.</p>
      ) : jobs.length === 0 ? (
        <p className="mt-10 text-text-secondary">Ingen utlyste stillinger akkurat nå.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}
