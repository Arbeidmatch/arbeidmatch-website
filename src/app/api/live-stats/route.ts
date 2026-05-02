import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAtsClient } from "@/lib/supabaseAts";

export const revalidate = 300;

const ROW_CAP = 5000;

async function countActiveCandidates(supabase: SupabaseClient): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("ats_candidates")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countDistinctNormalizedCategories(supabase: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("ats_candidates")
      .select("normalized_job_category")
      .eq("status", "active")
      .limit(ROW_CAP);
    if (error || !data) return 0;
    const seen = new Set<string>();
    for (const row of data) {
      const v = row.normalized_job_category;
      if (typeof v === "string" && v.trim().length > 0) seen.add(v.trim());
    }
    return seen.size;
  } catch {
    return 0;
  }
}

async function countDistinctCurrentJobTitles(supabase: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("ats_candidates")
      .select("current_job_title")
      .eq("status", "active")
      .limit(ROW_CAP);
    if (error || !data) return 0;
    const seen = new Set<string>();
    for (const row of data) {
      const v = row.current_job_title;
      if (typeof v === "string" && v.trim().length > 0) seen.add(v.trim());
    }
    return seen.size;
  } catch {
    return 0;
  }
}

export async function GET() {
  const supabase = getSupabaseAtsClient();
  if (!supabase) {
    return NextResponse.json({ candidates: 0, industries: 0, roles: 0 });
  }

  try {
    const [candidates, industries, roles] = await Promise.all([
      countActiveCandidates(supabase),
      countDistinctNormalizedCategories(supabase),
      countDistinctCurrentJobTitles(supabase),
    ]);
    return NextResponse.json({ candidates, industries, roles });
  } catch {
    return NextResponse.json({ candidates: 0, industries: 0, roles: 0 });
  }
}
