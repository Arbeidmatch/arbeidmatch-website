import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ live: false });
  }

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "tiktok_live")
      .maybeSingle();

    if (error) {
      console.error("[tiktok-live-status]", error.message);
      return NextResponse.json({ live: false });
    }

    const raw = (data?.value ?? "").trim().toLowerCase();
    const live = raw === "true" || raw === "1" || raw === "yes";
    return NextResponse.json({ live });
  } catch (e) {
    await notifyError({ route: "/api/tiktok-live-status", error: e });
    console.error("[tiktok-live-status]", e);
    return NextResponse.json({ live: false });
  }
}
