import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const getSchema = z.object({
  job_id: z.string().trim().min(1),
});

const postSchema = z.object({
  job_id: z.string().trim().min(1),
  action: z.enum(["view", "job_reaction", "field_reaction"]),
  reaction: z.enum(["like", "dislike"]).optional(),
  field_key: z.enum(["salary", "location", "rotation", "contract_type"]).optional(),
  field_reaction: z.enum(["happy", "neutral", "concerned"]).optional(),
  premium_only_reactions: z.boolean().optional().default(false),
});

function fingerprintFromEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function getCandidateFingerprintFromRequest(request: NextRequest): Promise<string | null> {
  const email = (request.headers.get("x-candidate-email") || "").trim().toLowerCase();
  if (!email.includes("@")) return null;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const candidate = await supabase
    .from("candidates")
    .select("id,profile_completion_step")
    .eq("email", email)
    .maybeSingle();
  if (candidate.error || !candidate.data) return null;
  if ((candidate.data.profile_completion_step ?? 0) < 1) return null;
  return fingerprintFromEmail(email);
}

async function aggregateForJob(jobId: string, candidateFingerprint: string | null) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      counts: { likes: 0, dislikes: 0, views: 0 },
      fieldCounts: {
        salary: { happy: 0, neutral: 0, concerned: 0 },
        location: { happy: 0, neutral: 0, concerned: 0 },
        rotation: { happy: 0, neutral: 0, concerned: 0 },
        contract_type: { happy: 0, neutral: 0, concerned: 0 },
      },
      user: {
        reaction: null as "like" | "dislike" | null,
        fieldReactions: {} as Record<string, "happy" | "neutral" | "concerned" | null>,
      },
    };
  }

  const allRowsRes = await supabase
    .from("job_reactions")
    .select("candidate_fingerprint,reaction,viewed_at,field_key,field_reaction")
    .eq("job_id", jobId);

  const rows =
    !allRowsRes.error && allRowsRes.data
      ? (allRowsRes.data as Array<{
          candidate_fingerprint: string;
          reaction: "like" | "dislike" | null;
          viewed_at: string | null;
          field_key: "salary" | "location" | "rotation" | "contract_type" | null;
          field_reaction: "happy" | "neutral" | "concerned" | null;
        }>)
      : [];

  const likes = rows.filter((r) => r.reaction === "like").length;
  const dislikes = rows.filter((r) => r.reaction === "dislike").length;
  const views = rows.filter((r) => r.viewed_at !== null).length;

  const fieldCounts = {
    salary: { happy: 0, neutral: 0, concerned: 0 },
    location: { happy: 0, neutral: 0, concerned: 0 },
    rotation: { happy: 0, neutral: 0, concerned: 0 },
    contract_type: { happy: 0, neutral: 0, concerned: 0 },
  };

  for (const row of rows) {
    if (!row.field_key || !row.field_reaction) continue;
    fieldCounts[row.field_key][row.field_reaction] += 1;
  }

  const user = {
    reaction: null as "like" | "dislike" | null,
    fieldReactions: {} as Record<string, "happy" | "neutral" | "concerned" | null>,
  };
  if (candidateFingerprint) {
    const userRows = rows.filter(
      (r) => r.candidate_fingerprint === candidateFingerprint || r.candidate_fingerprint.startsWith(`${candidateFingerprint}:`),
    );
    const latestJobReaction = userRows.find((r) => r.reaction === "like" || r.reaction === "dislike");
    user.reaction = latestJobReaction?.reaction ?? null;
    for (const key of ["salary", "location", "rotation", "contract_type"] as const) {
      const f = userRows.find((r) => r.field_key === key && r.field_reaction);
      user.fieldReactions[key] = f?.field_reaction ?? null;
    }
  }

  return { counts: { likes, dislikes, views }, fieldCounts, user };
}

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({
    job_id: request.nextUrl.searchParams.get("job_id"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid job_id." }, { status: 400 });
  }

  const candidateFingerprint = await getCandidateFingerprintFromRequest(request);
  const summary = await aggregateForJob(parsed.data.job_id, candidateFingerprint);
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const body = parsed.data;

  if (body.action === "view") {
    const viewerId = (request.headers.get("x-viewer-id") || "").trim();
    if (!viewerId) return NextResponse.json({ success: true });
    const upsertRes = await supabase.from("job_reactions").upsert(
      {
        job_id: body.job_id,
        candidate_fingerprint: viewerId,
        viewed_at: new Date().toISOString(),
        premium_only_reactions: false,
      },
      { onConflict: "job_id,candidate_fingerprint" },
    );
    if (upsertRes.error) {
      return NextResponse.json({ error: "Could not register view." }, { status: 500 });
    }
    const summary = await aggregateForJob(body.job_id, null);
    return NextResponse.json({ success: true, ...summary });
  }

  const candidateFingerprint = await getCandidateFingerprintFromRequest(request);
  if (!candidateFingerprint) {
    return NextResponse.json({ error: "Only registered candidates can react." }, { status: 403 });
  }

  if (body.action === "job_reaction") {
    if (!body.reaction) {
      return NextResponse.json({ error: "Missing reaction." }, { status: 400 });
    }
    const upsertRes = await supabase.from("job_reactions").upsert(
      {
        job_id: body.job_id,
        candidate_fingerprint: candidateFingerprint,
        reaction: body.reaction,
        premium_only_reactions: body.premium_only_reactions,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "job_id,candidate_fingerprint" },
    );
    if (upsertRes.error) {
      return NextResponse.json({ error: "Could not save reaction." }, { status: 500 });
    }
    const summary = await aggregateForJob(body.job_id, candidateFingerprint);
    return NextResponse.json({ success: true, ...summary });
  }

  if (!body.field_key || !body.field_reaction) {
    return NextResponse.json({ error: "Missing field reaction." }, { status: 400 });
  }
  const upsertField = await supabase.from("job_reactions").upsert(
    {
      job_id: body.job_id,
      candidate_fingerprint: `${candidateFingerprint}:${body.field_key}`,
      field_key: body.field_key,
      field_reaction: body.field_reaction,
      premium_only_reactions: body.premium_only_reactions,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: "job_id,candidate_fingerprint" },
  );
  if (upsertField.error) {
    return NextResponse.json({ error: "Could not save field reaction." }, { status: 500 });
  }
  const summary = await aggregateForJob(body.job_id, candidateFingerprint);
  return NextResponse.json({ success: true, ...summary });
}
