import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { notifyError } from "@/lib/errorNotifier";
import { manualJobCreateSchema, mapManualInputToJobPayload } from "@/lib/jobs/admin-schema";
import { createManualJob, getAdminJobs } from "@/lib/jobs/repository";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const jobs = await getAdminJobs({
      query: url.searchParams.get("q") || undefined,
      source: (url.searchParams.get("source") as "all" | "manual" | "recman" | "employer_board" | null) ?? undefined,
      status: (url.searchParams.get("status") as "all" | "draft" | "active" | "closed" | "archived" | null) ?? undefined,
      location: url.searchParams.get("location") || undefined,
      category: url.searchParams.get("category") || undefined,
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    await notifyError({ route: "/api/admin/jobs GET", error });
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = manualJobCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }
    const job = await createManualJob(mapManualInputToJobPayload(parsed.data));
    void logAuditEvent("job_post_created", "job", job.id, "admin", { source: job.source, slug: job.slug });
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    await notifyError({ route: "/api/admin/jobs POST", error });
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
