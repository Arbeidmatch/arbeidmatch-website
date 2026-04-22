import { z } from "zod";
import type { JobRecord } from "@/lib/jobs/types";

const manualJobBaseSchema = z.object({
    title: z.string().trim().min(3),
    companyName: z.string().trim().optional().default(""),
    hideCompany: z.boolean().optional().default(false),
    location: z.string().trim().min(2),
    category: z.string().trim().optional().default(""),
    trade: z.string().trim().optional().default(""),
    contractType: z.string().trim().optional().default(""),
    workModel: z.string().trim().optional().default("Recruitment"),
    languageRequirement: z.string().trim().optional().default(""),
    salary: z.string().trim().optional().default(""),
    summary: z.string().trim().optional().default(""),
    description: z.string().trim().min(10),
    responsibilities: z.string().trim().optional().default(""),
    requirements: z.string().trim().optional().default(""),
    benefits: z.string().trim().optional().default(""),
    startDate: z.string().trim().optional().default(""),
    applicationMethod: z.enum(["internal", "external_url", "email"]).default("internal"),
    applicationUrl: z.string().trim().optional().default(""),
    applicationEmail: z.string().trim().optional().default(""),
    status: z.enum(["draft", "active", "closed", "archived"]).default("draft"),
    featured: z.boolean().optional().default(false),
    expiryDate: z.string().trim().optional().default(""),
  });

export const manualJobCreateSchema = manualJobBaseSchema
  .superRefine((value, ctx) => {
    if (value.applicationMethod === "external_url" && !value.applicationUrl) {
      ctx.addIssue({ code: "custom", path: ["applicationUrl"], message: "Application URL is required." });
    }
    if (value.applicationMethod === "email" && !value.applicationEmail) {
      ctx.addIssue({ code: "custom", path: ["applicationEmail"], message: "Application email is required." });
    }
  });

export const manualJobUpdateSchema = manualJobBaseSchema.partial();

function listFromTextarea(input: string): string[] {
  return input
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapManualInputToJobPayload(input: z.infer<typeof manualJobCreateSchema>): Omit<JobRecord, "id" | "slug" | "source" | "createdAt" | "updatedAt"> {
  const publishedAt = input.status === "active" ? new Date().toISOString().slice(0, 10) : null;
  return {
    externalId: null,
    title: input.title,
    companyName: input.companyName || null,
    hideCompany: input.hideCompany,
    location: input.location,
    category: input.category || null,
    trade: input.trade || null,
    contractType: input.contractType || null,
    workModel: input.workModel || null,
    languageRequirement: input.languageRequirement || null,
    salary: input.salary || null,
    summary: input.summary || null,
    description: input.description,
    responsibilities: listFromTextarea(input.responsibilities),
    requirements: listFromTextarea(input.requirements),
    benefits: listFromTextarea(input.benefits),
    startDate: input.startDate || null,
    applicationMethod: input.applicationMethod,
    applicationUrl: input.applicationUrl || null,
    applicationEmail: input.applicationEmail || null,
    status: input.status,
    featured: input.featured,
    publishedAt,
    expiryDate: input.expiryDate || null,
    applicationCount: 0,
    syncStatus: "none",
    syncError: null,
    lastSyncedAt: null,
  };
}
