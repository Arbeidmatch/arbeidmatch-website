import { NextResponse } from "next/server";
import { notifyError } from "@/lib/errorNotifier";
import { publishJob } from "@/lib/jobs/repository";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const job = await publishJob(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (error) {
    await notifyError({ route: "/api/admin/jobs/[id]/publish PATCH", error });
    return NextResponse.json({ error: "Failed to publish job" }, { status: 500 });
  }
}
