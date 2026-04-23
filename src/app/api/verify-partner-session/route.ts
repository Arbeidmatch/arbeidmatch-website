import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export async function GET(request: NextRequest) {
  const token = (request.nextUrl.searchParams.get("token") || "").trim();
  if (!token) {
    return NextResponse.json({ valid: false });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ valid: false });
    }

    const { data, error } = await supabase.from("request_tokens").select("*").eq("token", token).single();

    if (error || !data) {
      return NextResponse.json({ valid: false });
    }

    if (data.used) {
      return NextResponse.json({ valid: false, reason: "used" });
    }

    if (new Date(data.expires_at as string) < new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }

    return NextResponse.json({ valid: true, email: data.email });
  } catch (error) {
    await notifyError({ route: "/api/verify-partner-session", error });
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
