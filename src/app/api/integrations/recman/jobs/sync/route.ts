import { NextResponse } from "next/server";
import { notifyError } from "@/lib/errorNotifier";
import { syncRecmanJobs } from "@/lib/integrations/recman/jobs";

export async function POST() {
  try {
    const result = await syncRecmanJobs();
    return NextResponse.json(result);
  } catch (error) {
    await notifyError({ route: "/api/integrations/recman/jobs/sync", error });
    return NextResponse.json({ error: "RecMan sync failed" }, { status: 500 });
  }
}
