import { NextResponse } from "next/server";
import { notifyError } from "@/lib/errorNotifier";
import { archiveJob } from "@/lib/jobs/repository";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const job = await archiveJob(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (error) {
    await notifyError({ route: "/api/admin/jobs/[id]/archive PATCH", error });
    return NextResponse.json({ error: "Failed to archive job" }, { status: 500 });
  }
}
