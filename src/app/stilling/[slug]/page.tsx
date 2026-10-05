import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { JobPostingJsonLd } from "@/components/seo/JobPostingJsonLd";
import { ApplyGateButton } from "@/components/jobs/ApplyGateButton";
import { JobEngagement } from "@/components/jobs/JobEngagement";
import {
  atsBaseUrl,
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
 * The chain is now: this site's front page, this page, then the board to apply.
 * Applications still go through jobs.arbeidmatch.no exactly as before, on his
 * decision; nothing about where an application lands has changed. What changed
 * is that there is now a page of ours between the list and the hand-off, which
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
  const description =
    ownDescription ||
    [job.title, where, rateLine(job)].filter(Boolean).join(", ") ||
    "Open position in Norway for EU and EEA tradespeople.";
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
  const loginHref = `${atsBaseUrl()}/candidate/login?${portalQuery}`;
  const registerHref = `${atsBaseUrl()}/candidate/login/register?${portalQuery}`;

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

  // The strip under the photograph (ORDER 57): the four a tradesman decides on, in both languages.
  const facts: Array<{ label: string; value: string; gold?: boolean }> = [
    { label: "Lønn · Pay", value: rate ?? "Agreed at interview", gold: true },
    { label: "Sted · Where", value: where },
    { label: "Timer · Hours", value: job.hours_per_week ? `${job.hours_per_week} / uke` : "Not stated" },
    { label: "Oppstart · Start", value: job.start_date_text?.trim() || "Not stated" },
  ];
  // The four numbers as the board last saw them; the component reads them live.
  const counters = {
    views: job.public_views ?? 0,
    likes: job.public_likes ?? 0,
    shares: job.public_shares ?? 0,
    saves: job.public_saves ?? 0,
  };

  return (
    <article>
      <JobPostingJsonLd jobs={[job]} />

      {/* ORDER 57, his approved design (5 October 2026, "asa imi place foarte
          tare"): the job's own photograph full width, the title and the chips
          on a dark band over its foot, then a strip of the four facts a
          tradesman decides on, bilingual. */}
      <header className="relative bg-navy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={jobCardImage(job)} alt="" className="h-[240px] w-full object-cover sm:h-[340px] lg:h-[420px]" />
        <div className="bg-navy lg:absolute lg:inset-x-0 lg:bottom-0 lg:bg-navy/90">
          <div className="mx-auto w-full max-w-content px-4 py-5 md:px-12 lg:px-20 lg:py-7">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70">
              <Link href="/" className="transition hover:text-gold">
                Open jobs
              </Link>
              {company || trade ? (
                <>
                  <span aria-hidden className="mx-2 text-white/55">
                    /
                  </span>
                  <span className="text-white/85">{[company, trade].filter(Boolean).join(" · ")}</span>
                </>
              ) : null}
            </nav>
            <h1 className="am-h-advert mt-2 max-w-[900px] font-extrabold text-white">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {contract ? <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">{contract}</span> : null}
              <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white">{certificate}</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white"
                title="EU/EEA citizenship required, no visa sponsorship"
              >
                <BadgeCheck aria-hidden className="h-3.5 w-3.5 text-gold" />
                EU/EØS · EU/EEA
              </span>
              {reference ? <span className="px-1 text-xs font-semibold text-white/75">{reference}</span> : null}
            </div>
          </div>
        </div>
      </header>

      {/* Phone: the counters line and the three buttons right under the title. */}
      <div className="border-b border-border bg-white lg:hidden">
        <div className="mx-auto w-full max-w-content px-4 py-4">
          <JobEngagement jobId={job.id} slug={slug} title={job.title} atsBaseUrl={atsBaseUrl()} initial={counters} layout="inline" />
        </div>
      </div>

      <section aria-label="Facts" className="border-b border-border bg-surface">
        <dl className="mx-auto grid w-full max-w-content grid-cols-2 gap-3 px-4 py-5 md:px-12 lg:grid-cols-4 lg:gap-6 lg:px-20">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl bg-white p-3 lg:bg-transparent lg:p-0">
              <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">{f.label}</dt>
              <dd className={`mt-1 text-lg font-extrabold leading-tight lg:text-[22px] ${f.gold ? "text-[#8A6A22]" : "text-navy"}`}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The sheet. Everything below is #0D1B2A and #555 on white, which is
          where those two colours were always meant to be read. */}
      <div className="bg-white">
        <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
            {/* The button and the terms come first on a phone, where a column
                of prose would otherwise stand between the title and the one
                thing the page is for. On a desktop they move to the right and
                stay in view the whole way down the advert. */}
            <aside className="hidden lg:order-last lg:block">
              <div className="lg:sticky lg:top-24">
                {/* The card from his design: pay, Apply, the terms, and the
                    three buttons with the four numbers (ORDER 57). */}
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_24px_rgba(15,27,45,0.08)]">
                  <p className="text-[26px] font-extrabold leading-tight text-[#8A6A22]">{rate ?? "Agreed at interview"}</p>
                  <ApplyGateButton
                    loginHref={loginHref}
                    registerHref={registerHref}
                    slug={slug}
                    className="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-gold px-6 text-[17px] font-extrabold text-navy transition hover:bg-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                  />
                  <dl className="flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
                    {terms.map((term) => (
                      <div key={term.label} className="flex justify-between gap-3">
                        <dt className="text-text-secondary">{term.label}</dt>
                        <dd className="text-right font-bold text-navy">{term.value}</dd>
                      </div>
                    ))}
                    {reference ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-text-secondary">Referanse</dt>
                        <dd className="text-right font-bold text-navy">{reference}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <JobEngagement jobId={job.id} slug={slug} title={job.title} atsBaseUrl={atsBaseUrl()} initial={counters} />
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    EU/EEA citizenship required (passport or national ID card). No visa sponsorship, and we do not cover travel.
                  </p>
                </div>

                <p className="mt-4 text-sm text-text-secondary">
                  Not the right one?{" "}
                  <Link href="/" className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                    See every open job
                  </Link>
                  .
                </p>
              </div>
            </aside>

            <div className="min-w-0">
              {/* What the job asks of the reader, before they spend twenty
                  minutes on a form. The questions are set on the advert in the
                  ATS; this is the one place a candidate can read them, because
                  the application itself is taken on the board. */}
              {required.length > 0 || preferred.length > 0 ? (
                <section className="rounded-2xl border border-border p-6 md:p-7">
                  <h2 className="text-lg font-bold text-navy">What you need for this job</h2>
                  {required.length > 0 ? (
                    <ul className="mt-5 space-y-3">
                      {required.map((r) => (
                        <li key={r.prompt} className="flex gap-3 leading-relaxed text-navy">
                          <span
                            aria-hidden
                            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/25 text-[11px] font-bold text-navy"
                          >
                            &#10003;
                          </span>
                          <span>{r.prompt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {preferred.length > 0 ? (
                    <>
                      <h3 className="mt-7 border-t border-border pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                        Helps, but not required
                      </h3>
                      <ul className="mt-4 space-y-2.5">
                        {preferred.map((r) => (
                          <li key={r.prompt} className="flex gap-3 leading-relaxed text-text-secondary">
                            <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                            <span>{r.prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </section>
              ) : null}

              {/*
                HIS DECISION, 4 October 2026: "vreau sa fie distinctie in anunt
                intre limba norvegiana si engleza ca pe finn, fara comutator".
                Both halves are always on the page, Norwegian first, with
                nothing to press. An advert that does not carry both - every
                imported posting, and every job written before this - renders
                as it always did.

                The HTML is sanitised once, in the ATS, by the same functions
                its own job page uses. Doing it again here would mean two
                allowlists, and the day they drift is the day one of them is
                wrong. What it is not is styled: that is `.am-prose`.
              */}
              {halves ? (
                <div className={`${required.length > 0 || preferred.length > 0 ? "mt-10" : ""} max-w-[68ch] space-y-10`}>
                  {/* HIS WORDS, 4 October 2026: "sa fie delimitare bine intre
                      limbi si specificat ca English version". Two links, never
                      a toggle: both halves stay on the page, and these only
                      carry the reader to one of them. */}
                  {([
                    ["no", LANGUAGE_LABELS.no, halves.no],
                    ["en", LANGUAGE_LABELS.en, halves.en],
                  ] as const).map(([code, label, body], index) => (
                    <section
                      key={code}
                      id={`advert-${code}`}
                      lang={code === "no" ? "nb" : "en"}
                      className={`scroll-mt-24 rounded-2xl border border-border p-6 sm:p-7 ${index === 0 ? "bg-surface" : ""}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                          {label}
                        </span>
                        {/* The two links sit in the first block's header, so the advert's
                            first block starts where the terms card does. */}
                        {index === 0 ? (
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
                            {([
                              ["no", LANGUAGE_LABELS.no],
                              ["en", LANGUAGE_LABELS.en],
                            ] as const).map(([linkCode, linkLabel], linkIndex) => (
                              <span key={linkCode} className="inline-flex items-center gap-3">
                                {linkIndex > 0 ? <span aria-hidden>&middot;</span> : null}
                                <a href={`#advert-${linkCode}`} className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                                  {linkLabel}
                                </a>
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </div>
                      <div className="am-prose mt-4" dangerouslySetInnerHTML={{ __html: body }} />
                    </section>
                  ))}
                </div>
              ) : job.description_html ? (
                <div className="am-prose mt-10 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: job.description_html }} />
              ) : null}

              {certificates.length > 0 || skills.length > 0 ? (
                <section className="mt-10 border-t border-border pt-8">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    {certificates.length > 0 ? "Certificates and skills" : "Skills"}
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {[...certificates, ...skills].map((item) => (
                      <li
                        key={item}
                        className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-navy"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* The button again at the foot of the advert, for the reader who
                  got here by reading rather than by deciding at the top. */}
              <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-8">
                <ApplyGateButton
                  loginHref={loginHref}
                  registerHref={registerHref}
                  slug={slug}
                  className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 font-semibold text-navy transition hover:bg-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                />
                <p className="text-sm text-text-secondary">{nextStep}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Phone: pay and Apply always in reach (ORDER 57). */}
      <div className="sticky bottom-0 z-30 flex items-center gap-3 border-t border-border bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-extrabold text-[#8A6A22]">{rate ?? "Agreed at interview"}</span>
          <span className="truncate text-xs text-text-secondary">{where}</span>
        </div>
        <ApplyGateButton
          loginHref={loginHref}
          registerHref={registerHref}
          slug={slug}
          className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-gold px-5 text-base font-extrabold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
        />
      </div>
    </article>
  );
}
