import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobPostingJsonLd } from "@/components/seo/JobPostingJsonLd";
import {
  fetchPublicJob,
  jobCardImage,
  jobImage,
  jobReference,
  rateLine,
  type PublicJobDetail,
} from "@/lib/jobs-fetch";

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
function employmentLine(job: PublicJobDetail): string | null {
  const model = job.engagement ?? (job.engagement_model as "staffing" | "recruitment" | null | undefined) ?? null;
  if (model === "staffing") return "We employ you and hire you in to the client";
  if (model === "recruitment") return "The client employs you; we find the person";
  return null;
}

/** The same answer, short enough to stand in a band under the title. */
function employmentShort(job: PublicJobDetail): string | null {
  const model = job.engagement ?? (job.engagement_model as "staffing" | "recruitment" | null | undefined) ?? null;
  if (model === "staffing") return "We employ you";
  if (model === "recruitment") return "The client employs you";
  return null;
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
  if (!job) return { title: "Stilling | ArbeidMatch" };

  const where = (job.location ?? "").trim();
  const title = where ? `${job.title} in ${where} | ArbeidMatch` : `${job.title} | ArbeidMatch`;
  const description =
    [job.title, where, rateLine(job)].filter(Boolean).join(", ") ||
    "Open position in Norway for EU and EEA tradespeople.";
  const url = `${SITE}/stilling/${encodeURIComponent(slug)}`;

  return {
    title,
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

  const employer = employmentLine(job);
  const employerShort = employmentShort(job);
  const company = job.public_show_company ? companyName(job) : null;
  const rate = rateLine(job);
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norway";
  const trade = (job.category ?? "").trim();
  const reference = jobReference(job);
  const required = (job.requirements ?? []).filter((r) => r.required);
  const preferred = (job.requirements ?? []).filter((r) => !r.required);
  const certificates = (job.required_certificates ?? []).filter(Boolean);
  const skills = (job.skills_required ?? []).filter(Boolean);
  const applyHref = `/stilling/${encodeURIComponent(slug)}/soknad`;

  // The bar on every posting: a diploma or documented equivalent experience,
  // never a beginner. The electricians say DSB instead, because for them the
  // certificate is the law's and not ours. Same rule as the card on the board.
  const certificate = job.public_requires_dsb || job.industry === "electrical" ? "DSB certified" : "Trade certificate";

  // Every one of these is read off a column: nothing here is inferred from the
  // advert body, which is written by a generator and has been wrong.
  const terms: Array<{ label: string; value: string }> = [
    { label: "Pay", value: rate ?? "Agreed at interview" },
    { label: "Employment", value: employer ?? "Not stated" },
    { label: "Where", value: where },
  ];
  if (job.start_date_text?.trim()) terms.push({ label: "Start", value: job.start_date_text.trim() });
  if (job.rotation?.trim()) terms.push({ label: "Rotation", value: job.rotation.trim() });
  if (job.shift_type?.trim()) terms.push({ label: "Shift", value: job.shift_type.trim() });
  if (job.accommodation_provided) terms.push({ label: "Accommodation", value: "Help with accommodation" });

  return (
    <article>
      <JobPostingJsonLd jobs={[job]} />

      {/* The band carries on from the navbar, which is this navy and sticky, so
          the page starts as one surface instead of a seam under it. Gold reads
          at 7.6:1 here and at 2.1:1 on the sheet below, which is the whole
          reason it carries text up here and only a rule down there. */}
      <header className="bg-navy">
        <div className="mx-auto w-full max-w-content px-6 py-10 md:px-12 md:py-14 lg:px-20">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            <Link href="/" className="transition hover:text-gold">
              Open jobs
            </Link>
            <span aria-hidden className="mx-2 text-white/55">
              /
            </span>
            <span className="text-white/85">{job.title}</span>
          </nav>

          <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <div className="min-w-0">
              <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">
                {[company, trade].filter(Boolean).join(" · ") || "Open position"}
              </p>
              <h1 className="am-h-advert mt-3 max-w-[720px] font-extrabold text-white">{job.title}</h1>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {[reference, certificate, "EU/EEA"].filter(Boolean).map((badge) => (
                  <span
                    key={badge as string}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* The three a tradesman decides on, above the fold on a phone,
                  before a word of the advert. */}
              <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-white/15 pt-6 sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Pay</dt>
                  <dd className="mt-1.5 text-xl font-bold leading-tight text-gold">{rate ?? "Agreed at interview"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Where</dt>
                  <dd className="mt-1.5 text-xl font-bold leading-tight text-white">{where}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">Contract</dt>
                  <dd className="mt-1.5 text-xl font-bold leading-tight text-white">{employerShort ?? "Not stated"}</dd>
                </div>
              </dl>
            </div>

            {/* The photograph the reader clicked on the board, carrying our
                mark. It never comes back empty: a posting with no picture of
                its own wears the logo rather than leaving a hole. */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 lg:justify-self-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={jobCardImage(job)}
                alt={job.title}
                className="h-48 w-full object-cover sm:h-64 lg:h-[220px] lg:w-[360px]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* The sheet. Everything below is #0D1B2A and #555 on white, which is
          where those two colours were always meant to be read. */}
      <div className="bg-white">
        <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
            {/* The button and the terms come first on a phone, where a column
                of prose would otherwise stand between the title and the one
                thing the page is for. On a desktop they move to the right and
                stay in view the whole way down the advert. */}
            <aside className="order-first lg:order-last">
              <div className="lg:sticky lg:top-24">
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h2 className="text-sm font-bold text-navy">The terms</h2>

                  {/* The band above shouts three of these; this is the whole
                      sheet, and on a desktop it stays beside the reader to the
                      bottom of the advert, which is where the questions come
                      back. */}
                  <dl className="mt-5 space-y-4 border-t border-border pt-5">
                    {terms.map((term) => (
                      <div key={term.label}>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                          {term.label}
                        </dt>
                        <dd className="mt-1 font-semibold leading-snug text-navy">{term.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* The application is taken here now, and worked in the ATS.
                      It used to send the person to jobs.arbeidmatch.no; RecMan
                      keeps staffing and the contracts already in it. His
                      instruction, 3 September 2026. */}
                  <Link
                    href={applyHref}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 font-semibold text-navy transition hover:bg-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                  >
                    Apply for this job
                  </Link>
                  <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                    EU or EEA passport. No visa sponsorship, and we do not cover travel.
                  </p>
                </div>

                <p className="mt-4 text-sm text-text-secondary">
                  Not the right one?{" "}
                  <Link
                    href="/"
                    className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
                  >
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

              {job.description_html ? (
                <div
                  className="am-prose mt-10 max-w-[68ch]"
                  // Sanitised once, in the ATS, by the same functions its own job
                  // page uses. Doing it a second time here would mean two
                  // allowlists, and the day they drift is the day one of them is
                  // wrong. What it is not is styled - that is `.am-prose`.
                  dangerouslySetInnerHTML={{ __html: job.description_html }}
                />
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
                <Link
                  href={applyHref}
                  className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 font-semibold text-navy transition hover:bg-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  Apply for this job
                </Link>
                <p className="text-sm text-text-secondary">
                  A recruiter reads every application, and we answer by email either way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
