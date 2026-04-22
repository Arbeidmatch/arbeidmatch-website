import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { insertAuditLog } from "@/lib/audit/masterAuditLog";
import { renewEmployerJobByToken } from "@/lib/employer-flow/employerJobExpiry";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

const renewPostBodySchema = z.object({
  renew_token: z.string().uuid(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId?.trim()) {
    return NextResponse.json({ success: false, error: "Missing job id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = renewPostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid body", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await renewEmployerJobByToken(jobId, parsed.data.renew_token);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
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
    metadata: { source: "renew_post" },
  });

  return NextResponse.json({
    success: true,
    expires_at: result.expiresAt,
    renew_token: result.renewToken,
    slug: slug || null,
  });
}

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
