import { NextRequest, NextResponse } from "next/server";
import { insertAuditLog } from "@/lib/audit/masterAuditLog";
import { runEmployerJobExpirySweep } from "@/lib/employer-flow/employerJobExpiry";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEmployerJobExpirySweep();
    await insertAuditLog({
      eventType: "employer_job_expiry_cron",
      entityType: "other",
      actor: "system",
      metadata: result,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    await notifyError({ route: "/api/cron/employer-job-expiry", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
