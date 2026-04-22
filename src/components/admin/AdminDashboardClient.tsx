"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminDashboardData } from "@/lib/admin/dashboardData";

const GOLD = "#C9A84C";
const NAVY = "#0D1B2A";
const PIE_COLORS = ["#C9A84C", "#8b7344", "#5c6f82", "#3d5168", "#2a3f5f", "#e6d4a2"];

function StatCard({
  label,
  value,
  sub,
  delay,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[linear-gradient(160deg,rgba(13,27,42,0.95),rgba(20,35,52,0.92))] p-6 shadow-lg"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A84C]/90">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-white md:text-4xl">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/50">{sub}</p> : null}
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#C9A84C]">{title}</h3>
      <div className="mt-4 h-[260px] w-full">{children}</div>
    </div>
  );
}

export default function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const searchParams = useSearchParams();
  const adminSecret = searchParams.get("secret")?.trim() ?? "";

  const [auditRows, setAuditRows] = useState(data.auditRecent);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState<number>(data.auditLogTotal);
  const [auditLoading, setAuditLoading] = useState(false);

  const csvHref = useMemo(() => {
    if (typeof window === "undefined" || !adminSecret) return "#";
    const u = new URL("/api/admin/audit-log", window.location.origin);
    u.searchParams.set("secret", adminSecret);
    u.searchParams.set("format", "csv");
    return u.toString();
  }, [adminSecret]);

  const loadAuditPage = useCallback(
    async (page: number) => {
      if (!adminSecret) return;
      setAuditLoading(true);
      try {
        const u = new URL("/api/admin/audit-log", window.location.origin);
        u.searchParams.set("secret", adminSecret);
        u.searchParams.set("page", String(page));
        u.searchParams.set("pageSize", "50");
        const res = await fetch(u.toString());
        const json = (await res.json()) as { rows?: typeof auditRows; total?: number };
        if (json.rows) setAuditRows(json.rows);
        if (typeof json.total === "number") setAuditTotal(json.total);
        setAuditPage(page);
      } finally {
        setAuditLoading(false);
      }
    },
    [adminSecret],
  );

  const { counts } = data;
  const gaugePct = data.avgMatchScore != null ? Math.min(100, Math.max(0, data.avgMatchScore)) : 0;

  return (
    <div className="min-h-screen bg-[#0A0F18] pb-16 pt-8 text-white">
      <div className="container-site">
        <header className="mb-10 border-b border-[rgba(201,168,76,0.2)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">ArbeidMatch</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Operations dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">Live metrics, charts, and audit trail. Access is restricted to the admin secret.</p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Employer jobs (live)" value={counts.employerJobsLive} delay={0} />
          <StatCard label="Employer jobs (draft)" value={counts.employerJobsDraft} delay={0.05} />
          <StatCard label="Employer jobs (archived)" value={counts.employerJobsArchived} delay={0.1} />
          <StatCard label="Applications total" value={counts.applicationsTotal} delay={0.15} />
          <StatCard label="Candidates registered" value={counts.candidatesRegistered} delay={0.2} />
          <StatCard label="Employer requests" value={counts.employerRequestsTotal} delay={0.25} />
          <StatCard label="Partners" value={counts.partnersTotal} delay={0.3} />
          <StatCard
            label="Applications per live job"
            value={counts.conversionRate != null ? String(counts.conversionRate) : "—"}
            sub="Total applications ÷ live employer posts"
            delay={0.35}
          />
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Job posts per week (employer board)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.jobsPerWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Applications per day (14 days)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.applicationsPerDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: 8 }} />
                <Bar dataKey="count" fill={GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Employer job categories">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categoryDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
                  {data.categoryDistribution.map((_, i) => (
                    <Cell key={`c-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#C9A84C]">Average application match score</h3>
            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <div className="text-5xl font-bold tabular-nums text-white">{data.avgMatchScore != null ? `${data.avgMatchScore}%` : "—"}</div>
              <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#5c4a24] to-[#C9A84C]"
                  initial={{ width: 0 }}
                  animate={{ width: `${gaugePct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-white/50">Based on stored match_score on applications (up to 5000 rows).</p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-8">
          <h2 className="text-xl font-semibold text-white">Live tables</h2>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <caption className="border-b border-white/10 bg-white/[0.04] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C9A84C]">
                Latest employer jobs
              </caption>
              <thead className="bg-[#0D1B2A]/80 text-white/60">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Expires</th>
                  <th className="px-4 py-2">Applications</th>
                </tr>
              </thead>
              <tbody>
                {data.recentJobs.map((j) => (
                  <tr key={j.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/90">{j.title}</td>
                    <td className="px-4 py-2 text-white/70">{j.status}</td>
                    <td className="px-4 py-2 text-white/60">{j.expires_at ? j.expires_at.slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2 text-white/70">{j.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <caption className="border-b border-white/10 bg-white/[0.04] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C9A84C]">
                Latest applications
              </caption>
              <thead className="bg-[#0D1B2A]/80 text-white/60">
                <tr>
                  <th className="px-4 py-2">Job</th>
                  <th className="px-4 py-2">Candidate email</th>
                  <th className="px-4 py-2">Match</th>
                  <th className="px-4 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.map((a) => (
                  <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/90">{a.job_title}</td>
                    <td className="px-4 py-2 text-white/70">{a.email}</td>
                    <td className="px-4 py-2 text-white/70">{a.match_score ?? "—"}</td>
                    <td className="px-4 py-2 text-white/60">{a.submitted_at ? a.submitted_at.slice(0, 16) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <caption className="border-b border-white/10 bg-white/[0.04] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#C9A84C]">
                Latest employer requests
              </caption>
              <thead className="bg-[#0D1B2A]/80 text-white/60">
                <tr>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEmployers.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-white/90">{e.company}</td>
                    <td className="px-4 py-2 text-white/70">{e.email}</td>
                    <td className="px-4 py-2 text-white/60">{e.created_at?.slice(0, 16) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-amber-500/30 bg-amber-500/[0.06]">
            <table className="min-w-full text-left text-sm">
              <caption className="border-b border-amber-500/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-amber-200">
                Live jobs expiring within 7 days
              </caption>
              <thead className="bg-[#0D1B2A]/80 text-white/60">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Expires</th>
                  <th className="px-4 py-2">Employer email</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringSoon.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-white/50">
                      No listings in this window.
                    </td>
                  </tr>
                ) : (
                  data.expiringSoon.map((j) => (
                    <tr key={j.id} className="border-t border-white/5">
                      <td className="px-4 py-2 text-white/90">{j.title}</td>
                      <td className="px-4 py-2 text-amber-100/90">{j.expires_at?.slice(0, 16)}</td>
                      <td className="px-4 py-2 text-white/70">{j.employer_email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Audit log</h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={csvHref}
                className="inline-flex items-center rounded-lg border border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.12)] px-4 py-2 text-xs font-semibold text-[#C9A84C] hover:bg-[rgba(201,168,76,0.2)]"
              >
                Export CSV
              </a>
              <button
                type="button"
                disabled={auditLoading || auditPage <= 1}
                onClick={() => void loadAuditPage(auditPage - 1)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={auditLoading || auditPage * 50 >= auditTotal}
                onClick={() => void loadAuditPage(auditPage + 1)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-xs md:text-sm">
              <thead className="bg-[#0D1B2A]/90 text-white/55">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Meta</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-3 py-2 text-white/60">{r.created_at?.replace("T", " ").slice(0, 19)}</td>
                    <td className="px-3 py-2 text-[#C9A84C]">{r.event_type}</td>
                    <td className="px-3 py-2 text-white/75">
                      {r.entity_type}
                      {r.entity_id ? <span className="block font-mono text-[10px] text-white/45">{r.entity_id}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-white/70">{r.actor}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 font-mono text-[10px] text-white/50">
                      {JSON.stringify(r.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-white/45">
            Page {auditPage} — {auditTotal} events total
          </p>
        </section>
      </div>
    </div>
  );
}
