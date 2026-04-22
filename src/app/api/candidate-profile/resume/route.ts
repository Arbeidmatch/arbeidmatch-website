import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { isRateLimited } from "@/lib/requestProtection";
import { logApiError } from "@/lib/secureLogger";
import { notifyError } from "@/lib/errorNotifier";

const tokenSchema = z.string().uuid();

export async function GET(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile-resume", 40, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const raw = (request.nextUrl.searchParams.get("token") || "").trim();
    const tokenParsed = tokenSchema.safeParse(raw);
    if (!tokenParsed.success) {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const res = await supabase
      .from("candidates")
      .select("email,first_name,profile_draft,profile_completion_step,profile_token,token_expires_at")
      .eq("profile_token", tokenParsed.data)
      .maybeSingle();

    if (res.error) {
      logApiError("/api/candidate-profile/resume", res.error);
      return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
    }

    if (!res.data) {
      return NextResponse.json({ error: "Link is invalid or expired." }, { status: 404 });
    }

    const expires = res.data.token_expires_at ? new Date(res.data.token_expires_at).getTime() : 0;
    if (!expires || expires < Date.now()) {
      return NextResponse.json({ error: "Link is invalid or expired." }, { status: 410 });
    }

    const draft = res.data.profile_draft && typeof res.data.profile_draft === "object" ? (res.data.profile_draft as Record<string, unknown>) : {};

    return NextResponse.json({
      email: res.data.email,
      firstName: res.data.first_name,
      profile_completion_step: res.data.profile_completion_step ?? 0,
      draft,
    });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile/resume", error });
    logApiError("/api/candidate-profile/resume", error);
    return NextResponse.json({ error: "Failed to validate link." }, { status: 500 });
  }
}
