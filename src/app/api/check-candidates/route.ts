import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

async function resolveCandidateCount(role: string) {
  const normalizedRole = role.trim().toLowerCase();
  if (normalizedRole.length < 2) {
    return { count: 0, role };
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) return { count: 0, role };

    const rolePattern = `%${normalizedRole}%`;
    const { count, error } = await supabase
      .from("ats_candidates")
      .select("*", { count: "exact", head: true })
      .or(`role.ilike.${rolePattern},trade.ilike.${rolePattern},job_title.ilike.${rolePattern}`);

    if (error) {
      return { count: 0, role };
    }

    return { count: count ?? 0, role };
  } catch (error) {
    await notifyError({ route: "/api/check-candidates", error });
    return { count: 0, role };
  }
}

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") || "";
  const payload = await resolveCandidateCount(role);
  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { category?: string } | null;
  const role = (body?.category || "").trim();
  const payload = await resolveCandidateCount(role);
  return NextResponse.json(payload);
}
