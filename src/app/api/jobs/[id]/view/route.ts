import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const postSchema = z.object({
  candidate_email: z.string().trim().email().optional(),
});

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function hashEmail(email?: string): string | null {
  if (!email) return null;
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
  }

  const ip = getClientIp(request);
  const candidateHash = hashEmail(parsed.data.candidate_email);
  const viewerKey = candidateHash ? `candidate:${candidateHash}` : `ip:${ip}`;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const recentAudit = await supabase
    .from("master_audit_log")
    .select("id")
    .eq("event_type", "job_view_incremented")
    .eq("entity_type", "job")
    .eq("entity_id", id)
    .eq("metadata->>viewer_key", viewerKey)
    .gte("created_at", oneHourAgo)
    .limit(1);

  if (recentAudit.data && recentAudit.data.length > 0) {
    const currentRes = await supabase.from("employer_jobs").select("view_count").eq("id", id).maybeSingle();
    const currentViewCount = Number((currentRes.data as { view_count?: number } | null)?.view_count ?? 0);
    return NextResponse.json({ success: true, rate_limited: true, view_count: currentViewCount });
  }

  const currentRes = await supabase.from("employer_jobs").select("view_count").eq("id", id).maybeSingle();
  if (currentRes.error || !currentRes.data) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const currentViewCount = Number((currentRes.data as { view_count?: number }).view_count ?? 0);
  const nextViewCount = currentViewCount + 1;

  const updateRes = await supabase.from("employer_jobs").update({ view_count: nextViewCount }).eq("id", id).select("view_count").maybeSingle();
  if (updateRes.error || !updateRes.data) {
    return NextResponse.json({ error: "Failed to increment view count." }, { status: 500 });
  }

  await logAuditEvent("job_view_incremented", "job", id, candidateHash ? "candidate" : "system", {
    viewer_key: viewerKey,
    ip,
  });

  return NextResponse.json({ success: true, rate_limited: false, view_count: Number((updateRes.data as { view_count?: number }).view_count ?? 0) });
}
