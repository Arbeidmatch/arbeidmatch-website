import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { draftToIncompleteCandidateRow } from "@/lib/candidates/progressRow";
import { getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { isRateLimited } from "@/lib/requestProtection";
import { logApiError } from "@/lib/secureLogger";
import { notifyError } from "@/lib/errorNotifier";

const bodySchema = z.object({
  email: z.string().trim().email(),
  lastCompletedStep: z.number().int().min(1).max(8),
  draft: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile-progress", 40, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const emailKey = parsed.data.email.toLowerCase();
    const row = draftToIncompleteCandidateRow(emailKey, parsed.data.lastCompletedStep, parsed.data.draft);

    const existing = await supabase
      .from("candidates")
      .select("profile_completion_step,profile_completed_at")
      .eq("email", emailKey)
      .maybeSingle();

    if (existing.error) {
      logApiError("/api/candidate-profile/progress lookup", existing.error);
      return NextResponse.json({ error: "Could not save progress." }, { status: 500 });
    }

    if (existing.data?.profile_completed_at || (existing.data?.profile_completion_step ?? 0) >= 9) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const upsert = await supabase.from("candidates").upsert(row, { onConflict: "email" });
    if (upsert.error) {
      logApiError("/api/candidate-profile/progress upsert", upsert.error);
      return NextResponse.json(
        { error: "Could not save progress.", hint: "Run supabase/candidates_profile_resume.sql if columns are missing." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile/progress", error });
    logApiError("/api/candidate-profile/progress", error);
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }
}
