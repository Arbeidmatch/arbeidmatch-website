import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

type Body = {
  password?: string;
  live?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_LIVE_PASSWORD;
    if (!adminPassword) {
      console.error("[admin/tiktok-live] ADMIN_LIVE_PASSWORD is not set");
      return NextResponse.json({ success: false, error: "Server misconfigured." }, { status: 500 });
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    if (typeof body.live !== "boolean") {
      return NextResponse.json({ success: false, error: "Missing live boolean." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 500 });
    }

    const value = body.live ? "true" : "false";
    const { error } = await supabase.from("site_settings").upsert(
      { key: "tiktok_live", value },
      { onConflict: "key" },
    );

    if (error) {
      console.error("[admin/tiktok-live] upsert failed:", error.message);
      return NextResponse.json({ success: false, error: "Could not save." }, { status: 500 });
    }

    return NextResponse.json({ success: true, live: body.live });
  } catch (error) {
    await notifyError({ route: "/api/admin/tiktok-live", error });
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
