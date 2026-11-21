import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { safeIlikePattern } from "@/lib/postgrestSafe";
import { isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const role = (request.nextUrl.searchParams.get("role") || "").slice(0, 120);
  if (isRateLimited(request, "check-candidates", 30, 10 * 60 * 1000)) {
    return NextResponse.json({ count: 0, role }, { status: 429 });
  }
  // ORDER 415: a comma or parenthesis in the role can no longer add a clause to the filter.
  const rolePattern = safeIlikePattern(role.toLowerCase());
  if (!rolePattern) {
    return NextResponse.json({ count: 0, role });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return NextResponse.json({ count: 0, role });

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
