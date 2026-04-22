import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { notifyError } from "@/lib/errorNotifier";
import { syncRecmanJobs } from "@/lib/integrations/recman/jobs";

export async function POST() {
  try {
    const result = await syncRecmanJobs();
    void logAuditEvent("recman_jobs_sync_completed", "job", null, "system", {
      created: result.created,
      updated: result.updated,
      closed: result.closed,
      errorCount: result.errors.length,
    });
    return NextResponse.json(result);
  } catch (error) {
    await notifyError({ route: "/api/integrations/recman/jobs/sync", error });
    return NextResponse.json({ error: "RecMan sync failed" }, { status: 500 });
  }
}
