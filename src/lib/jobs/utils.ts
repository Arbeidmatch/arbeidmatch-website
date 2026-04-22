import type { JobFilterOptions, JobFilters, JobRecord } from "@/lib/jobs/types";

export const DEFAULT_JOB_FILTERS: JobFilters = {
  keyword: "",
  city: "all",
  category: "all",
  trade: "all",
  contractType: "all",
  workModel: "all",
  languageRequirement: "all",
  sortBy: "newest",
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function filterJobs(jobs: JobRecord[], filters: JobFilters): JobRecord[] {
  const keyword = normalize(filters.keyword);

  return jobs.filter((job) => {
    if (filters.city !== "all" && job.location !== filters.city) return false;
    if (filters.category !== "all" && (job.category ?? "") !== filters.category) return false;
    if (filters.trade !== "all" && (job.trade ?? "") !== filters.trade) return false;
    if (filters.contractType !== "all" && (job.contractType ?? "") !== filters.contractType) return false;
    if (filters.workModel !== "all" && (job.workModel ?? "") !== filters.workModel) return false;
    if (
      filters.languageRequirement !== "all" &&
      (job.languageRequirement ?? "English") !== filters.languageRequirement
    ) {
      return false;
    }

    if (!keyword) return true;

    const searchableText = [
      job.title,
      job.location,
      job.category ?? "",
      job.trade ?? "",
      job.summary ?? "",
      job.description,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });
}

function keywordScore(job: JobRecord, keyword: string): number {
  if (!keyword) return 0;
  const q = normalize(keyword);
  let score = 0;
  if (job.title.toLowerCase().includes(q)) score += 10;
  if ((job.trade ?? "").toLowerCase().includes(q)) score += 8;
  if ((job.category ?? "").toLowerCase().includes(q)) score += 6;
  if ((job.summary ?? "").toLowerCase().includes(q)) score += 4;
  return score;
}

export function sortJobs(jobs: JobRecord[], filters: JobFilters): JobRecord[] {
  const sorted = [...jobs];

  if (filters.sortBy === "relevance" && filters.keyword.trim().length > 0) {
    sorted.sort((a, b) => {
      const byScore = keywordScore(b, filters.keyword) - keywordScore(a, filters.keyword);
      if (byScore !== 0) return byScore;
      return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();
    });
    return sorted;
  }

  sorted.sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
  return sorted;
}

export function getJobBySlug(jobs: JobRecord[], slug: string): JobRecord | undefined {
  return jobs.find((job) => job.slug === slug && job.status === "active");
}

export function getRelatedJobs(jobs: JobRecord[], currentJob: JobRecord, max = 3): JobRecord[] {
  return jobs
    .filter((job) => job.slug !== currentJob.slug)
    .sort((a, b) => {
      const aScore =
        Number(a.category === currentJob.category) +
        Number(a.location === currentJob.location) +
        Number(a.trade === currentJob.trade);
      const bScore =
        Number(b.category === currentJob.category) +
        Number(b.location === currentJob.location) +
        Number(b.trade === currentJob.trade);
      return bScore - aScore;
    })
    .slice(0, max);
}

export function getFilterOptions(jobs: JobRecord[]): JobFilterOptions {
  return {
    cities: Array.from(new Set(jobs.map((job) => job.location))).sort(),
    categories: Array.from(new Set(jobs.map((job) => job.category ?? "").filter(Boolean))).sort(),
    trades: Array.from(new Set(jobs.map((job) => job.trade ?? "").filter(Boolean))).sort(),
    contractTypes: Array.from(new Set(jobs.map((job) => job.contractType ?? "").filter(Boolean))).sort(),
    workModels: Array.from(new Set(jobs.map((job) => job.workModel ?? "").filter(Boolean))).sort(),
    languageRequirements: Array.from(
      new Set(jobs.flatMap((job) => (job.languageRequirement ? [job.languageRequirement] : []))).values(),
    ).sort() as JobFilterOptions["languageRequirements"],
  };
}
