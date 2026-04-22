import { NextRequest, NextResponse } from "next/server";
import { getEmployerDraftJobForEdit } from "@/lib/employer-flow/employerJobsRepository";
import { noStoreJson } from "@/lib/apiSecurity";

type RouteContext = { params: Promise<{ jobId: string }> };

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
