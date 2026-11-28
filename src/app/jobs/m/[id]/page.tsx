import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketJobCard } from "@/components/jobs/MarketJobCard";
import {
  CheckMyPayButton,
  CheckSourceButton,
  MarketActionRail,
  MarketViewBeacon,
  RecommendButton,
  ReportAdvert,
} from "@/components/jobs/MarketJobClient";
import { Icon } from "@/components/site/Icon";
import { fetchMarketJob, previewTokenFromCookies } from "@/lib/market-jobs/fetch";
import { isMarketId, marketCardView } from "@/lib/market-jobs/pure";
import type { MarketSiteCard, MarketSiteDetail } from "@/lib/market-jobs/types";

/**
 * One job from the Norwegian market, on our own site (ORDER 514, boards 3, 4
 * and 5 of the approved mockup).
 *
 * Per request and never cached: the ATS answers a visitor without a staff
 * preview with a 404 while the Go public switch is off, and a cached answer
 * would hand a preview to the next visitor. Never indexed for now either:
 * these pages stay out of search until the owner goes public.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const NOINDEX: Metadata["robots"] = { index: false, follow: false };

async function load(id: string) {
  if (!isMarketId(id)) return null;
  return fetchMarketJob(id, await previewTokenFromCookies());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const found = await load(id);
  if (!found) return { title: "Job not found | ArbeidMatch", robots: NOINDEX };
  const { job } = found;
  return {
    title: { absolute: `${job.title}${job.place ? `, ${job.place}` : ""} | ArbeidMatch` },
    robots: NOINDEX,
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mj-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TextWithUsual({ value }: { value: { text: string; usual: string | null } }) {
  return (
    <>
      {value.text}
      {value.usual ? <span className="mj-usual"> {value.usual}</span> : null}
    </>
  );
}

function SimilarJobs({ job }: { job: MarketSiteDetail }) {
  const similar = job.similar.filter((s: MarketSiteCard) => s.id !== job.id);
  if (similar.length === 0) return null;
  return (
    <section className="mj-sim" aria-labelledby="mj-sim-h">
      <h2 id="mj-sim-h" className="mj-h2">
        More {job.trade.en.toLowerCase()} jobs
      </h2>
      <div className="jgrid">
        {similar.map((card) => (
          <MarketJobCard key={card.id} card={card} privateTest={job.privateTest} />
        ))}
      </div>
    </section>
  );
}

export default async function MarketJobPage({ params }: Props) {
  const { id } = await params;
  const found = await load(id);
  if (!found) notFound();
  const { job } = found;
  const v = marketCardView(job);
  const badges = job.recruitmentOnly ? [...v.badges, { label: "Recruitment", tone: "navy" as const }] : v.badges;

  if (job.state === "closed") {
    return (
      <main className="ams page mjpage" lang="en">
        <MarketViewBeacon id={job.id} />
        <section className="dark band">
          <div className="w">
            <Link className="crumb" href="/jobs">
              <Icon name="back" />
              Open jobs
            </Link>
            {job.privateTest ? <p className="mj-test">Private test</p> : null}
            <span className="eb">{job.trade.en}</span>
            <h1>{job.title}</h1>
            <p className="mj-place">{v.placeLine}</p>
            <p className="mj-closed" role="status">
              This job is closed
            </p>
          </div>
        </section>
        <section className="sec">
          <div className="w">
            <SimilarJobs job={job} />
            <p className="jl-note">
              <Link href="/jobs">See every open job</Link>
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ams page mjpage" lang="en">
      <MarketViewBeacon id={job.id} />

      <section className="dark band">
        <div className="w">
          <Link className="crumb" href="/jobs">
            <Icon name="back" />
            Open jobs
          </Link>
          {job.privateTest ? <p className="mj-test">Private test</p> : null}
          <span className="eb">{job.trade.en}</span>
          <h1>{job.title}</h1>
          <p className="mj-place">{v.placeLine}</p>
          {badges.length > 0 ? (
            <p className="mj-badges">
              {badges.map((b) => (
                <span key={b.label} className={`mj-badge ${b.tone}`}>
                  {b.label}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </section>

      <section className="sec">
        <div className="w mj-grid">
          <div className="mj-main">
            {job.gives.length > 0 ? (
              <div className="card mj-gives">
                <h2 className="mj-cap">What you get</h2>
                <ul className="mj-chips">
                  {job.gives.map((g) => (
                    <li key={g}>
                      <Icon name="check" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="card mj-pay">
              <dl className="mj-payrow">
                <dt>Pay</dt>
                <dd>{v.pay ?? "Discussed at the interview"}</dd>
              </dl>
              {!job.pay && job.payFloor ? (
                <p className="mj-floor">
                  {job.payFloor.level} Source:{" "}
                  <a href={job.payFloor.source.url} target="_blank" rel="noopener noreferrer">
                    {job.payFloor.source.text}
                  </a>
                </p>
              ) : null}
              <div className="mj-btns">
                <RecommendButton id={job.id} fit={job.fit} />
                {job.legalMinimum ? <CheckMyPayButton id={job.id} title={job.title} place={job.zone ?? job.place} minimum={job.legalMinimum} fit={job.fit} /> : null}
                {job.checkSourceUrl ? <CheckSourceButton id={job.id} url={job.checkSourceUrl} /> : null}
              </div>
            </div>

            {job.requirements.length > 0 ? (
              <div className="card">
                <h2 className="mj-h2">Requirements</h2>
                <ul className="req">
                  {job.requirements.map((r) => (
                    <li key={r}>
                      <Icon name="check" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="card mj-gold">
              <h2 className="mj-h2">Skilled and certified abroad? ArbeidMatch can recommend you.</h2>
              <p>
                <b>Big advantage:</b> a reference from your last supervisor, or a recommendation from ArbeidMatch, puts you ahead of other applicants.
              </p>
              <p>
                <b>Our guarantee:</b> when your profile and our conditions are met, we present you to the employer within 2 working days and tell you
                when it is done.
              </p>
              <ol className="mj-steps">
                <li>
                  <span aria-hidden="true">1</span>Register once with your trade, certificates and last supervisor
                </li>
                <li>
                  <span aria-hidden="true">2</span>Check if I fit shows what is still missing
                </li>
                <li>
                  <span aria-hidden="true">3</span>Press Recommend me and we present you
                </li>
              </ol>
              <div className="mj-btns">
                <RecommendButton id={job.id} fit={job.fit} className="btn ghost" label="Check if I fit" />
                <RecommendButton id={job.id} fit={job.fit} className="btn navy" />
              </div>
            </div>

            <div className="card">
              <h2 className="mj-h2">About the job</h2>
              <dl className="mj-about">
                {job.tasks.length > 0 ? (
                  <Row label="Tasks">
                    <ul className="mj-list">
                      {job.tasks.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </Row>
                ) : null}
                <Row label="Housing">
                  <TextWithUsual value={job.housing} />
                </Row>
                <Row label="Travel to work">{job.travelToWork}</Row>
                <Row label="Travel to Norway">
                  <TextWithUsual value={job.travelToNorway} />
                </Row>
                <Row label="Start">{job.start}</Row>
                <Row label="Hours">{job.hours}</Row>
                {v.applyBy ? <Row label="Apply by">{v.applyBy}</Row> : null}
              </dl>
              <p className="mj-jobid">Job ID {job.id}, from the employer&apos;s own advert</p>
            </div>

            <SimilarJobs job={job} />

            <p className="mj-foot">
              <ReportAdvert id={job.id} />
            </p>
          </div>

          <aside className="mj-side" aria-label="Actions">
            <MarketActionRail id={job.id} title={job.title} />
          </aside>
        </div>
      </section>

      {/* Phone: Recommend me always in reach. */}
      <div className="jobbar">
        <span>
          {v.pay ?? "Pay discussed at the interview"}
          <small>{v.placeLine}</small>
        </span>
        <RecommendButton id={job.id} fit={job.fit} />
      </div>
    </main>
  );
}
