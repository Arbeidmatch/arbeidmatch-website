import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  INDUSTRY_MAP,
  REQUEST_INDUSTRY_ROLE_GROUPS,
  ROLE_SYNONYMS,
  industrySlugForLabel,
  roleSearchKeywords,
} from "@/lib/industry-roles";

export const dynamic = "force-dynamic";

const QUERY_LIMIT = 2000;

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

/** All search tokens for an industry: each canonical role + ROLE_SYNONYMS[role] (same tokens as roleSearchKeywords). */
function allKeywordsForIndustry(industry: string): string[] {
  const roles = ROLE_GROUPS[industry];
  if (!roles?.length) return [];
  const terms = new Set<string>();
  for (const role of roles) {
    const r = role.trim();
    if (r.length >= 2) terms.add(r);
    for (const s of ROLE_SYNONYMS[role] ?? []) {
      const t = s.trim();
      if (t.length >= 2) terms.add(t);
    }
  }
  const slug = industrySlugForLabel(industry);
  if (slug) {
    for (const extra of INDUSTRY_MAP[slug] ?? []) {
      const t = extra.trim();
      if (t.length >= 2) terms.add(t);
    }
  }
  return [...terms];
}

/** OR filter: current_job_title ilike only (single source with per-role counts). */
function buildCurrentTitleOrFilter(keywords: string[]): string {
  const parts: string[] = [];
  for (const kw of keywords) {
    const safe = kw.replace(/%/g, "").replace(/,/g, "").trim();
    if (safe.length < 2) continue;
    const pattern = `%${safe}%`;
    parts.push(`current_job_title.ilike.${pattern}`);
  }
  return parts.join(",");
}

async function countWithCurrentTitleOr(supabase: SupabaseClient, orFilter: string): Promise<number> {
  if (!orFilter) return 0;
  const { data, error } = await supabase.from("ats_candidates").select("id").or(orFilter).limit(QUERY_LIMIT);
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
      const orFilter = buildCurrentTitleOrFilter(roleSearchKeywords(roleParam));
      if (!orFilter) {
        return NextResponse.json({ count: 0, industry: industry || null });
      }
      const count = await countWithCurrentTitleOr(supabase, orFilter);
      return NextResponse.json({ count, industry });
    }

    const roles = ROLE_GROUPS[industry];
    if (!industry || !roles?.length) {
      return NextResponse.json({ count: 0, industry: industry || null });
    }

    const keywords = allKeywordsForIndustry(industry);
    const orFilter = buildCurrentTitleOrFilter(keywords);
    if (!orFilter) {
      return NextResponse.json({ count: 0, industry: industry || null });
    }
    const count = await countWithCurrentTitleOr(supabase, orFilter);
    return NextResponse.json({ count, industry });
  } catch {
    return NextResponse.json({ count: 0, industry: industry || null });
  }
}
