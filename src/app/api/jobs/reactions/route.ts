import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const fieldReactionValueSchema = z.enum(["happy", "neutral", "sad"]);
const fieldReactionsSchema = z
  .object({
    salary: fieldReactionValueSchema.optional(),
    location: fieldReactionValueSchema.optional(),
    rotation: fieldReactionValueSchema.optional(),
  })
  .default({});

const getSchema = z.object({
  job_id: z.string().trim().uuid(),
  candidate_email: z.string().trim().email().optional(),
});

const postSchema = z.object({
  job_id: z.string().trim().uuid(),
  reaction_type: z.enum(["like", "dislike"]),
  field_reactions: fieldReactionsSchema.optional(),
  candidate_email: z.string().trim().email(),
});

type FieldAggregate = Record<"salary" | "location" | "rotation", Record<"happy" | "neutral" | "sad", number>>;

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function emptyFieldAggregate(): FieldAggregate {
  return {
    salary: { happy: 0, neutral: 0, sad: 0 },
    location: { happy: 0, neutral: 0, sad: 0 },
    rotation: { happy: 0, neutral: 0, sad: 0 },
  };
}

async function buildAggregate(jobId: string, candidateHash?: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      likes: 0,
      dislikes: 0,
      field_reactions: emptyFieldAggregate(),
      user_reaction: null as "like" | "dislike" | null,
      user_field_reactions: {} as Partial<Record<"salary" | "location" | "rotation", "happy" | "neutral" | "sad">>,
    };
  }

  const result = await supabase
    .from("job_reactions")
    .select("candidate_hash,reaction_type,field_reactions")
    .eq("job_id", jobId);

  const rows = (result.data ?? []) as Array<{
    candidate_hash: string;
    reaction_type: "like" | "dislike" | null;
    field_reactions: Partial<Record<"salary" | "location" | "rotation", "happy" | "neutral" | "sad">> | null;
  }>;

  const fieldAgg = emptyFieldAggregate();
  for (const row of rows) {
    const fields = row.field_reactions ?? {};
    for (const key of ["salary", "location", "rotation"] as const) {
      const value = fields[key];
      if (value === "happy" || value === "neutral" || value === "sad") {
        fieldAgg[key][value] += 1;
      }
    }
  }

  const likes = rows.filter((row) => row.reaction_type === "like").length;
  const dislikes = rows.filter((row) => row.reaction_type === "dislike").length;
  const me = candidateHash ? rows.find((row) => row.candidate_hash === candidateHash) : null;

  return {
    likes,
    dislikes,
    field_reactions: fieldAgg,
    user_reaction: me?.reaction_type ?? null,
    user_field_reactions: me?.field_reactions ?? {},
  };
}

export async function GET(request: NextRequest) {
  const parsed = getSchema.safeParse({
    job_id: request.nextUrl.searchParams.get("job_id"),
    candidate_email: request.nextUrl.searchParams.get("candidate_email") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const candidateHash = parsed.data.candidate_email ? hashEmail(parsed.data.candidate_email) : undefined;
  const aggregate = await buildAggregate(parsed.data.job_id, candidateHash);
  return NextResponse.json(aggregate);
}

export async function POST(request: NextRequest) {
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
  }

  const email = parsed.data.candidate_email.trim().toLowerCase();
  const candidateRes = await supabase.from("candidates").select("id").eq("email", email).maybeSingle();
  if (candidateRes.error || !candidateRes.data) {
    return NextResponse.json({ error: "Candidate must be registered to react." }, { status: 401 });
  }

  const candidate_hash = hashEmail(email);
  const upsertRes = await supabase.from("job_reactions").upsert(
    {
      job_id: parsed.data.job_id,
      candidate_hash,
      reaction_type: parsed.data.reaction_type,
      field_reactions: parsed.data.field_reactions ?? {},
    },
    { onConflict: "job_id,candidate_hash" },
  );
  if (upsertRes.error) {
    return NextResponse.json({ error: "Failed to save reaction." }, { status: 500 });
  }

  const aggregate = await buildAggregate(parsed.data.job_id, candidate_hash);
  return NextResponse.json(aggregate);
}
