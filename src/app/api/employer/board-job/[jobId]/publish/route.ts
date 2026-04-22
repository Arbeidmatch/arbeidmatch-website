import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { noStoreJson } from "@/lib/apiSecurity";
import { insertAuditLog } from "@/lib/audit/masterAuditLog";
import { commitEmployerJobEdit } from "@/lib/employer-flow/employerJobsRepository";

const bodySchema = z.object({
  token: z.string().uuid(),
  title: z.string().trim().min(4).max(200),
  description: z.string().trim().min(40).max(20000),
  requirements: z.string().trim().min(10).max(10000),
});

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return noStoreJson({ error: "Missing job id." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return noStoreJson({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return noStoreJson({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await commitEmployerJobEdit({
    jobId,
    token: parsed.data.token,
    title: parsed.data.title,
    description: parsed.data.description,
    requirements: parsed.data.requirements,
  });

  if (!result.ok) {
    return noStoreJson({ error: result.reason }, { status: 400 });
  }

  void insertAuditLog({
    eventType: "job_post_published",
    entityType: "job",
    entityId: jobId,
    actor: "employer",
    metadata: { slug: result.slug },
  });

  return noStoreJson({ success: true, slug: result.slug });
}
