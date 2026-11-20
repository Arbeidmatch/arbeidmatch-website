import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobPostingJsonLd } from "@/components/seo/JobPostingJsonLd";
import { ApplyGateButton } from "@/components/jobs/ApplyGateButton";
import { Icon } from "@/components/site/Icon";
import {
  fetchPublicJob,
  jobCardImage,
  jobImage,
  jobReference,
  rateLine,
  type PublicJobDetail,
} from "@/lib/jobs-fetch";
import { applyNextStep, contractLabel, hiringModelLabel, type HiringModel } from "@/lib/job-contract";
import { LANGUAGE_LABELS, splitJobAdvertLanguages } from "@/lib/job-advert-languages";
import { roleWithoutCity } from "@/lib/job-title";
import { candidateRegisterHref } from "@/lib/candidateGate";
import { CANDIDATE_PORTAL_LOGIN_ABSOLUTE_URL } from "@/lib/candidatePortal";

/**
 * The advert itself, on our own site.
 *
 * HIS INSTRUCTION, 3 September 2026: "eu nu vreau sa expun ats ul ci websiteul
 * vreau sa fie public." Until this page existed, a card on the front page opened
 * `ats.arbeidmatch.no/jobs/public/<slug>`, so the address a stranger read was
 * the ATS, and everything we had written about a job - who employs the person,
 * what the job asks of them, the marked photograph, the structured data - lived
 * on a page that is now closed to search engines.
 *
 * The chain is now: this site's front page, this page, then the application in
 * RecOS (/candidate/apply). Nothing goes to jobs.arbeidmatch.no any more (ORDER 47,
 * 5 October 2026: "lucram numai prin recos"). There is a page of ours between
 * the list and the application, which
 * is where we can say who will pay the person and what the job requires before
 * they spend twenty minutes on a form.
 *
 * `/stilling/` and not `/jobs/<slug>`, because `/jobs/[...facet]` already owns
 * that segment for the trade and town pages and Next cannot hold two different
 * dynamic names at one level.
 *
 * HIS CORRECTION, 6 September 2026: "e inacceptabil sa fie public asa ceva."
 * He was right, and the fault was a surface, not a taste. This page was written
 * in the front page's palette - `text-navy` headings, `#555` body, `#E2E5EA`
 * rules - but never got the front page's white sheet, so all of it landed
 * straight on the site's navy body. The title, the pay, the place, every
 * requirement and every chip were #0D1B2A on #0D1B2A: a contrast ratio of 1.00,
 * which is to say the job title was not on the page at all. What was left
 * readable sat at 1.9:1, under half the 4.5:1 a body of text has to clear.
 *
 * So the sheet is here now, and the layout was rebuilt on top of it rather than
 * recoloured: a navy band that carries on from the navbar and holds the title,
 * the photograph and the three facts a tradesman decides on, then a white sheet
 * with the advert on the left and the pay, the terms and the button standing
 * beside it the whole way down. `.am-prose` in globals.css is the other half:
 * the advert body arrives as h2/p/ul that nothing had styled since preflight
 * stripped the browser's defaults, so every advert read as one grey block.
 */

const SITE = "https://www.arbeidmatch.no";

/**
 * Rendered per request, for the same measured reason as the facet pages: the
 * Vercel build cannot reach ats.arbeidmatch.no, so anything generated at build
 * time bakes in a failed fetch and serves it until something replaces it.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Who employs the person, in the reader's terms, or null when nobody has said.
 *
 * Two arrangements wear the same shape on a job board and are not the same
 * thing: we employ the person and hire them in, which is why those clients sign
 * a timesheet every week, or the client employs and we found them. It decides
 * who pays him, so it is never guessed. The ATS resolves it once, on the row,
 * and sends the answer; this only puts it into a sentence.
 */
function hiringModel(job: PublicJobDetail): HiringModel {
  return job.engagement ?? (job.engagement_model as HiringModel | undefined) ?? null;
}

function companyName(job: PublicJobDetail): string | null {
  const company = job.project?.company;
  const one = Array.isArray(company) ? company[0] : company;
  const name = one?.name?.trim();
  return name || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchPublicJob(slug);
  if (!job) return { title: { absolute: "Stilling | ArbeidMatch" } };

  const where = (job.location ?? "").trim();
  // The job's own search text first, written in the ATS since 11 September
  // 2026; what this page built before is the fallback.
  const ownTitle = (job.seo_title ?? "").trim();
  const ownDescription = (job.seo_description ?? "").trim();
  /**
   * THE CITY ONCE (REPAIR R27 addendum, 4 October 2026). A quick job's title
   * is already "Flislegger - Trondheim", and this appended " in Trondheim",
   * so the tab, the search result and the Facebook link preview all read
   * "Flislegger - Trondheim in Trondheim | ArbeidMatch".
   */
  const role = roleWithoutCity(job.title, where);
  const title = ownTitle || (where ? `${role} in ${where} | ArbeidMatch` : `${role} | ArbeidMatch`);
  // The fallback said only "Flislegger - Trondheim, Trondheim" (47 characters,
  // 16 October 2026): the role, the place and the rate once, then what applies
  // to every advert on the board.
  const rate = rateLine(job);
  const description =
    ownDescription ||
    `${[where ? `${role} in ${where}, Norway` : `${role} in Norway`, rate].filter(Boolean).join(", ")}. Open position for EU/EEA tradespeople with a trade certificate or proven experience. Apply online.`;
  const url = `${SITE}/stilling/${encodeURIComponent(slug)}`;

  return {
    // Absolute: the layout's "%s | ArbeidMatch" template was adding a second
    // "| ArbeidMatch" to a title that already ends with one.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", images: [jobImage(job)] },
    twitter: { card: "summary_large_image", title, description, images: [jobImage(job)] },
  };
}

export default async function StillingPage({ params }: Props) {
  const { slug } = await params;
  const job = await fetchPublicJob(slug);
  // A closed advert, a wrong address and an ATS that did not answer all arrive
  // here the same way, and a 404 is the honest answer to all three. A page that
  // renders an error where the job should be reads as us having lost it.
  if (!job) notFound();

  const contract = contractLabel(job.employment_type);
  const model = hiringModel(job);
  const employer = hiringModelLabel(model);
  // Who decides next depends on who the employer is (applyNextStep).
  const nextStep = applyNextStep(model);
  const company = job.public_show_company ? companyName(job) : null;
  const rate = rateLine(job);
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norway";
  const trade = (job.category ?? "").trim();
  const reference = jobReference(job);
  const required = (job.requirements ?? []).filter((r) => r.required);
  const preferred = (job.requirements ?? []).filter((r) => !r.required);
  const certificates = (job.required_certificates ?? []).filter(Boolean);
  // Norwegian and English, when the advert was written with both (R29).
  const halves = splitJobAdvertLanguages(job.description_html);
  const skills = (job.skills_required ?? []).filter(Boolean);
  // Apply opens the sign-in or create-profile window with the consent box first (17 September 2026).
  // consent=1 carries only the processing consent; the privacy notice is acknowledged, never accepted,
  // and no Terms are accepted by an applicant (legal review, 25 September 2026).
  const portalQuery = new URLSearchParams({
    next: `/candidate/apply/${slug}`,
    consent: "1",
    source: `job:${slug}`,
  }).toString();
  // The sign-in is on this site since ORDER 426; RecOS opens the session behind it.
  const loginHref = `${CANDIDATE_PORTAL_LOGIN_ABSOLUTE_URL}?${portalQuery}`;
  // A new profile is made only on the one entry gate (ORDER 396), carrying the advert it came from.
  const registerHref = candidateRegisterHref(`job:${slug}`);

  // The bar on every posting: a diploma or documented equivalent experience,
  // never a beginner. The electricians say DSB instead, because for them the
  // certificate is the law's and not ours. Same rule as the card on the board.
  const certificate = job.public_requires_dsb || job.industry === "electrical" ? "DSB certified" : "Trade certificate";

  // Every one of these is read off a column: nothing here is inferred from the
  // advert body, which is written by a generator and has been wrong.
  const terms: Array<{ label: string; value: string }> = [
    { label: "Pay", value: rate ?? "Agreed at interview" },
    { label: "Contract", value: contract ?? "Not stated" },
    { label: "Employer", value: employer ?? "Not stated" },
    { label: "Where", value: where },
  ];
  if (job.start_date_text?.trim()) terms.push({ label: "Start", value: job.start_date_text.trim() });
  if (job.rotation?.trim()) terms.push({ label: "Rotation", value: job.rotation.trim() });
  if (job.shift_type?.trim()) terms.push({ label: "Shift", value: job.shift_type.trim() });
  if (job.hours_per_week) terms.push({ label: "Hours", value: `${job.hours_per_week} per week` });
  // The sentence comes from the ATS already written; see PublicJob.accommodation.
  const accommodationValue = job.accommodation?.label?.trim();
  if (accommodationValue) terms.push({ label: "Accommodation", value: accommodationValue });
  const travelValue = job.travel?.label?.trim();
  if (travelValue) terms.push({ label: "Travel", value: travelValue });

  // ORDER 295, stage 3 (the approved mockup of 15 November 2026): the title,
  // the facts as a grid under it and the advert's own photo beside them, then
  // what the job asks and the advert. No view, like, share or save counters.
  const gridOrder = ["Pay", "Where", "Hours", "Start", "Contract", "Employer"];
  const ordered = [...terms].sort((a, b) => {
    const ia = gridOrder.indexOf(a.label);
    const ib = gridOrder.indexOf(b.label);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const facts = ordered.slice(0, 6);
  const moreFacts = ordered.slice(6);
  const applyClass = "btn gold";

  return (
    <article className="ams page jobpage" lang="en">
      <JobPostingJsonLd jobs={[job]} />

      <section className="dark band">
        <div className="w">
          <Link className="crumb" href="/jobs">
            <Icon name="back" />
            Open jobs
          </Link>
          <div className="band-g">
            <div>
              <span className="eb">{[company, trade].filter(Boolean).join(" · ") || "Open position"}</span>
              <h1>{job.title}</h1>
              <dl className="fgrid">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt>
                      <span>{f.label}</span>
                    </dt>
                    <dd>
                      <b className={f.label === "Pay" ? "gold" : undefined}>{f.value}</b>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="fref">
                {reference ? `Reference ${reference}. ` : ""}
                {certificate}. EU/EEA citizenship required (passport or national ID card). No visa sponsorship. The advert says whether travel is included.
              </p>
              <div className="apply-row">
                <ApplyGateButton loginHref={loginHref} registerHref={registerHref} slug={slug} jobTitle={job.title} className={applyClass} />
                <p>{nextStep}</p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph" style={{ aspectRatio: "4 / 3", objectPosition: "50% 28%" }} src={jobCardImage(job)} alt="" />
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="advert">
            {moreFacts.length > 0 ? (
              <div className="card">
                <h2 className="h4">More about the job</h2>
                <dl className="kv">
                  {moreFacts.map((term) => (
                    <div key={term.label}>
                      <dt>{term.label}</dt>
                      <dd>{term.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {/* What the job asks of the reader, before they spend twenty
                minutes on a form. The questions are set on the advert in the
                ATS; this is the one place a candidate can read them. */}
            {required.length > 0 || preferred.length > 0 ? (
              <div className="card">
                <h2 className="h4">What you need for this job</h2>
                {required.length > 0 ? (
                  <ul className="req">
                    {required.map((r) => (
                      <li key={r.prompt}>
                        <Icon name="check" />
                        <span>{r.prompt}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {preferred.length > 0 ? (
                  <>
                    <h3 className="eb" style={{ marginTop: 18 }}>
                      Helps, but not required
                    </h3>
                    <ul className="req">
                      {preferred.map((r) => (
                        <li key={r.prompt} className="opt">
                          <Icon name="plus" />
                          <span>{r.prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            ) : null}

            {/*
              HIS DECISION, 4 October 2026: both languages of the advert on the
              page, Norwegian first, with nothing to press. The HTML is
              sanitised once, in the ATS; `.am-prose` styles it.
            */}
            {halves ? (
              <div className="halves">
                {([
                  ["no", LANGUAGE_LABELS.no, halves.no],
                  ["en", LANGUAGE_LABELS.en, halves.en],
                ] as const).map(([code, label, body]) => (
                  <section key={code} id={`advert-${code}`} lang={code === "no" ? "nb" : "en"} className="card" style={{ scrollMarginTop: 96 }}>
                    <span className="lab">{label}</span>
                    <div className="am-prose" dangerouslySetInnerHTML={{ __html: body }} />
                  </section>
                ))}
              </div>
            ) : job.description_html ? (
              <div className="card">
                <div className="am-prose" dangerouslySetInnerHTML={{ __html: job.description_html }} />
              </div>
            ) : null}

            {certificates.length > 0 || skills.length > 0 ? (
              <div className="card">
                <h2 className="h4">{certificates.length > 0 ? "Certificates and skills" : "Skills"}</h2>
                <ul className="chips">
                  {[...certificates, ...skills].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* The button again at the foot of the advert, for the reader who
                got here by reading rather than by deciding at the top. */}
            <div className="apply-row foot">
              <ApplyGateButton loginHref={loginHref} registerHref={registerHref} slug={slug} jobTitle={job.title} className={applyClass} />
              <p>
                Not the right one? <Link href="/jobs">See every open job</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Phone: pay and Apply always in reach. */}
      <div className="jobbar">
        <span>
          {rate ?? "Agreed at interview"}
          <small>{where}</small>
        </span>
        <ApplyGateButton loginHref={loginHref} registerHref={registerHref} slug={slug} jobTitle={job.title} className={applyClass} />
      </div>
    </article>
  );
}
