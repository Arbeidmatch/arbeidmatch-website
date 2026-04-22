import type { JobRecord } from "@/lib/jobs/types";
import { markRecmanJobsMissing, upsertRecmanJob } from "@/lib/jobs/repository";

type RecmanJob = {
  id: string;
  title: string;
  location: string;
  category?: string;
  trade?: string;
  contractType?: string;
  workModel?: string;
  summary?: string;
  description: string;
  applicationUrl?: string;
  publishedAt?: string;
  status?: "active" | "closed";
};

export async function fetchRecmanJobs(): Promise<RecmanJob[]> {
  // TODO: Replace mock with real RecMan API integration.
  return [
    {
      id: "RM-78431",
      title: "TIG Welder, Bergen Shipyard",
      location: "Bergen",
      category: "Welding",
      trade: "TIG Welder",
      contractType: "Temporary",
      workModel: "Bemanning",
      summary: "Precision TIG welding for marine upgrades.",
      description: "Experienced TIG welders needed for shipyard retrofit projects.",
      applicationUrl: "https://apply.recman.no/arbeidmatch/jobs/78431",
      publishedAt: "2026-04-16",
      status: "active",
    },
    {
      id: "RM-78477",
      title: "Truck Driver C-Class, Stavanger",
      location: "Stavanger",
      category: "Transport",
      trade: "Truck Driver",
      contractType: "Temporary",
      workModel: "Bemanning",
      description: "Reliable C-class drivers needed for regional logistics routes.",
      applicationUrl: "https://apply.recman.no/arbeidmatch/jobs/78477",
      publishedAt: "2026-04-12",
      status: "active",
    },
  ];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function mapRecmanJobToLocalJob(recman: RecmanJob): JobRecord {
  const now = new Date().toISOString();
  return {
    id: "",
    source: "recman",
    externalId: recman.id,
    title: recman.title,
    slug: slugify(recman.title),
    companyName: null,
    hideCompany: true,
    location: recman.location,
    category: recman.category ?? null,
    trade: recman.trade ?? null,
    contractType: recman.contractType ?? null,
    workModel: recman.workModel ?? null,
    languageRequirement: null,
    salary: null,
    summary: recman.summary ?? null,
    description: recman.description,
    responsibilities: [],
    requirements: [],
    benefits: [],
    startDate: null,
    applicationMethod: "external_url",
    applicationUrl: recman.applicationUrl ?? null,
    applicationEmail: null,
    status: recman.status === "closed" ? "closed" : "active",
    featured: false,
    publishedAt: recman.publishedAt ?? now.slice(0, 10),
    expiryDate: null,
    applicationCount: 0,
    syncStatus: "synced",
    syncError: null,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export async function syncRecmanJobs(): Promise<{ created: number; updated: number; closed: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  try {
    const recmanJobs = await fetchRecmanJobs();
    const externalIds: string[] = [];

    for (const recmanJob of recmanJobs) {
      externalIds.push(recmanJob.id);
      try {
        const mapped = mapRecmanJobToLocalJob(recmanJob);
        const upsert = await upsertRecmanJob(mapped);
        if (upsert.created) created += 1;
        else updated += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "RecMan upsert failed");
      }
    }

    const closed = await markMissingRecmanJobsClosed(externalIds);
    return { created, updated, closed, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "RecMan sync failed");
    return { created, updated, closed: 0, errors };
  }
}

export async function markMissingRecmanJobsClosed(currentExternalIds: string[]): Promise<number> {
  return markRecmanJobsMissing(currentExternalIds);
}
