import Link from "next/link";
import { ForsidenJobCard } from "@/components/home/ForsidenJobCard";
import { JobPostingJsonLd } from "@/components/seo/JobPostingJsonLd";
import { CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import type { PublicJob } from "@/lib/jobs-fetch";
import { signupPlacement } from "@/lib/jobs-signup-placement";

/** The way in for somebody whose job is not on the board yet. */
function SignupSection({ className = "" }: { className?: string }) {
  return (
    <section
      aria-labelledby="jobs-signup-heading"
      className={`flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between md:p-8 ${className}`}
    >
      <div>
        <h2 id="jobs-signup-heading" className="text-xl font-bold text-navy">
          Sign up for the next job
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-text-secondary">
          Tell us about your trade once, and we contact you when a job that fits you opens.
        </p>
      </div>
      <a
        href={CANDIDATE_PORTAL_SIGNUP_URL}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center self-start rounded-[6px] bg-gold px-5 py-2 text-[14px] font-semibold text-navy transition-colors hover:bg-gold-hover sm:self-center"
      >
        Sign Up
      </a>
    </section>
  );
}

/**
 * One list of adverts, drawn the same way wherever it appears.
 *
 * The front page, /jobs and every trade-and-town page show the same cards, and
 * that is deliberate rather than lazy: a person who lands on "Carpenter jobs in
 * Bergen" from a search and then presses through to the whole board should not
 * feel they have arrived somewhere else. The card is `ForsidenJobCard`, so the
 * mark on the photograph, the reference and the line about who employs are the
 * same on all of them.
 *
 * The markup travels with the list. A page listing four carpenter adverts
 * carries those four as JobPosting, which is what makes it citable on its own
 * rather than only as a route into the front page.
 *
 * THE SURFACE, corrected 6 September 2026. The heading was `text-navy` and the
 * lede `#555`, both written for a light page - but nothing here supplied one,
 * so they landed on the site's own `#0D1B2A` body. "Open jobs in Norway" was
 * navy on navy at 1.00:1 on /jobs and on every trade-and-town page under it,
 * which is where the search traffic arrives. Same fault as the advert page had,
 * and it takes the same shape now: a navy band that carries on from the navbar,
 * then the white sheet the cards were always drawn for.
 */
export function JobsListing({
  jobs,
  ok,
  heading,
  lede,
  related,
  signup = false,
}: {
  jobs: PublicJob[];
  ok: boolean;
  heading: string;
  lede: string;
  /** Neighbouring pages that also have adverts on them. Never a dead link. */
  related?: Array<{ href: string; label: string; count: number }>;
  /** Show the Sign Up section, above or after the list by `signupPlacement`. */
  signup?: boolean;
}) {
  const placement = signup ? signupPlacement(jobs.length) : null;
  return (
    <main>
      <JobPostingJsonLd jobs={jobs} />

      <header className="bg-navy">
        <div className="mx-auto w-full max-w-content px-6 py-10 md:px-12 md:py-14 lg:px-20">
          <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Open jobs</p>
          <h1 className="am-h-advert mt-3 max-w-[760px] font-extrabold text-white">{heading}</h1>
          <p className="mt-4 max-w-3xl leading-relaxed text-white/70">{lede}</p>
        </div>
      </header>

      <div className="bg-white">
        <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
          {placement === "above" ? <SignupSection className="mb-10" /> : null}
          {/* An empty board and an unreachable ATS look identical to a visitor,
              and they are not the same thing to whoever has to fix it. */}
          {!ok ? (
            <p className="text-text-secondary">The jobs could not be loaded just now. Please try again shortly.</p>
          ) : jobs.length === 0 ? (
            <p className="text-text-secondary">
              Nothing open here at the moment.{" "}
              <Link
                href="/jobs"
                className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
              >
                See every open job
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <ForsidenJobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {placement === "below" ? <SignupSection className="mt-12" /> : null}

          {related && related.length > 0 ? (
            <nav className="mt-12 border-t border-border pt-6" aria-label="Other open lists">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">Also open</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {related.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm text-navy transition hover:border-gold"
                    >
                      {item.label} <span className="ml-1 font-semibold text-gold-ink">{item.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </main>
  );
}
