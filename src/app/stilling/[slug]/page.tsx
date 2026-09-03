import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobPostingJsonLd } from "@/components/seo/JobPostingJsonLd";
import { fetchPublicJob, jobImage, rateLine, type PublicJobDetail } from "@/lib/jobs-fetch";

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
  const company = job.public_show_company ? companyName(job) : null;
  const rate = rateLine(job);
  const required = (job.requirements ?? []).filter((r) => r.required);
  const preferred = (job.requirements ?? []).filter((r) => !r.required);
  const certificates = (job.required_certificates ?? []).filter(Boolean);
  const skills = (job.skills_required ?? []).filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
      <JobPostingJsonLd jobs={[job]} />

      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        <Link href="/" className="hover:text-gold">
          Open jobs
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span className="text-navy">{job.title}</span>
      </nav>

      <p className="am-eyebrow mt-6 font-semibold uppercase tracking-[0.14em] text-gold">
        {[company, (job.location ?? "").trim()].filter(Boolean).join(" · ") || "Open position"}
      </p>
      <h1 className="am-h1 mt-3 max-w-[820px] font-extrabold leading-tight tracking-tight text-navy">{job.title}</h1>

      {/* The facts a tradesman decides on, before the prose. Every one of them
          is read off a column: nothing here is inferred from the advert body,
          which is written by a generator and has been wrong. */}
      <dl className="mt-8 grid gap-x-10 gap-y-5 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Pay</dt>
          <dd className="mt-1 font-semibold text-navy">{rate ?? "Agreed at interview"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Employment</dt>
          <dd className="mt-1 font-semibold text-navy">{employer ?? "Not stated"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Where</dt>
          <dd className="mt-1 font-semibold text-navy">{(job.location ?? "").trim() || "Norway"}</dd>
        </div>
        {job.start_date_text?.trim() ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Start</dt>
            <dd className="mt-1 font-semibold text-navy">{job.start_date_text.trim()}</dd>
          </div>
        ) : null}
        {job.rotation?.trim() ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Rotation</dt>
            <dd className="mt-1 font-semibold text-navy">{job.rotation.trim()}</dd>
          </div>
        ) : null}
        {job.accommodation_provided ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">Accommodation</dt>
            <dd className="mt-1 font-semibold text-navy">Help with accommodation</dd>
          </div>
        ) : null}
      </dl>

      {/* What the job asks of the reader, before they spend twenty minutes on a
          form. The questions are set on the advert in the ATS; this is the one
          place a candidate can read them, because the application itself is
          taken on the board. */}
      {required.length > 0 || preferred.length > 0 ? (
        <section className="mt-10 rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold text-navy">What you need for this job</h2>
          {required.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {required.map((r) => (
                <li key={r.prompt} className="flex gap-3 text-navy">
                  <span aria-hidden className="mt-0.5 font-bold text-gold">
                    &#10003;
                  </span>
                  <span>{r.prompt}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {preferred.length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Helps, but not required
              </h3>
              <ul className="mt-3 space-y-2">
                {preferred.map((r) => (
                  <li key={r.prompt} className="flex gap-3 text-text-secondary">
                    <span aria-hidden className="mt-0.5">
                      &#183;
                    </span>
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
          className="am-prose mt-10 max-w-3xl leading-relaxed text-text-secondary"
          // Sanitised once, in the ATS, by the same functions its own job page
          // uses. Doing it a second time here would mean two allowlists, and the
          // day they drift is the day one of them is wrong.
          dangerouslySetInnerHTML={{ __html: job.description_html }}
        />
      ) : null}

      {certificates.length > 0 || skills.length > 0 ? (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {certificates.length > 0 ? "Certificates and skills" : "Skills"}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[...certificates, ...skills].map((item) => (
              <li key={item} className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm text-navy">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-8">
        {/* The application is taken here now, and worked in the ATS. It used to
            send the person to jobs.arbeidmatch.no; RecMan keeps staffing and the
            contracts already in it. His instruction, 3 September 2026. */}
        <Link
          href={`/stilling/${encodeURIComponent(slug)}/soknad`}
          className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 font-semibold text-navy transition hover:brightness-95"
        >
          Apply for this job
        </Link>
        <p className="text-sm text-text-secondary">
          EU or EEA passport. No visa sponsorship, and we do not cover travel.
        </p>
      </div>

      <p className="mt-6 text-sm text-text-secondary">
        Not the right one?{" "}
        <Link href="/" className="font-semibold text-gold hover:underline">
          See every open job
        </Link>
        .
      </p>
    </main>
  );
}
