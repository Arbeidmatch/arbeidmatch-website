"use client";

import Link from "next/link";
import ApplyWithProfileGate from "@/components/jobs/ApplyWithProfileGate";
import type { JobRecord } from "@/lib/jobs/types";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function JobCard({ job, browseOnly = false }: { job: JobRecord; browseOnly?: boolean }) {
  const applyHref =
    job.applicationMethod === "external_url"
      ? job.applicationUrl || `/jobs/${job.slug}/apply`
      : job.applicationMethod === "email"
        ? `mailto:${job.applicationEmail || "post@arbeidmatch.no"}`
        : `/jobs/${job.slug}/apply`;
  const applyExternal = job.applicationMethod === "external_url";
  const viewHref = browseOnly ? `/jobs/${job.slug}?browse=1` : `/jobs/${job.slug}`;

  return (
    <article className="card-premium rounded-[18px] border border-[#C9A84C]/20 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
        <span className="rounded-full border border-[#C9A84C]/30 px-2.5 py-1 text-[#C9A84C]">{job.category ?? "General"}</span>
        <span>{job.location}</span>
        <span className="text-white/40">•</span>
        <span>{job.contractType ?? "Standard"}</span>
      </div>

      <h3 className="mt-4 text-xl font-semibold leading-tight text-white">{job.title}</h3>
      <p className="mt-2 text-sm text-white/75">
        {!job.hideCompany && job.companyName ? job.companyName : "On behalf of client"}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{job.summary ?? job.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">{job.trade ? <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/75">{job.trade}</span> : null}</div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#0D1B2A]/60 p-3 text-xs text-white/75">
        <div>
          <p className="text-white/45">Published</p>
          <p className="mt-0.5 font-medium text-white">{job.publishedAt ? formatDate(job.publishedAt) : "-"}</p>
        </div>
        <div>
          <p className="text-white/45">Work model</p>
          <p className="mt-0.5 font-medium text-white">{job.workModel ?? "-"}</p>
        </div>
        <div>
          <p className="text-white/45">Application</p>
          <p className="mt-0.5 font-medium text-white">{job.applicationMethod ?? "internal"}</p>
        </div>
        <div>
          <p className="text-white/45">Salary</p>
          <p className="mt-0.5 font-medium text-white">{job.salary ?? "Based on experience"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href={viewHref}
          className="btn-outline-premium inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#C9A84C]/35 px-4 py-2 text-sm font-semibold text-[#C9A84C]"
        >
          View job
        </Link>
        {browseOnly ? (
          <Link
            href="/for-candidates"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.35)] bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[rgba(201,168,76,0.08)]"
          >
            How to unlock applications
          </Link>
        ) : job.applicationMethod === "internal" || !job.applicationMethod ? (
          <ApplyWithProfileGate
            applyHref={applyHref}
            className="btn-gold-premium inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply now
          </ApplyWithProfileGate>
        ) : (
          <a
            href={applyHref}
            target={applyExternal ? "_blank" : undefined}
            rel={applyExternal ? "noopener noreferrer" : undefined}
            className="btn-gold-premium inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply now
          </a>
        )}
      </div>
    </article>
  );
}
