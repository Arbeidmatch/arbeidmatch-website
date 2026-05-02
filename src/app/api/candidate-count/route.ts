import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

/**
 * Industry → role labels (aligned with CHECK_ROLE_GROUPS on /request).
 * "Other / General Labour" uses the four roles below only (no "Other (specify)" for counting).
 */
const ROLE_GROUPS: Record<string, string[]> = {
  "Construction & Civil": [
    "Site Manager",
    "Carpenter",
    "Bricklayer",
    "Concrete Worker",
    "Scaffolder",
    "Painter",
    "Roofer",
    "Civil Engineer",
  ],
  "Electrical & Technical": [
    "Electrician",
    "DSB Authorized Electrician",
    "Plumber",
    "HVAC Technician",
    "Automation Engineer",
    "Welder",
    "Pipefitter",
  ],
  "Logistics & Transport": [
    "Truck Driver",
    "Forklift Operator",
    "Warehouse Worker",
    "Logistics Coordinator",
    "Bus Driver",
    "Crane Operator",
  ],
  "Industry & Production": [
    "Machine Operator",
    "CNC Operator",
    "Steel Worker",
    "Insulation Worker",
    "Quality Inspector",
    "Production Worker",
  ],
  "Cleaning & Facility": ["Cleaner", "Facility Manager", "Window Cleaner", "Industrial Cleaner", "Waste Handler"],
  "Hospitality & Healthcare": ["Kitchen Staff", "Chef", "Hotel Staff", "Healthcare Assistant", "Care Worker", "Cook"],
  "Automotive & Mechanics": [
    "Auto Mechanic",
    "Body Repair Technician",
    "Auto Electrician",
    "Diagnostic Technician",
    "Tire Specialist",
    "Heavy Equipment Mechanic",
  ],
  "Offshore & Onshore": [
    "Offshore Worker",
    "Rigger",
    "Driller",
    "Roustabout",
    "Onshore Operator",
    "Pipeline Technician",
    "BOSIET Certified Worker",
  ],
  "Other / General Labour": ["General Labourer", "Construction Helper", "Warehouse Helper", "Production Assistant"],
};

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
      const orFilter = buildOrFilter([roleParam]);
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
        const orFilter = buildOrFilter([role]);
        return countWithOrFilter(supabase, orFilter);
      }),
    );
    const count = counts.reduce((sum, n) => sum + n, 0);
    return NextResponse.json({ count, industry });
  } catch {
    return NextResponse.json({ count: 0, industry: industry || null });
  }
}
