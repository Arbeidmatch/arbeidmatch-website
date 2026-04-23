import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const token = (request.nextUrl.searchParams.get("token") || "").trim();
  if (!token) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ valid: false, reason: "invalid" }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("partner_sessions")
      .select("id, email, request_token, expires_at, used")
      .eq("session_token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ valid: false, reason: "invalid" });
    }

    if (data.used || data.expires_at <= nowIso) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }

    return NextResponse.json({
      valid: true,
      request_token: data.request_token,
      email: data.email,
    });
  } catch (error) {
    await notifyError({ route: "/api/verify-partner-session", error });
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 500 });
  }
}
