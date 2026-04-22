"use client";

import Link from "next/link";
import { ImageIcon } from "lucide-react";
import ApplyWithProfileGate from "@/components/jobs/ApplyWithProfileGate";
import JobFitCheckButton from "@/components/jobs/JobFitCheckButton";
import type { JobRecord } from "@/lib/jobs/types";

const THUMB_SIZE = "h-[72px] w-[72px] sm:h-20 sm:w-20";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const btnBase =
  "inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-md px-4 text-sm font-semibold transition-opacity sm:w-auto";

export default function JobCard({ job, browseOnly = false }: { job: JobRecord; browseOnly?: boolean }) {
  const applyHref =
    job.applicationMethod === "external_url"
      ? job.applicationUrl || `/jobs/${job.slug}/apply`
      : job.applicationMethod === "email"
        ? `mailto:${job.applicationEmail || "post@arbeidmatch.no"}`
        : `/jobs/${job.slug}/apply`;
  const applyExternal = job.applicationMethod === "external_url";
  const viewHref = browseOnly ? `/jobs/${job.slug}?browse=1` : `/jobs/${job.slug}`;
  const snippet = job.summary ?? job.description;
  const mainImage = job.imageMain?.trim() || null;

  return (
    <article className="card-premium group/card relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#C9A84C]/20 bg-white/[0.03] p-4 sm:p-5 md:p-6">
      <Link
        href={viewHref}
        className="absolute right-4 top-4 z-10 rounded-xl outline-none ring-offset-2 ring-offset-[#0a1624] focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 sm:right-5 sm:top-5 md:right-6 md:top-6"
        aria-label={`Job image — ${job.title}`}
      >
        <div
          className={`relative ${THUMB_SIZE} shrink-0 overflow-hidden rounded-xl border border-[#C9A84C]/35 bg-[#0D1B2A] shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-[filter,box-shadow] duration-300 ease-out group-hover/card:brightness-[1.07] group-hover/card:shadow-[0_6px_18px_rgba(201,168,76,0.12)]`}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt=""
              className="h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover/card:brightness-[1.07]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0D1B2A]">
              <ImageIcon className="h-8 w-8 text-white/[0.22] sm:h-9 sm:w-9" strokeWidth={1.25} aria-hidden />
            </div>
          )}
        </div>
      </Link>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 pr-[5.5rem] sm:pr-24">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="shrink-0 rounded-full border border-[#C9A84C]/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">
            {job.category ?? "General"}
          </span>
          <span className="min-w-0 max-w-full truncate rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
            {job.contractType ?? "Standard"}
          </span>
        </div>

        <h3 className="line-clamp-2 min-w-0 text-lg font-semibold leading-snug text-white sm:text-xl">{job.title}</h3>

        <p className="min-w-0 truncate text-sm text-white/75">
          {!job.hideCompany && job.companyName ? job.companyName : "On behalf of client"}
        </p>

        <p className="min-w-0 truncate text-sm text-white/65">{job.location}</p>

        <p className="line-clamp-3 min-w-0 text-sm leading-relaxed text-white/70">{snippet}</p>

        {job.trade ? (
          <div className="min-w-0">
            <span className="inline-block max-w-full truncate rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/75">
              {job.trade}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex min-w-0 shrink-0 flex-col gap-4 pt-4">
        <div className="grid min-w-0 grid-cols-2 gap-2.5 rounded-xl border border-white/10 bg-[#0D1B2A]/60 p-3 text-xs text-white/75">
          <div className="min-w-0">
            <p className="text-white/45">Published</p>
            <p className="mt-0.5 truncate font-medium text-white">{job.publishedAt ? formatDate(job.publishedAt) : "-"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-white/45">Work model</p>
            <p className="mt-0.5 truncate font-medium text-white">{job.workModel ?? "-"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-white/45">Application</p>
            <p className="mt-0.5 truncate font-medium text-white">{job.applicationMethod ?? "internal"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-white/45">Salary</p>
            <p className="mt-0.5 truncate font-medium text-white">{job.salary ?? "Based on experience"}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-stretch">
          <Link
            href={viewHref}
            className={`btn-outline-premium ${btnBase} shrink-0 border border-[#C9A84C]/35 text-[#C9A84C] hover:bg-[rgba(201,168,76,0.08)] sm:min-w-[8.75rem] sm:w-[8.75rem]`}
          >
            View job
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:gap-2.5">
            {browseOnly ? (
              job.applicationMethod === "internal" || !job.applicationMethod ? (
                <ApplyWithProfileGate
                  applyHref={`/jobs/${job.slug}/apply`}
                  className={`btn-gold-premium ${btnBase} flex-1 bg-[#C9A84C] font-bold text-[#0D1B2A] hover:opacity-95 sm:min-w-0 sm:flex-1`}
                >
                  Apply
                </ApplyWithProfileGate>
              ) : (
                <a
                  href={applyHref}
                  target={applyExternal ? "_blank" : undefined}
                  rel={applyExternal ? "noopener noreferrer" : undefined}
                  className={`btn-gold-premium ${btnBase} flex-1 bg-[#C9A84C] font-bold text-[#0D1B2A] hover:opacity-95 sm:min-w-0 sm:flex-1`}
                >
                  Apply
                </a>
              )
            ) : job.applicationMethod === "internal" || !job.applicationMethod ? (
              <ApplyWithProfileGate
                applyHref={applyHref}
                className={`btn-gold-premium ${btnBase} flex-1 bg-[#C9A84C] font-bold text-[#0D1B2A] hover:opacity-95 sm:min-w-0 sm:flex-1`}
              >
                Apply
              </ApplyWithProfileGate>
            ) : (
              <a
                href={applyHref}
                target={applyExternal ? "_blank" : undefined}
                rel={applyExternal ? "noopener noreferrer" : undefined}
                className={`btn-gold-premium ${btnBase} flex-1 bg-[#C9A84C] font-bold text-[#0D1B2A] hover:opacity-95 sm:min-w-0 sm:flex-1`}
              >
                Apply
              </a>
            )}
            <JobFitCheckButton job={job} browseOnly={browseOnly} className="flex-1" />
          </div>
        </div>
      </div>
    </article>
  );
}
