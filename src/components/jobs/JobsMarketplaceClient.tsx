"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, Search } from "lucide-react";
import type { JobRecord } from "@/lib/jobs/types";
import JobCard from "@/components/jobs/JobCard";

type JobCategory = "All" | "Offshore" | "Onshore" | "Transport" | "Automotive";

function inferCategory(job: JobRecord): Exclude<JobCategory, "All"> {
  const raw = `${job.category ?? ""} ${job.title} ${job.summary ?? ""} ${job.description}`.toLowerCase();
  if (raw.includes("offshore")) return "Offshore";
  if (raw.includes("transport") || raw.includes("driver") || raw.includes("logistics")) return "Transport";
  if (raw.includes("auto") || raw.includes("vehicle") || raw.includes("mechanic")) return "Automotive";
  return "Onshore";
}

export default function JobsMarketplaceClient({ jobs, browseOnly }: { jobs: JobRecord[]; browseOnly: boolean }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<JobCategory>("All");

  const enriched = useMemo(
    () =>
      jobs.map((job) => ({
        job,
        category: inferCategory(job),
      })),
    [jobs],
  );

  const visibleJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return enriched.filter(({ job, category }) => {
      const inCategory = activeFilter === "All" || category === activeFilter;
      if (!inCategory) return false;
      if (!normalized) return true;
      const haystack = `${job.title} ${job.companyName ?? ""} ${job.location} ${job.trade ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activeFilter, enriched, query]);

  const stats = useMemo(() => {
    const categories = new Set(enriched.map((item) => item.category));
    return [
      { label: "Live jobs", value: String(jobs.length) },
      { label: "Sectors", value: String(categories.size) },
      { label: "Featured", value: String(jobs.filter((job) => job.featured).length) },
    ];
  }, [enriched, jobs]);

  const filters: JobCategory[] = ["All", "Offshore", "Onshore", "Transport", "Automotive"];

  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="container-site section-y-tight pb-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[rgba(201,168,76,0.08)]">
            <BriefcaseBusiness className="h-7 w-7 text-[#C9A84C]" />
            <div className="pointer-events-none absolute h-16 w-16 rounded-full bg-[rgba(201,168,76,0.12)] blur-xl" aria-hidden />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-[-0.02em] text-white md:text-5xl">Blue-Collar Careers in Norway</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
            Explore opportunities across offshore, onshore, transport, and automotive sectors with verified employers across
            Norway.
          </p>
          {browseOnly ? (
            <p className="mx-auto mt-4 max-w-3xl rounded-[12px] border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white/75">
              Browse mode is read-only. Complete your candidate profile to unlock applications.
            </p>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-5 text-center transition-all duration-300"
              >
                <p className="text-3xl font-bold text-[#C9A84C]">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.1em] text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site pb-8">
        <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-4 md:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search jobs by title, company, location"
              className="h-12 w-full rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,168,76,0.45)] focus:outline-none"
            />
          </label>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                  activeFilter === filter
                    ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                    : "border-white/15 bg-[rgba(255,255,255,0.02)] text-white/75 hover:border-[rgba(201,168,76,0.35)] hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site pb-20">
        {visibleJobs.length === 0 ? (
          <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-14 text-center">
            <p className="text-xl font-semibold text-white">No matching opportunities right now.</p>
            <p className="mt-2 text-sm text-white/70">Try another keyword or switch category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleJobs.map(({ job }) => (
              <JobCard key={job.id} job={job} browseOnly={browseOnly} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
