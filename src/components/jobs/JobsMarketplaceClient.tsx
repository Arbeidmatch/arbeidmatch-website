"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Search } from "lucide-react";
import type { JobRecord } from "@/lib/jobs/types";
import JobCard from "@/components/jobs/JobCard";
import {
  EMPLOYER_JOB_WORK_TYPES,
  resolveWorkTypeFromCategoryString,
  type EmployerJobWorkType,
} from "@/lib/candidates/profileSchema";

type JobCategory = "All" | EmployerJobWorkType;

function inferCategory(job: JobRecord): EmployerJobWorkType {
  const fromCat = job.category?.trim();
  if (fromCat) {
    const direct = resolveWorkTypeFromCategoryString(fromCat);
    if (direct) return direct;
  }
  const blob = `${job.category ?? ""} ${job.title} ${job.summary ?? ""} ${job.description}`;
  return resolveWorkTypeFromCategoryString(blob) ?? "Construction & Civil";
}

export default function JobsMarketplaceClient({ jobs, browseOnly }: { jobs: JobRecord[]; browseOnly: boolean }) {
  const [candidateEmail, setCandidateEmail] = useState("");
  const isCandidateLoggedIn = candidateEmail.includes("@");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<JobCategory>("All");
  const [smartMode, setSmartMode] = useState<"default" | "match">("default");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartJobs, setSmartJobs] = useState<(JobRecord & { matchScore?: number })[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [panelCategory, setPanelCategory] = useState("All");
  const [panelLocation, setPanelLocation] = useState("");
  const [panelSalaryFrom, setPanelSalaryFrom] = useState("");
  const [panelDriving, setPanelDriving] = useState(false);
  const [panelExperience, setPanelExperience] = useState(3);

  const runSmartMatch = async () => {
    const email = (candidateEmail || "").trim().toLowerCase();
    if (!email.includes("@")) return;
    setSmartLoading(true);
    try {
      const response = await fetch("/api/jobs/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "smart_match",
          email,
          filters: {
            category: panelCategory === "All" ? "" : panelCategory,
            location: panelLocation,
            salaryFrom: panelSalaryFrom ? Number(panelSalaryFrom) : undefined,
            drivingLicenseRequired: panelDriving,
            experienceYears: panelExperience,
          },
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { jobs?: (JobRecord & { matchScore?: number })[] };
      if (response.ok && Array.isArray(data.jobs)) {
        setSmartJobs(data.jobs);
        setSmartMode("match");
      }
    } finally {
      setSmartLoading(false);
    }
  };

  const enriched = useMemo(
    () =>
      jobs.map((job) => ({
        job,
        category: inferCategory(job),
      })),
    [jobs],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = (window.localStorage.getItem("am_candidate_profile_email") || "").trim().toLowerCase();
    setCandidateEmail(email);
  }, []);

  useEffect(() => {
    if (!showFilters || smartMode !== "match" || !isCandidateLoggedIn) return;
    const timer = window.setTimeout(() => {
      void runSmartMatch();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [showFilters, smartMode, panelCategory, panelLocation, panelSalaryFrom, panelDriving, panelExperience, isCandidateLoggedIn]);

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

  const finalJobs = smartMode === "match" ? smartJobs : visibleJobs.map((x) => x.job);

  const stats = useMemo(() => {
    const categories = new Set(enriched.map((item) => item.category));
    return [
      { label: "Live jobs", value: String(jobs.length) },
      { label: "Sectors", value: String(categories.size) },
      { label: "Featured", value: String(jobs.filter((job) => job.featured).length) },
    ];
  }, [enriched, jobs]);

  const filters: JobCategory[] = ["All", ...EMPLOYER_JOB_WORK_TYPES];

  return (
    <div className="min-w-0 overflow-x-hidden bg-[#0D1B2A] text-white">
      <section className="container-site section-y-tight pb-6">
        <div className="mx-auto min-w-0 max-w-5xl text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[rgba(201,168,76,0.08)]">
            <BriefcaseBusiness className="h-7 w-7 text-[#C9A84C]" />
            <div className="pointer-events-none absolute h-16 w-16 rounded-full bg-[rgba(201,168,76,0.12)] blur-xl" aria-hidden />
          </div>
          <h1 className="mt-6 text-balance break-words text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl md:text-5xl">
            Blue-Collar Careers in Norway
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-pretty text-base leading-relaxed text-white/75 md:text-lg">
            Explore opportunities across construction, technical trades, logistics, industry, facility services, and hospitality
            with verified employers across Norway.
          </p>
          {browseOnly ? (
            <p className="mx-auto mt-4 max-w-3xl text-pretty rounded-[12px] border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white/75">
              Browse mode is read-only. Complete your candidate profile to unlock applications.
            </p>
          ) : null}

          <div className="mt-8 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-center transition-all duration-300"
              >
                <p className="text-3xl font-bold text-[#C9A84C]">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.1em] text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site pb-8">
        {isCandidateLoggedIn ? (
          <div className="mb-4 rounded-[16px] border border-[#C9A84C]/25 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">Find jobs that match your profile</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void runSmartMatch()}
                className={`rounded-xl bg-[#C9A84C] px-6 py-3 font-bold text-[#0D1B2A] transition ${smartLoading ? "animate-pulse" : "hover:bg-[#b8953f]"}`}
              >
                Show My Matches
              </button>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="rounded-xl border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Advanced Search
              </button>
            </div>
          </div>
        ) : null}

        {isCandidateLoggedIn && showFilters ? (
          <div className="mb-4 rounded-xl border border-white/15 bg-white/[0.03] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={panelCategory}
                onChange={(e) => setPanelCategory(e.target.value)}
                className="min-h-[44px] rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] px-3 text-sm text-white"
              >
                <option value="All">Job category</option>
                {EMPLOYER_JOB_WORK_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <input
                value={panelLocation}
                onChange={(e) => setPanelLocation(e.target.value)}
                placeholder="Location"
                className="min-h-[44px] rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] px-3 text-sm text-white"
              />
              <select
                value={panelSalaryFrom}
                onChange={(e) => setPanelSalaryFrom(e.target.value)}
                className="min-h-[44px] rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] px-3 text-sm text-white"
              >
                <option value="">Salary from (NOK/hour)</option>
                {[180, 200, 220, 250, 300, 350].map((v) => (
                  <option key={v} value={String(v)}>
                    {v} NOK/hour
                  </option>
                ))}
              </select>
              <label className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] px-3 text-sm text-white">
                <input type="checkbox" checked={panelDriving} onChange={(e) => setPanelDriving(e.target.checked)} className="accent-[#C9A84C]" />
                Driving license required
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs text-white/70">Experience years: {panelExperience}</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={panelExperience}
                  onChange={(e) => setPanelExperience(Number(e.target.value))}
                  className="w-full accent-[#C9A84C]"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowFilters(false);
                }}
                className="rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A] hover:bg-[#b8953f]"
              >
                Hide Filters
              </button>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-4 md:p-5">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search jobs by title, company, location"
              className="min-h-[48px] w-full min-w-0 rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#0a0f18] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,168,76,0.45)] focus:outline-none"
            />
          </label>
          <div className="mt-4 flex min-w-0 flex-wrap justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex touch-manipulation min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
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

      <section className="container-site min-w-0 pb-20">
        {smartLoading ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[18px] border border-[#C9A84C]/20 bg-white/[0.03]" />
            ))}
          </div>
        ) : finalJobs.length === 0 ? (
          <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-4 py-14 text-center sm:px-6">
            <p className="text-balance text-lg font-semibold text-white sm:text-xl">No matching opportunities right now.</p>
            <p className="mt-2 text-pretty text-sm text-white/70">Try another keyword or switch category filters.</p>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {finalJobs.map((job) => (
              <JobCard key={job.id} job={job} browseOnly={browseOnly} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
