import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = (request.nextUrl.searchParams.get("role") || "").trim();
  if (role.length < 2) {
    return NextResponse.json({ count: 0, role });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return NextResponse.json({ count: 0, role });

    const rolePattern = `%${role}%`;
    const { count, error } = await supabase
      .from("ats_candidates")
      .select("*", { count: "exact", head: true })
      .or(`role.ilike.${rolePattern},trade.ilike.${rolePattern},job_title.ilike.${rolePattern}`);

    if (error) {
      return NextResponse.json({ count: 0, role });
    }

    return NextResponse.json({ count: count ?? 0, role });
  } catch (error) {
    await notifyError({ route: "/api/check-candidates", error });
    return NextResponse.json({ count: 0, role });
  }
}
