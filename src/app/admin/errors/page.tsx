"use client";

import { useMemo, useState } from "react";

type ErrorStatus = "open" | "fixed" | "all";

type ErrorRow = {
  id: string;
  created_at: string;
  route: string;
  error_message: string;
  error_stack: string | null;
  context: unknown;
  fix_applied: string | null;
  fix_commit: string | null;
  status: "open" | "fixed" | "ignored";
  resolved_at: string | null;
  environment: string | null;
};

const FILTERS: ErrorStatus[] = ["all", "open", "fixed"];

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminErrorsPage() {
  const configuredPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(!configuredPassword);
  const [status, setStatus] = useState<ErrorStatus>("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadErrors(nextStatus: ErrorStatus) {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/admin/errors?status=${nextStatus}`, {
        headers: configuredPassword
          ? { "x-admin-password": password }
          : undefined,
      });
      const data = (await response.json()) as { errors?: ErrorRow[]; error?: string };
      if (!response.ok) {
        setFetchError(data.error || "Failed to fetch errors.");
        return;
      }
      setErrors(data.errors || []);
    } catch {
      setFetchError("Network error while loading errors.");
    } finally {
      setLoading(false);
    }
  }

  const title = useMemo(() => {
    if (status === "open") return "Open Errors";
    if (status === "fixed") return "Fixed Errors";
    return "All Errors";
  }, [status]);

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#0a0f18] px-4 py-16 text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-2xl font-bold">Admin Errors</h1>
          <p className="mt-2 text-sm text-white/60">Enter admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-4 w-full rounded-lg border border-white/20 bg-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C9A84C] focus:outline-none"
            placeholder="Admin password"
          />
          <button
            type="button"
            onClick={() => {
              if (password === configuredPassword) {
                setUnlocked(true);
                void loadErrors(status);
              } else {
                setFetchError("Invalid password.");
              }
            }}
            className="mt-4 w-full rounded-lg bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#0a0f18] hover:bg-[#b8953f]"
          >
            Unlock
          </button>
          {fetchError ? <p className="mt-3 text-sm text-red-300">{fetchError}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f18] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Error Log Admin</h1>
          <div className="flex gap-2">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                  void loadErrors(value);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  status === value
                    ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                    : "border-white/15 bg-white/[0.03] text-white/70"
                }`}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-4 text-sm text-white/60">{title}</p>

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-white/70">Loading errors...</div>
        ) : null}

        {!loading && fetchError ? (
          <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">{fetchError}</div>
        ) : null}

        {!loading && !fetchError && errors.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
            No errors found for this filter.
          </div>
        ) : null}

        {!loading && !fetchError && errors.length > 0 ? (
          <div className="space-y-3">
            {errors.map((item) => {
              const expanded = expandedId === item.id;
              const statusClass =
                item.status === "fixed"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : "border-red-400/40 bg-red-500/10 text-red-300";

              return (
                <article
                  key={item.id}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase ${statusClass}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-white/50">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#C9A84C]">{item.route}</p>
                  <p className="mt-1 text-sm text-white/80">{item.error_message}</p>

                  {expanded ? (
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Environment</p>
                        <p className="mt-1 text-white/80">{item.environment || "unknown"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Stack Trace</p>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-black/20 p-3 text-xs text-white/80">
                          {item.error_stack || "No stack trace"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Fix Applied</p>
                        <p className="mt-1 text-white/80">{item.fix_applied || "None"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Fix Commit</p>
                        <p className="mt-1 text-white/80">{item.fix_commit || "None"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">Context JSON</p>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-black/20 p-3 text-xs text-white/80">
                          {prettyJson(item.context)}
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
