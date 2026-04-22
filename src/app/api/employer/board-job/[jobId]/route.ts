import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { insertAuditLog } from "@/lib/audit/masterAuditLog";
import { getEmployerDraftJobForEdit, updateEmployerBoardJobById } from "@/lib/employer-flow/employerJobsRepository";
import { noStoreJson } from "@/lib/apiSecurity";

type RouteContext = { params: Promise<{ jobId: string }> };

const patchBodySchema = z.object({
  secret: z.string().min(1),
  title: z.string().trim().min(4).max(200),
  description: z.string().trim().min(1).max(20000),
  requirements: z.string().trim().min(1).max(10000),
  salaryMin: z.union([z.number(), z.null()]).optional(),
  salaryMax: z.union([z.number(), z.null()]).optional(),
  status: z.enum(["draft", "live", "closed", "archived"]),
});

export async function GET(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!jobId || !token) {
    return noStoreJson({ error: "Missing job or token." }, { status: 400 });
  }

  const row = await getEmployerDraftJobForEdit(jobId, token);
  if (!row) {
    return noStoreJson({ error: "Invalid or expired link." }, { status: 404 });
  }

  return noStoreJson({
    job: {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      companyName: row.company_name,
      location: row.location,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return noStoreJson({ error: "Missing job id." }, { status: 400 });
  }

  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) {
    return noStoreJson({ error: "Not available." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return noStoreJson({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.secret !== expected) {
    return noStoreJson({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await updateEmployerBoardJobById({
    jobId,
    title: parsed.data.title,
    description: parsed.data.description,
    requirements: parsed.data.requirements,
    salary_min: parsed.data.salaryMin ?? null,
    salary_max: parsed.data.salaryMax ?? null,
    status: parsed.data.status,
  });

  if (!result.ok) {
    return noStoreJson({ error: result.reason }, { status: 400 });
  }

  void insertAuditLog({
    eventType: "job_post_edited",
    entityType: "job",
    entityId: jobId,
    actor: "admin",
    metadata: { status: parsed.data.status },
  });

  return noStoreJson({ success: true });
}
