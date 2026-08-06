import type { Metadata } from "next";
import { fetchPublicJobs, jobEmployerLabel, jobImage, jobUrl, type PublicJob } from "@/lib/jobs-fetch";

export const dynamic = "force-dynamic";

/**
 * The open jobs, on the website, where a job seeker would look for them.
 *
 * IN ENGLISH, like the ATS board it links into. The rest of this site speaks
 * Norwegian because it is addressed to employers; this page is addressed to
 * tradesmen across the EEA who found us through the bot, and we ask them for a
 * CV in English. It was written in Norwegian first, which was the site's habit
 * rather than a thought about who is reading it.
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
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norway";
  // Who employs the reader: us on most of these, a client on some. Never
  // "Confidential employer", which described neither.
  const employer = jobEmployerLabel(job);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:shadow-md">
      {/* One shape for every card. These photographs come from the source board
          and are not all the same proportions, so a plain image made one advert
          tall and the next short and the grid read as a scrapbook. */}
      <div className="relative aspect-[1200/630] w-full overflow-hidden bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={jobImage(job)} alt={job.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* Two lines always, so the rate and the button stay in step across a
            row whatever the trade is called. */}
        <h2 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-snug text-navy">{job.title}</h2>
        <p className="truncate text-sm text-text-secondary">{employer}</p>
        <p className="truncate text-sm text-text-secondary">
          {where}
          {job.category ? ` · ${job.category}` : ""}
        </p>
        {/*
          NO NUMBER ON THE CARD, by his decision of 6 August 2026: "sa nu fie
          specificat salariul ci numai inauntru... ca sa i atragem inauntru nu sa ramana
          pe dinafara."

          A rate printed here is a decision taken from outside, on the one fact a list
          cannot put in context: 250 an hour with accommodation arranged and rotation
          paid is a different job from 250 without either, and a card has no room to say
          so. The line keeps its place in the grid, because an empty slot on one card and
          a filled one on the next is what breaks a row, and spends it on the reason to
          open the advert instead.

          What it must never say is "on request". That reads as something withheld, and
          it is the same mistake this page already corrected about the employer.
        */}
        <p className="text-base font-semibold text-gold">Rate, shift and accommodation inside</p>
        <p className="text-sm text-text-secondary">
          {/* His rule: "accommodation provided" is for housing that is free. Where it is
              arranged and paid for, we help with it. */}
          {job.accommodation_provided ? "Help with accommodation" : " "}
        </p>
        <div className="mt-auto pt-4">
          {href ? (
            <a
              href={href}
              className="inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              See the job and apply
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
      <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Open jobs</p>
      <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold leading-tight tracking-tight text-navy">
        {totalOpen > 0 ? `${totalOpen} open jobs in Norway` : "Open jobs in Norway"}
      </h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-text-secondary">
        Permanent and project work for skilled trades. You apply directly, and a recruiter reads every application.
      </p>

      {/* An empty board and an unreachable ATS look identical to a visitor, and
          they are not the same thing to whoever has to fix it. */}
      {!ok ? (
        <p className="mt-10 text-text-secondary">The jobs could not be loaded just now. Please try again shortly.</p>
      ) : jobs.length === 0 ? (
        <p className="mt-10 text-text-secondary">No open jobs at the moment.</p>
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
