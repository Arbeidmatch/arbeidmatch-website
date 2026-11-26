import Link from "next/link";

import { Icon } from "@/components/site/Icon";
import { JobPostingJsonLd } from "@/components/seo/JobPostingJsonLd";
import { jobCardImage, jobUrl, rateLine, type PublicJob } from "@/lib/jobs-fetch";
import { signupPlacement } from "@/lib/jobs-signup-placement";
import { mergeNewestFirst } from "@/lib/market-jobs/pure";
import type { MarketSiteCard } from "@/lib/market-jobs/types";
import { MarketJobCard } from "./MarketJobCard";

/**
 * The way in for somebody whose job is not on the board yet: the closing band
 * of the approved mockup (ORDER 295, stage 3). The profile and the alerts open
 * as sheets over the page; the profile sheet sends the same request the
 * /candidate-register page sends.
 */
function SignupBand() {
  return (
    <section className="sec" style={{ background: "var(--sage)" }} aria-labelledby="jobs-signup-heading">
      <div className="w close">
        <div>
          <h2 id="jobs-signup-heading" className="h3">
            Sign up for the next job
          </h2>
          <p>Tell us about your trade once, and we contact you when a job that fits you opens.</p>
        </div>
        <div className="close-acts">
          <button type="button" className="btn ghost" data-sheet="register">
            Create your profile
          </button>
          <button type="button" className="btn gold" data-sheet="alerts">
            Choose your job alerts
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * One job card of the approved mockup: the advert's own photo filling the
 * frame, the trade, the title, where and who employs, the pay, and the whole
 * card one link to the advert.
 */
export function JobCard({ job }: { job: PublicJob }) {
  const href = jobUrl(job);
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norway";
  const rate = rateLine(job);
  // HIS WORDS, 4 October 2026: the card never names the client, so it says what the reader can know.
  const employs = job.engagement === "staffing" ? "Employed by ArbeidMatch" : job.engagement === "recruitment" ? "Network partner" : null;
  const dsb = job.public_requires_dsb || job.industry === "electrical";
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="jc-ph" src={jobCardImage(job)} alt="" loading="lazy" />
      <span className="jc-b">
        <span className="eb">{job.category || "Open position"}</span>
        <h3>{job.title}</h3>
        <p>{[where, employs].filter(Boolean).join(" · ")}</p>
        <span className="jc-m">EU/EEA{dsb ? " · DSB certified" : ""}</span>
        <span className="jc-f">
          <span>{rate ?? "Pay in the advert"}</span>
          <Icon name="arrow" />
        </span>
      </span>
    </>
  );
  return href ? (
    <a className="jc" href={href}>
      {body}
    </a>
  ) : (
    <div className="jc">{body}</div>
  );
}

type Pill = { href: string; label: string; count: number };

/** How many neighbouring lists sit in the filter row; the rest stay linked under the list. */
const FILTER_PILLS = 5;

/**
 * One list of adverts, drawn the same way wherever it appears: /jobs and every
 * trade-and-town page under it (ORDER 295, stage 3, from the approved mockup).
 * The list comes first, with the filters as pills that are links to the
 * trade-and-town pages, so a filtered list keeps its own address. The markup
 * travels with the list: a page listing four carpenter adverts carries those
 * four as JobPosting.
 */
export function JobsListing({
  jobs,
  ok,
  heading,
  lede,
  related,
  current,
  total,
  signup = false,
  marketJobs = [],
  marketPrivateTest = false,
}: {
  jobs: PublicJob[];
  ok: boolean;
  heading: string;
  lede: string;
  /** Neighbouring pages that also have adverts on them. Never a dead link. */
  related?: Pill[];
  /** The trade-and-town page this list is, shown as the chosen pill. */
  current?: Pill;
  /** Every open job, for the "All" pill. */
  total?: number;
  /** Show the sign-up band, above or after the list by `signupPlacement`. */
  signup?: boolean;
  /**
   * Jobs from the Norwegian market (ORDER 514), mixed in newest first. Empty for
   * every visitor while the owner's Go public switch is off. They are never in
   * the JobPosting markup: those pages are not indexed until Go public.
   */
  marketJobs?: MarketSiteCard[];
  /** The ATS said this list is a private test: every market card says so. */
  marketPrivateTest?: boolean;
}) {
  const entries = mergeNewestFirst(jobs, marketJobs, (job) => job.published_at ?? job.created_at);
  const placement = signup ? signupPlacement(entries.length) : null;
  const pills = (related ?? []).slice(0, FILTER_PILLS);
  const more = (related ?? []).slice(FILTER_PILLS);
  return (
    <main className="ams page" lang="en">
      <JobPostingJsonLd jobs={jobs} />

      <section className="dark band">
        <div className="w">
          <span className="eb">Open jobs</span>
          <h1>{heading}</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            {lede}
          </p>
        </div>
      </section>

      {placement === "above" ? <SignupBand /> : null}

      <section className="sec">
        <div className="w">
          <nav className="pills" style={{ marginTop: 0 }} aria-label="Filter jobs">
            <Link className={`pill${current ? "" : " on"}`} href="/jobs" aria-current={current ? undefined : "page"}>
              All{typeof total === "number" && total > 0 ? <b>{total}</b> : null}
            </Link>
            {current ? (
              <Link className="pill on" href={current.href} aria-current="page">
                {current.label} <b>{current.count}</b>
              </Link>
            ) : null}
            {pills.map((p) => (
              <Link key={p.href} className="pill" href={p.href}>
                {p.label} <b>{p.count}</b>
              </Link>
            ))}
          </nav>
          {/* An empty board and an unreachable ATS look identical to a visitor,
              and they are not the same thing to whoever has to fix it. */}
          {!ok ? (
            <p className="jl-note">The jobs could not be loaded just now. Please try again shortly.</p>
          ) : entries.length === 0 ? (
            <p className="jl-note">
              Nothing open here at the moment. <Link href="/jobs">See every open job</Link>.
            </p>
          ) : (
            <div className="jgrid">
              {entries.map((entry) =>
                entry.kind === "own" ? (
                  <JobCard key={entry.job.id} job={entry.job} />
                ) : (
                  <MarketJobCard key={entry.card.id} card={entry.card} privateTest={marketPrivateTest} />
                ),
              )}
            </div>
          )}

          {more.length > 0 ? (
            <nav className="jl-more" aria-label="Other open lists">
              <h2 className="eb">Also open</h2>
              <div className="pills">
                {more.map((item) => (
                  <Link key={item.href} className="pill" href={item.href}>
                    {item.label} <b>{item.count}</b>
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}
        </div>
      </section>

      {placement === "below" ? <SignupBand /> : null}
    </main>
  );
}
