import { NextRequest, NextResponse } from "next/server";
import { notifyError } from "@/lib/errorNotifier";
import { manualJobCreateSchema, mapManualInputToJobPayload } from "@/lib/jobs/admin-schema";
import { createManualJob, getAdminJobs } from "@/lib/jobs/repository";

export async function GET() {
  try {
    const jobs = await getAdminJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    await notifyError({ route: "/api/jobs GET", error });
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = manualJobCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const job = await createManualJob(mapManualInputToJobPayload(parsed.data));
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    await notifyError({ route: "/api/jobs POST", error });
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
