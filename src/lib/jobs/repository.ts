import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { JOBS_MOCK_DATA } from "@/lib/jobs/data";
import { getEmployerJobBySlug, getEmployerJobBySlugAnyStatus, listLiveEmployerJobsAsRecords } from "@/lib/employer-flow/employerJobsRepository";
import type { AdminJobsFilters, JobRecord, JobStatus } from "@/lib/jobs/types";

const DATA_DIR = path.join(process.cwd(), "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeOptionalText(value?: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function normalizeList(value?: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return textToList(value);
}

async function ensureJobsFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(JOBS_FILE, "utf8");
  } catch {
    await writeFile(JOBS_FILE, JSON.stringify(JOBS_MOCK_DATA, null, 2), "utf8");
  }
}

export async function listAllJobs(): Promise<JobRecord[]> {
  await ensureJobsFile();
  const content = await readFile(JOBS_FILE, "utf8");
  const parsed = JSON.parse(content) as JobRecord[];
  return parsed.sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());
}

async function persistJobs(jobs: JobRecord[]): Promise<void> {
  await ensureJobsFile();
  await writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf8");
}

export function sanitizeJob(job: JobRecord): JobRecord {
  return {
    ...job,
    title: job.title.trim(),
    slug: job.slug.trim(),
    location: job.location.trim(),
    companyName: normalizeOptionalText(job.companyName),
    category: normalizeOptionalText(job.category),
    trade: normalizeOptionalText(job.trade),
    contractType: normalizeOptionalText(job.contractType),
    workModel: normalizeOptionalText(job.workModel),
    languageRequirement: normalizeOptionalText(job.languageRequirement),
    salary: normalizeOptionalText(job.salary),
    summary: normalizeOptionalText(job.summary),
    description: job.description.trim(),
    responsibilities: normalizeList(job.responsibilities),
    requirements: normalizeList(job.requirements),
    benefits: normalizeList(job.benefits),
    applicationUrl: normalizeOptionalText(job.applicationUrl),
    applicationEmail: normalizeOptionalText(job.applicationEmail),
    syncError: normalizeOptionalText(job.syncError),
  };
}

async function makeUniqueSlug(jobs: JobRecord[], title: string, currentId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (jobs.some((job) => job.slug === candidate && job.id !== currentId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function createManualJob(input: Omit<JobRecord, "id" | "source" | "slug" | "createdAt" | "updatedAt">): Promise<JobRecord> {
  const jobs = await listAllJobs();
  const timestamp = nowIso();
  const created = sanitizeJob({
    ...input,
    id: `job-${randomUUID()}`,
    source: "manual",
    slug: await makeUniqueSlug(jobs, input.title),
    syncStatus: "none",
    syncError: null,
    externalId: null,
    publishedAt: input.status === "active" ? input.publishedAt ?? toDateOnly(timestamp) : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await persistJobs([created, ...jobs]);
  return created;
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const jobs = await listAllJobs();
  return jobs.find((job) => job.id === id) ?? null;
}

export async function getJobBySlug(
  slug: string,
  opts?: { employerBoardAnyStatus?: boolean },
): Promise<JobRecord | null> {
  if (opts?.employerBoardAnyStatus) {
    const board = await getEmployerJobBySlugAnyStatus(slug);
    if (board) return board;
  } else {
    const board = await getEmployerJobBySlug(slug);
    if (board) return board;
  }
  const jobs = await listAllJobs();
  return jobs.find((job) => job.slug === slug) ?? null;
}

export async function updateManualJob(
  id: string,
  input: Partial<Omit<JobRecord, "id" | "source" | "externalId" | "createdAt">>,
): Promise<JobRecord | null> {
  const jobs = await listAllJobs();
  const current = jobs.find((job) => job.id === id);
  if (!current) return null;
  if (current.source !== "manual") return null;

  const nextTitle = input.title ?? current.title;
  const updated = sanitizeJob({
    ...current,
    ...input,
    slug: await makeUniqueSlug(jobs, nextTitle, current.id),
    updatedAt: nowIso(),
  });
  const next = jobs.map((job) => (job.id === id ? updated : job));
  await persistJobs(next);
  return updated;
}

export async function publishJob(id: string): Promise<JobRecord | null> {
  const jobs = await listAllJobs();
  const current = jobs.find((job) => job.id === id);
  if (!current) return null;
  const updated: JobRecord = {
    ...current,
    status: current.status === "active" ? "draft" : "active",
    publishedAt: current.status === "active" ? null : current.publishedAt ?? toDateOnly(nowIso()),
    updatedAt: nowIso(),
  };
  await persistJobs(jobs.map((job) => (job.id === id ? updated : job)));
  return updated;
}

export async function archiveJob(id: string): Promise<JobRecord | null> {
  const jobs = await listAllJobs();
  const current = jobs.find((job) => job.id === id);
  if (!current) return null;
  const updated: JobRecord = { ...current, status: "archived", updatedAt: nowIso() };
  await persistJobs(jobs.map((job) => (job.id === id ? updated : job)));
  return updated;
}

export async function upsertRecmanJob(input: JobRecord): Promise<{ job: JobRecord; created: boolean }> {
  const jobs = await listAllJobs();
  const matched = jobs.find((job) => job.source === "recman" && job.externalId && job.externalId === input.externalId);
  const timestamp = nowIso();
  const base = sanitizeJob({
    ...input,
    source: "recman",
    syncStatus: input.syncStatus ?? "synced",
    lastSyncedAt: timestamp,
    updatedAt: timestamp,
    createdAt: matched?.createdAt ?? input.createdAt ?? timestamp,
    slug: matched?.slug ?? (await makeUniqueSlug(jobs, input.title)),
  });

  if (!matched) {
    const created = { ...base, id: base.id || `job-${randomUUID()}` };
    await persistJobs([created, ...jobs]);
    return { job: created, created: true };
  }

  const updated = { ...matched, ...base, id: matched.id, source: "recman" as const };
  await persistJobs(jobs.map((job) => (job.id === matched.id ? updated : job)));
  return { job: updated, created: false };
}

export async function markRecmanJobsMissing(externalIds: string[]): Promise<number> {
  const jobs = await listAllJobs();
  let changed = 0;
  const next = jobs.map((job) => {
    if (job.source !== "recman" || !job.externalId) return job;
    if (externalIds.includes(job.externalId)) return job;
    if (job.status === "closed" || job.status === "archived") return job;
    changed += 1;
    return { ...job, status: "closed" as JobStatus, syncStatus: "error" as const, syncError: "Missing in RecMan feed", updatedAt: nowIso() };
  });
  if (changed > 0) {
    await persistJobs(next);
  }
  return changed;
}

export async function getPublicJobs(): Promise<JobRecord[]> {
  const [jobs, board] = await Promise.all([listAllJobs(), listLiveEmployerJobsAsRecords()]);
  const activeFile = jobs.filter((job) => job.status === "active");
  const merged = [...board, ...activeFile];
  return merged.sort((a, b) => {
    const da = new Date(a.publishedAt ?? a.createdAt ?? "1970-01-01").getTime();
    const db = new Date(b.publishedAt ?? b.createdAt ?? "1970-01-01").getTime();
    return db - da;
  });
}

export async function getRelatedJobs(target: JobRecord): Promise<JobRecord[]> {
  const jobs = await getPublicJobs();
  return jobs
    .filter((job) => job.id !== target.id)
    .sort((a, b) => {
      const aScore = Number(a.category === target.category) + Number(a.location === target.location) + Number(a.trade === target.trade);
      const bScore = Number(b.category === target.category) + Number(b.location === target.location) + Number(b.trade === target.trade);
      return bScore - aScore;
    })
    .slice(0, 3);
}

export async function getAdminJobs(filters?: AdminJobsFilters): Promise<JobRecord[]> {
  let jobs = await listAllJobs();
  if (!filters) return jobs;

  if (filters.source && filters.source !== "all") {
    jobs = jobs.filter((job) => job.source === filters.source);
  }
  if (filters.status && filters.status !== "all") {
    jobs = jobs.filter((job) => job.status === filters.status);
  }
  if (filters.location) {
    jobs = jobs.filter((job) => job.location === filters.location);
  }
  if (filters.category) {
    jobs = jobs.filter((job) => (job.category ?? "") === filters.category);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    jobs = jobs.filter((job) => [job.title, job.location, job.category ?? "", job.trade ?? ""].join(" ").toLowerCase().includes(q));
  }
  return jobs;
}

// Compatibility exports used by already implemented public routes.
export const listPublicActiveJobs = getPublicJobs;
