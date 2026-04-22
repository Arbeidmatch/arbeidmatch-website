"use client";

import { useMemo, useState } from "react";
import JobCard from "@/components/jobs/JobCard";
import type { JobFilterOptions, JobRecord } from "@/lib/jobs/types";
import { DEFAULT_JOB_FILTERS, filterJobs, sortJobs } from "@/lib/jobs/utils";

const PAGE_SIZE = 6;

interface JobsBoardClientProps {
  jobs: JobRecord[];
  filterOptions: JobFilterOptions;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/65">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="select-premium input-premium--dark h-11 rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm font-medium normal-case tracking-normal text-white"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function JobsBoardClient({ jobs, filterOptions }: JobsBoardClientProps) {
  const [filters, setFilters] = useState(DEFAULT_JOB_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredJobs = useMemo(() => {
    const listed = filterJobs(jobs, filters);
    return sortJobs(listed, filters);
  }, [filters, jobs]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMore = filteredJobs.length > visibleCount;

  return (
    <section className="container-site pb-20 pt-8 md:pt-10">
      <div className="rounded-[20px] border border-[#C9A84C]/20 bg-white/[0.03] p-5 md:p-7">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="md:col-span-2 lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-white/65">Keyword</span>
            <input
              value={filters.keyword}
              onChange={(event) => {
                setVisibleCount(PAGE_SIZE);
                setFilters((prev) => ({ ...prev, keyword: event.target.value }));
              }}
              placeholder="Trade, city, role, keyword"
              className="input-premium--dark h-11 w-full rounded-md border border-white/15 bg-[#0A0F18] px-4 text-sm text-white placeholder:text-white/40"
            />
          </label>

          <FilterSelect
            label="Sort by"
            value={filters.sortBy}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, sortBy: value as "newest" | "relevance" }));
            }}
            options={["newest", "relevance"]}
          />

          <FilterSelect
            label="City"
            value={filters.city}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, city: value }));
            }}
            options={filterOptions.cities}
          />

          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, category: value }));
            }}
            options={filterOptions.categories}
          />

          <FilterSelect
            label="Trade"
            value={filters.trade}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, trade: value }));
            }}
            options={filterOptions.trades}
          />

          <FilterSelect
            label="Contract"
            value={filters.contractType}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, contractType: value }));
            }}
            options={filterOptions.contractTypes}
          />

          <FilterSelect
            label="Work type"
            value={filters.workModel}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, workModel: value }));
            }}
            options={filterOptions.workModels}
          />

          <FilterSelect
            label="Language"
            value={filters.languageRequirement}
            onChange={(value) => {
              setVisibleCount(PAGE_SIZE);
              setFilters((prev) => ({ ...prev, languageRequirement: value }));
            }}
            options={filterOptions.languageRequirements}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
          <span className="rounded-full border border-white/15 px-3 py-1">{filteredJobs.length} matching jobs</span>
          <button
            type="button"
            onClick={() => {
              setVisibleCount(PAGE_SIZE);
              setFilters(DEFAULT_JOB_FILTERS);
            }}
            className="btn-outline-premium rounded-full border border-white/20 px-3 py-1 font-semibold text-white/75"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="mt-8">
        {filteredJobs.length === 0 ? (
          <div className="rounded-[18px] border border-white/15 bg-white/[0.03] px-6 py-12 text-center">
            <h3 className="text-xl font-semibold text-white">No jobs matched your filters</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/70">
              Try a broader keyword or remove one filter. We recruit continuously for Norway-focused opportunities.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {hasMore ? (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="btn-gold-premium inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0D1B2A]"
                >
                  Load more jobs
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
