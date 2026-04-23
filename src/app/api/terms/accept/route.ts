import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const schema = z.object({
  user_email: z.string().email(),
  user_type: z.enum(["candidate", "employer", "partner"]),
  terms_version: z.string().trim().min(1),
  privacy_version: z.string().trim().min(1),
});

function ipHashFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (!forwarded) return "";
  return createHash("sha256").update(forwarded).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const payload = parsed.data;
  const userEmail = payload.user_email.trim().toLowerCase();
  const ipHash = ipHashFromRequest(request);

  const upsertAcceptance = await supabase.from("terms_acceptances").upsert(
    {
      user_email: userEmail,
      user_type: payload.user_type,
      terms_version: payload.terms_version,
      privacy_version: payload.privacy_version,
      accepted_at: new Date().toISOString(),
      refused_at: null,
      refusal_feedback: null,
      ip_hash: ipHash || null,
    },
    { onConflict: "user_email,terms_version,privacy_version" },
  );
  if (upsertAcceptance.error) {
    return NextResponse.json({ error: upsertAcceptance.error.message }, { status: 500 });
  }

  if (payload.user_type === "candidate") {
    await supabase
      .from("candidates")
      .update({
        terms_refused: false,
        current_terms_version: payload.terms_version,
        current_privacy_version: payload.privacy_version,
      })
      .eq("email", userEmail);
  } else {
    await supabase
      .from("employer_requests")
      .update({
        terms_refused: false,
        current_terms_version: payload.terms_version,
        current_privacy_version: payload.privacy_version,
      })
      .eq("email", userEmail);
  }

  return NextResponse.json({ success: true });
}
