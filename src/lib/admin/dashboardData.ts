import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AdminDashboardData = {
  counts: {
    employerJobsLive: number;
    employerJobsDraft: number;
    employerJobsArchived: number;
    employerJobsClosed: number;
    candidatesRegistered: number;
    applicationsTotal: number;
    employerRequestsTotal: number;
    partnersTotal: number;
    conversionRate: number | null;
  };
  jobsPerWeek: { week: string; count: number }[];
  applicationsPerDay: { day: string; count: number }[];
  categoryDistribution: { name: string; value: number }[];
  avgMatchScore: number | null;
  recentJobs: {
    id: string;
    title: string;
    slug: string;
    status: string;
    expires_at: string | null;
    applications: number;
    created_at: string;
  }[];
  recentApplications: {
    id: string;
    job_title: string;
    email: string;
    status: string | null;
    match_score: number | null;
    submitted_at: string | null;
  }[];
  recentEmployers: { id: string; company: string; email: string; created_at: string }[];
  expiringSoon: { id: string; title: string; slug: string; expires_at: string; employer_email: string }[];
  auditRecent: {
    id: string;
    event_type: string;
    entity_type: string;
    entity_id: string | null;
    actor: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];
  auditLogTotal: number;
};

async function countTable(table: string, filters?: Record<string, string | boolean>): Promise<number> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return 0;
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      q = q.eq(k, v);
    }
  }
  const res = await q;
  if (res.error) return 0;
  return res.count ?? 0;
}

function startOfWeekIso(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
  return x.toISOString().slice(0, 10);
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdminClient();
  const empty: AdminDashboardData = {
    counts: {
      employerJobsLive: 0,
      employerJobsDraft: 0,
      employerJobsArchived: 0,
      employerJobsClosed: 0,
      candidatesRegistered: 0,
      applicationsTotal: 0,
      employerRequestsTotal: 0,
      partnersTotal: 0,
      conversionRate: null,
    },
    jobsPerWeek: [],
    applicationsPerDay: [],
    categoryDistribution: [],
    avgMatchScore: null,
    recentJobs: [],
    recentApplications: [],
    recentEmployers: [],
    expiringSoon: [],
    auditRecent: [],
    auditLogTotal: 0,
  };

  if (!supabase) return empty;

  const [
    employerJobsLive,
    employerJobsDraft,
    employerJobsArchived,
    employerJobsClosed,
    candidatesRegistered,
    applicationsTotal,
    employerRequestsTotal,
    partnersTotal,
  ] = await Promise.all([
    countTable("employer_jobs", { status: "live" }),
    countTable("employer_jobs", { status: "draft" }),
    countTable("employer_jobs", { status: "archived" }),
    countTable("employer_jobs", { status: "closed" }),
    countTable("candidates"),
    countTable("job_applications"),
    countTable("employer_requests"),
    countTable("partners"),
  ]);

  const conversionRate =
    employerJobsLive > 0 && applicationsTotal > 0 ? Math.round((applicationsTotal / employerJobsLive) * 10) / 10 : null;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 84);

  const jobsCreated = await supabase
    .from("employer_jobs")
    .select("created_at")
    .gte("created_at", since.toISOString());

  const weekBuckets = new Map<string, number>();
  if (!jobsCreated.error && jobsCreated.data) {
    for (const row of jobsCreated.data as { created_at: string }[]) {
      const w = startOfWeekIso(new Date(row.created_at));
      weekBuckets.set(w, (weekBuckets.get(w) ?? 0) + 1);
    }
  }
  const jobsPerWeek = [...weekBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  const appSince = new Date();
  appSince.setUTCDate(appSince.getUTCDate() - 14);
  const apps = await supabase
    .from("job_applications")
    .select("submitted_at")
    .gte("submitted_at", appSince.toISOString());

  const dayBuckets = new Map<string, number>();
  if (!apps.error && apps.data) {
    for (const row of apps.data as { submitted_at: string | null }[]) {
      if (!row.submitted_at) continue;
      const day = row.submitted_at.slice(0, 10);
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
    }
  }
  const applicationsPerDay = [...dayBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  const cats = await supabase.from("employer_jobs").select("category").not("category", "is", null);
  const catMap = new Map<string, number>();
  if (!cats.error && cats.data) {
    for (const row of cats.data as { category: string | null }[]) {
      const c = (row.category || "Other").trim() || "Other";
      catMap.set(c, (catMap.get(c) ?? 0) + 1);
    }
  }
  const categoryDistribution = [...catMap.entries()].map(([name, value]) => ({ name, value }));

  const avgRes = await supabase.from("job_applications").select("match_score").not("match_score", "is", null).limit(5000);
  let avgMatchScore: number | null = null;
  if (!avgRes.error && avgRes.data?.length) {
    const scores = (avgRes.data as { match_score: number }[]).map((r) => r.match_score).filter((n) => typeof n === "number");
    if (scores.length) avgMatchScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  const rj = await supabase
    .from("employer_jobs")
    .select("id, title, slug, status, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentJobs: AdminDashboardData["recentJobs"] = [];
  if (!rj.error && rj.data) {
    for (const row of rj.data as {
      id: string;
      title: string;
      slug: string;
      status: string;
      expires_at: string | null;
      created_at: string;
    }[]) {
      const ac = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("job_id", row.id);
      recentJobs.push({
        ...row,
        applications: ac.count ?? 0,
      });
    }
  }

  const ra = await supabase
    .from("job_applications")
    .select("id, job_title, email, status, match_score, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(10);

  const re = await supabase
    .from("employer_requests")
    .select("id, company, email, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const now = new Date();
  const week = new Date(now.getTime() + 7 * 86400000).toISOString();
  const ex = await supabase
    .from("employer_jobs")
    .select("id, title, slug, expires_at, employer_email")
    .eq("status", "live")
    .lte("expires_at", week)
    .gte("expires_at", now.toISOString())
    .order("expires_at", { ascending: true })
    .limit(20);

  const auditRes = await supabase
    .from("master_audit_log")
    .select("id, event_type, entity_type, entity_id, actor, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const auditRecent =
    !auditRes.error && auditRes.data
      ? (auditRes.data as AdminDashboardData["auditRecent"])
      : [];

  const auditCountRes = await supabase.from("master_audit_log").select("*", { count: "exact", head: true });
  const auditLogTotal = auditCountRes.error ? 0 : auditCountRes.count ?? 0;

  return {
    counts: {
      employerJobsLive,
      employerJobsDraft,
      employerJobsArchived,
      employerJobsClosed,
      candidatesRegistered,
      applicationsTotal,
      employerRequestsTotal,
      partnersTotal,
      conversionRate,
    },
    jobsPerWeek,
    applicationsPerDay,
    categoryDistribution,
    avgMatchScore,
    recentJobs,
    recentApplications: !ra.error && ra.data ? (ra.data as AdminDashboardData["recentApplications"]) : [],
    recentEmployers: !re.error && re.data ? (re.data as AdminDashboardData["recentEmployers"]) : [],
    expiringSoon: !ex.error && ex.data ? (ex.data as AdminDashboardData["expiringSoon"]) : [],
    auditRecent,
    auditLogTotal,
  };
}
