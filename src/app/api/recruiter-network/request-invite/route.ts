import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawBody)) {
      return NextResponse.json({ ok: true });
    }
    if (isRateLimited(req, "recruiter-invite-request", 6, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const full_name = typeof rawBody.full_name === "string" ? rawBody.full_name.trim() : "";
    const email = typeof rawBody.email === "string" ? rawBody.email.trim() : "";
    const motivation = typeof rawBody.motivation === "string" ? rawBody.motivation.trim() : "";
    const experience_summary =
      typeof rawBody.experience_summary === "string" ? rawBody.experience_summary.trim() : "";

    if (!full_name || full_name.length < 2) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    if (!motivation || motivation.length < 30) {
      return NextResponse.json({ error: "motivation_too_short" }, { status: 400 });
    }

    const gdpr =
      rawBody.gdpr_consent === true ||
      rawBody.gdpr_consent === "true" ||
      (typeof rawBody.gdpr_consent === "string" && rawBody.gdpr_consent === "on");
    if (!gdpr) {
      return NextResponse.json({ error: "gdpr_required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    const ua = req.headers.get("user-agent") || "";

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "server_error" }, { status: 503 });
    }

    const { error } = await supabase.from("recruiter_invite_requests").insert({
      full_name,
      email: email.toLowerCase(),
      motivation,
      experience_summary: experience_summary || null,
      ip_address: ip || null,
      user_agent: ua || null,
    });

    if (error) {
      console.error("[recruiter-invite-request] DB error:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[recruiter-invite-request] Error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
