"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminJobDto } from "@/components/admin/job-admin-types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function JobsAdminTable({ initialJobs }: { initialJobs: AdminJobDto[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "recman">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "closed" | "archived">("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (sourceFilter !== "all" && job.source !== sourceFilter) return false;
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (locationFilter !== "all" && job.location !== locationFilter) return false;
      if (categoryFilter !== "all" && (job.category ?? "none") !== categoryFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = [job.title, job.location, job.category ?? "", job.contractType ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, sourceFilter, statusFilter, locationFilter, categoryFilter, query]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()),
    [filtered],
  );

  const locations = useMemo(() => Array.from(new Set(jobs.map((job) => job.location))).sort(), [jobs]);
  const categories = useMemo(() => Array.from(new Set(jobs.map((job) => job.category ?? "none"))).sort(), [jobs]);

  async function togglePublish(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/admin/jobs/${id}/publish`, { method: "PATCH" });
    const payload = (await response.json()) as { job?: AdminJobDto };
    if (response.ok && payload.job) {
      setJobs((prev) => prev.map((job) => (job.id === id ? payload.job! : job)));
    }
    setBusyId("");
  }

  async function archive(id: string) {
    setBusyId(id);
    const response = await fetch(`/api/admin/jobs/${id}/archive`, { method: "PATCH" });
    const payload = (await response.json()) as { job?: AdminJobDto };
    if (response.ok && payload.job) {
      setJobs((prev) => prev.map((job) => (job.id === id ? payload.job! : job)));
    }
    setBusyId("");
  }

  async function syncRecman() {
    setBusyId("sync");
    await fetch("/api/integrations/recman/jobs/sync", { method: "POST" });
    const res = await fetch("/api/admin/jobs");
    const payload = (await res.json()) as { jobs: AdminJobDto[] };
    if (res.ok) setJobs(payload.jobs);
    setBusyId("");
  }

  return (
    <div className="rounded-[18px] border border-[#C9A84C]/20 bg-white/[0.03] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Jobs</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={syncRecman}
            disabled={busyId === "sync"}
            className="btn-outline-premium inline-flex min-h-[40px] items-center rounded-md border border-[#C9A84C]/35 px-4 py-2 text-sm font-semibold text-[#C9A84C]"
          >
            Sync RecMan jobs
          </button>
          <Link
            href="/admin/jobs/new"
            className="btn-gold-premium inline-flex min-h-[40px] items-center rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Add job
          </Link>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search jobs"
          className="input-premium--dark h-10 rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
        />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="select-premium input-premium--dark h-10 rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white">
          <option value="all">All sources</option>
          <option value="manual">Manual</option>
          <option value="recman">RecMan</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="select-premium input-premium--dark h-10 rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="select-premium input-premium--dark h-10 rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white">
          <option value="all">All locations</option>
          {locations.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-premium input-premium--dark h-10 rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white">
          <option value="all">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>{option === "none" ? "No category" : option}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/15 text-left text-white/70">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Contract</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Sync</th>
              <th className="py-2 pr-4">Published</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((job) => (
              <tr key={job.id} className="border-b border-white/10 text-white/85">
                <td className="py-3 pr-4">{job.title}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${job.source === "manual" ? "border border-sky-300/30 text-sky-200" : "border border-purple-300/30 text-purple-200"}`}>
                    {job.source}
                  </span>
                </td>
                <td className="py-3 pr-4">{job.location}</td>
                <td className="py-3 pr-4">{job.contractType ?? "-"}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">{job.status}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">{job.syncStatus ?? "none"}</span>
                </td>
                <td className="py-3 pr-4">{job.publishedAt ? formatDate(job.publishedAt) : "-"}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/jobs/${job.id}/edit`}
                      className="btn-outline-premium rounded-md border border-white/20 px-2.5 py-1 text-xs text-white/75"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => togglePublish(job.id)}
                      disabled={busyId === job.id}
                      className="btn-outline-premium rounded-md border border-[#C9A84C]/30 px-2.5 py-1 text-xs text-[#C9A84C] disabled:opacity-60"
                    >
                      {job.status === "active" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => archive(job.id)}
                      disabled={busyId === job.id}
                      className="btn-outline-premium rounded-md border border-amber-300/35 px-2.5 py-1 text-xs text-amber-200 disabled:opacity-60"
                    >
                      Archive
                    </button>
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="btn-outline-premium rounded-md border border-emerald-300/30 px-2.5 py-1 text-xs text-emerald-200"
                    >
                      View public
                    </Link>
                    <button
                      type="button"
                      onClick={syncRecman}
                      disabled={busyId === "sync" || job.source !== "recman"}
                      className="rounded-md border border-violet-300/40 px-2.5 py-1 text-xs text-violet-200 disabled:opacity-50"
                    >
                      Sync now
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
