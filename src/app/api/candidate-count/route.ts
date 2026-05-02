import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { REQUEST_INDUSTRY_ROLE_GROUPS, roleSearchKeywords } from "@/lib/industry-roles";

export const dynamic = "force-dynamic";

let cachedAtsClient: SupabaseClient | null = null;

/** ATS service client (same env resolution as src/lib/supabaseAts.ts); kept here so this route is self-contained on all branches. */
function getAtsSupabaseClient(): SupabaseClient | null {
  if (cachedAtsClient) return cachedAtsClient;
  const url = process.env.SUPABASE_ATS_URL?.trim() || process.env.ATS_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ATS_SERVICE_KEY?.trim() || process.env.ATS_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  cachedAtsClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAtsClient;
}

/** Industry → role labels (aligned with REQUEST_INDUSTRY_ROLE_GROUPS on /request). */
const ROLE_GROUPS: Record<string, string[]> = Object.fromEntries(
  REQUEST_INDUSTRY_ROLE_GROUPS.map(({ industry, roles }) => [industry, [...roles]]),
);

function buildOrFilter(keywords: string[]): string {
  const parts: string[] = [];
  for (const kw of keywords) {
    const safe = kw.replace(/%/g, "").replace(/,/g, "");
    if (safe.length < 2) continue;
    const pattern = `%${safe}%`;
    parts.push(`normalized_job_title.ilike.${pattern}`);
    parts.push(`current_job_title.ilike.${pattern}`);
  }
  return parts.join(",");
}

async function countWithOrFilter(supabase: SupabaseClient, orFilter: string): Promise<number> {
  if (!orFilter) return 0;
  const { data, error } = await supabase.from("ats_candidates").select("id").or(orFilter).limit(500);
  return error ? 0 : (data?.length ?? 0);
}

export async function GET(request: NextRequest) {
  const industry = (request.nextUrl.searchParams.get("industry") || "").trim();
  const roleParam = (request.nextUrl.searchParams.get("role") || "").trim();

  const supabase = getAtsSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ count: 0, industry: industry || null });
  }

  try {
    if (roleParam.length >= 2) {
      const orFilter = buildOrFilter(roleSearchKeywords(roleParam));
      if (!orFilter) {
        return NextResponse.json({ count: 0, industry: industry || null });
      }
      const count = await countWithOrFilter(supabase, orFilter);
      return NextResponse.json({ count, industry });
    }

    const roles = ROLE_GROUPS[industry];
    if (!industry || !roles?.length) {
      return NextResponse.json({ count: 0, industry: industry || null });
    }

    const counts = await Promise.all(
      roles.map(async (role) => {
        const orFilter = buildOrFilter(roleSearchKeywords(role));
        return countWithOrFilter(supabase, orFilter);
      }),
    );
    const count = counts.reduce((sum, n) => sum + n, 0);
    return NextResponse.json({ count, industry });
  } catch {
    return NextResponse.json({ count: 0, industry: industry || null });
  }
}
