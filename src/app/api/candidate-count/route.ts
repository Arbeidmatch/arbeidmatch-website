import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

/** Keywords matched against ats_candidates role, trade, job_title (ilike). */
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "Construction & Civil": ["construction", "civil", "bygg", "anlegg", "carpenter", "concrete", "scaffold"],
  "Electrical & Technical": ["electrical", "electrician", "eltek", "hvac", "plumber", "welder", "automation"],
  "Logistics & Transport": ["logistics", "truck", "driver", "warehouse", "forklift", "transport", "terminal"],
  "Industry & Production": ["production", "factory", "cnc", "machine", "operator", "steel", "quality"],
  "Offshore & Onshore": ["offshore", "marine", "subsea", "deck", "rig", "vessel", "platform"],
  "Automotive & Mechanics": ["automotive", "mechanic", "vehicle", "auto", "verksted", "panel", "tire"],
  "Cleaning & Facility": ["cleaning", "cleaner", "facility", "renhold", "janitor", "industrial clean"],
  "Hospitality & Healthcare": ["hospitality", "hotel", "chef", "kitchen", "healthcare", "care", "cook"],
};

function buildOrFilter(keywords: string[]): string {
  const parts: string[] = [];
  for (const kw of keywords) {
    const safe = kw.replace(/%/g, "").replace(/,/g, "");
    if (safe.length < 2) continue;
    const pattern = `%${safe}%`;
    parts.push(`role.ilike.${pattern}`);
    parts.push(`trade.ilike.${pattern}`);
    parts.push(`job_title.ilike.${pattern}`);
  }
  return parts.join(",");
}

export async function GET(request: NextRequest) {
  const industry = (request.nextUrl.searchParams.get("industry") || "").trim();
  const keywords = INDUSTRY_KEYWORDS[industry];
  if (!industry || !keywords || keywords.length === 0) {
    return NextResponse.json({ count: 0, industry: industry || null });
  }

  const orFilter = buildOrFilter(keywords);
  if (!orFilter) {
    return NextResponse.json({ count: 0, industry });
  }

  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ count: 0, industry });
    }

    const { count, error } = await supabase
      .from("ats_candidates")
      .select("*", { count: "exact", head: true })
      .or(orFilter);

    if (error) {
      await notifyError({ route: "/api/candidate-count", error });
      return NextResponse.json({ count: 0, industry });
    }

    return NextResponse.json({ count: count ?? 0, industry });
  } catch (error) {
    await notifyError({ route: "/api/candidate-count", error });
    return NextResponse.json({ count: 0, industry });
  }
}
