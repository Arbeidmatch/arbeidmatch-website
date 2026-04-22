import Link from "next/link";
import ApplyWithProfileGate from "@/components/jobs/ApplyWithProfileGate";
import ShareJobButton from "@/components/jobs/ShareJobButton";
import type { JobRecord } from "@/lib/jobs/types";
import JobCard from "@/components/jobs/JobCard";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function DetailSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;

  return (
    <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function normalizeList(items?: string[] | string | null): string[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return items.split("\n").map((item) => item.trim()).filter(Boolean);
}

export default function JobDetailView({
  job,
  relatedJobs,
  browseOnly = false,
  shareUrl,
}: {
  job: JobRecord;
  relatedJobs: JobRecord[];
  browseOnly?: boolean;
  shareUrl?: string;
}) {
  const applyHref =
    job.applicationMethod === "external_url"
      ? job.applicationUrl || `/jobs/${job.slug}/apply`
      : job.applicationMethod === "email"
        ? `mailto:${job.applicationEmail || "post@arbeidmatch.no"}`
        : `/jobs/${job.slug}/apply`;
  const applyExternal = job.applicationMethod === "external_url";

  return (
    <div className="container-site pb-16 pt-6 md:pt-8">
      <Link href="/jobs" className="link-text-premium inline-flex text-sm font-medium text-[#C9A84C]">
        Back to all jobs
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article
          className={`rounded-[20px] border bg-white/[0.03] p-6 md:p-8 ${
            job.source === "employer_board"
              ? "border-[#C9A84C]/40 bg-[linear-gradient(145deg,rgba(13,27,42,0.95),rgba(17,30,46,0.92))]"
              : "border-[#C9A84C]/20"
          }`}
        >
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">{job.location}, Norway</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">{job.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/75">{job.summary ?? job.description}</p>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Contract", job.contractType ?? "-"],
              ["Work type", job.workModel ?? "-"],
              ["Salary", job.salary ?? "Based on experience"],
              ["Published", job.publishedAt ? formatDate(job.publishedAt) : "-"],
              ["Start date", job.startDate ? formatDate(job.startDate) : "As agreed"],
              ["Application", job.applicationMethod ?? "internal"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-[#0D1B2A]/60 p-3">
                <p className="text-xs text-white/45">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">{job.trade ? <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">{job.trade}</span> : null}</div>

          <div className="mt-8 space-y-4">
            <DetailSection title="About the role" items={[job.description]} />
            <DetailSection title="Responsibilities" items={normalizeList(job.responsibilities)} />
            <DetailSection title="Requirements" items={normalizeList(job.requirements)} />
            <DetailSection title="What we offer" items={normalizeList(job.benefits)} />
            <DetailSection
              title="Application method"
              items={[
                job.applicationMethod === "external_url"
                  ? "Apply via external application page."
                  : job.applicationMethod === "email"
                    ? `Apply by email: ${job.applicationEmail || "post@arbeidmatch.no"}`
                    : "Apply directly through ArbeidMatch form.",
              ]}
            />
          </div>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-[18px] border border-[#C9A84C]/25 bg-[#0A0F18] p-5">
            <p className="text-sm text-white/70">{browseOnly ? "Browse mode" : "Ready to apply?"}</p>
            {browseOnly ? (
              <Link
                href="/candidates"
                className="mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.35)] bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgba(201,168,76,0.08)]"
              >
                Complete profile to apply
              </Link>
            ) : job.applicationMethod === "internal" || !job.applicationMethod ? (
              <ApplyWithProfileGate
                applyHref={applyHref}
                className="btn-gold-premium mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
              >
                Apply now
              </ApplyWithProfileGate>
            ) : (
              <a
                href={applyHref}
                target={applyExternal ? "_blank" : undefined}
                rel={applyExternal ? "noopener noreferrer" : undefined}
                className="btn-gold-premium mt-3 inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
              >
                Apply now
              </a>
            )}
            {shareUrl ? (
              <div className="mt-3">
                <ShareJobButton jobUrl={shareUrl} jobTitle={job.title} />
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              {browseOnly
                ? "You are viewing jobs in read-only mode. Complete your profile to unlock applications."
                : "Fast and direct process. ArbeidMatch recruits continuously for trusted clients in Norway."}
            </p>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Verified process</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Verified opportunities</li>
              <li>Norway-focused recruitment</li>
              <li>Professional screening process</li>
            </ul>
            {job.applicationEmail ? (
              <a
                href={`mailto:${job.applicationEmail}`}
                className="link-text-premium mt-3 inline-flex text-sm font-medium text-[#C9A84C]"
              >
                Contact support
              </a>
            ) : null}
          </div>
        </aside>
      </div>

      {relatedJobs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Related jobs</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedJobs.map((relatedJob) => (
              <JobCard key={relatedJob.id} job={relatedJob} browseOnly={browseOnly} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#C9A84C]/25 bg-[#0A0F18]/95 p-3 backdrop-blur-sm lg:hidden">
        {browseOnly ? (
          <Link
            href="/candidates"
            className="inline-flex w-full min-h-[46px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.35)] bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[rgba(201,168,76,0.08)]"
          >
            Complete profile to apply
          </Link>
        ) : job.applicationMethod === "internal" || !job.applicationMethod ? (
          <Link
            href={applyHref}
            className="btn-gold-premium inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply now
          </Link>
        ) : (
          <a
            href={applyHref}
            target={applyExternal ? "_blank" : undefined}
            rel={applyExternal ? "noopener noreferrer" : undefined}
            className="btn-gold-premium inline-flex w-full min-h-[46px] items-center justify-center rounded-md bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply now
          </a>
        )}
      </div>
    </div>
  );
}
