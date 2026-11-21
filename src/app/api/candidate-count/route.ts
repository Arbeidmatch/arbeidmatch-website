import { NextRequest, NextResponse } from "next/server";

import { atsRelay } from "@/lib/atsRelay";
import {
  INDUSTRY_MAP,
  REQUEST_INDUSTRY_ROLE_GROUPS,
  ROLE_SYNONYMS,
  industrySlugForLabel,
  roleSearchKeywords,
} from "@/lib/industry-roles";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

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

/**
 * How many active, available ATS candidates have one of these words in their current title.
 * Counted by the ATS's website-relay (ORDER 415): the site holds no ATS database key, and the
 * ATS reduces each word to letters, digits, spaces and hyphens before it becomes a filter.
 */
async function countForKeywords(keywords: string[]): Promise<number> {
  const words = keywords.map((kw) => kw.replace(/[%,]/g, "").trim()).filter((kw) => kw.length >= 2);
  if (!words.length) return 0;
  const answer = await atsRelay<{ count?: unknown }>("candidate-count", { keywords: words });
  return typeof answer?.count === "number" ? answer.count : 0;
}

export async function GET(request: NextRequest) {
  const industry = (request.nextUrl.searchParams.get("industry") || "").trim();
  const roleParam = (request.nextUrl.searchParams.get("role") || "").trim();

  if (isRateLimited(request, "candidate-count", 60, 10 * 60 * 1000)) {
    return NextResponse.json({ count: 0, industry: industry || null }, { status: 429 });
  }

  try {
    if (roleParam.length >= 2) {
      const count = await countForKeywords(roleSearchKeywords(roleParam));
      return NextResponse.json({ count, industry });
    }

    const roles = ROLE_GROUPS[industry];
    if (!industry || !roles?.length) {
      return NextResponse.json({ count: 0, industry: industry || null });
    }

    const count = await countForKeywords(allKeywordsForIndustry(industry));
    return NextResponse.json({ count, industry });
  } catch {
    return NextResponse.json({ count: 0, industry: industry || null });
  }
}
