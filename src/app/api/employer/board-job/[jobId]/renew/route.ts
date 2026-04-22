import { NextRequest, NextResponse } from "next/server";
import { insertAuditLog } from "@/lib/audit/masterAuditLog";
import { renewEmployerJobByToken } from "@/lib/employer-flow/employerJobExpiry";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  const renewToken = request.nextUrl.searchParams.get("renewToken")?.trim();
  if (!jobId || !renewToken) {
    return NextResponse.redirect(new URL("/jobs?renew=missing", request.url));
  }

  const result = await renewEmployerJobByToken(jobId, renewToken);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/jobs?renew=error&message=${encodeURIComponent(result.reason)}`, request.url));
  }

  const supabase = getSupabaseAdminClient();
  let slug = "";
  if (supabase) {
    const r = await supabase.from("employer_jobs").select("slug").eq("id", jobId).maybeSingle();
    if (!r.error && r.data?.slug) slug = String(r.data.slug);
  }

  await insertAuditLog({
    eventType: "job_post_renewed",
    entityType: "job",
    entityId: jobId,
    actor: "employer",
    metadata: { source: "renew_link" },
  });

  const dest = slug ? `/jobs/${slug}?renewed=1` : "/jobs?renewed=1";
  return NextResponse.redirect(new URL(dest, request.url));
}
