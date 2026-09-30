"use client";
import { useEffect, useState } from "react";
type Incident = {
  id: string;
  ref: string;
  service: string;
  title: string;
  summary: string;
  state: string;
  workaround: string;
  updated_at: string;
  next_update_at: string | null;
};
type Snapshot = {
  health: string;
  checkedAt: string | null;
  incidents: Incident[];
  updates: {
    id: string;
    incident_id: string;
    message: string;
    created_at: string;
  }[];
};
const SERVICES = [
  ["access", "Sign-in & access"],
  ["candidates", "Candidates & profiles"],
  ["jobs", "Jobs & applications"],
  ["messages", "Messages & email"],
  ["documents", "Documents & signing"],
  ["integrations", "Integrations"],
];
const STATES: Record<string, string> = {
  reported: "Reported",
  investigating: "Investigating",
  in_progress: "In progress",
  verifying: "Verifying",
  resolved: "Resolved",
  maintenance: "Maintenance",
};
const date = (s: string | null) =>
  s
    ? new Date(s).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";
export function PlatformStatus() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [unavailable, setUnavailable] = useState(false),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let disposed = false;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    try {
      const saved = localStorage.getItem("recos-public-status-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.incidents) && Array.isArray(parsed.updates))
          setSnapshot(parsed);
      }
    } catch {
      /* Storage is optional. */
    }
    async function poll() {
      try {
        const response = await fetch("/api/recos-status", {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) throw new Error();
        const value = (await response.json()) as Snapshot;
        if (!disposed) {
          setSnapshot(value);
          setUnavailable(false);
          try {
            localStorage.setItem(
              "recos-public-status-v1",
              JSON.stringify(value),
            );
          } catch {
            /* Optional. */
          }
        }
      } catch {
        if (!disposed) setUnavailable(true);
      } finally {
        if (!disposed)
          timer = setTimeout(() => {
            if (document.visibilityState === "visible") void poll();
            else timer = setTimeout(poll, 60_000);
          }, 60_000);
      }
    }
    void poll();
    return () => {
      disposed = true;
      abort.abort();
      clearTimeout(timer);
    };
  }, [tick]);
  const age = Date.now() - Date.parse(snapshot?.checkedAt ?? "");
  const stale =
    unavailable || !Number.isFinite(age) || age > 15 * 60_000 || age < -60_000;
  const active = (snapshot?.incidents ?? []).filter(
    (i) => i.state !== "resolved",
  );
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-32 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-300">
            RecOS
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Platform status</h1>
        </div>
        <a
          href="https://ats.arbeidmatch.no/support"
          className="rounded-lg border border-white/20 px-4 py-3 text-sm"
        >
          Open support
        </a>
      </div>
      <section
        className={`mt-8 rounded-xl border p-6 ${stale ? "border-slate-500/40 bg-slate-700/20" : active.length || snapshot?.health !== "ok" ? "border-amber-400/30 bg-amber-400/10" : "border-emerald-400/30 bg-emerald-400/10"}`}
        aria-live="polite"
      >
        <h2 className="text-lg font-semibold">
          {stale
            ? "Current status is unavailable"
            : active.length
              ? "Some features are experiencing issues"
              : snapshot?.health === "ok"
                ? "No known service issues"
                : "Platform checks need attention"}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {stale
            ? "We cannot confirm the current state. Any updates below are the last information received."
            : "Status combines platform checks and confirmed incidents."}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Last checked: {date(snapshot?.checkedAt ?? null)}</span>
          <button
            className="min-h-11 text-emerald-300"
            onClick={() => setTick((t) => t + 1)}
          >
            Refresh status
          </button>
        </div>
      </section>
      <div className="mt-8 grid gap-7 md:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Platform services</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            {SERVICES.map(([id, name]) => (
              <div
                key={id}
                className="flex items-center justify-between gap-3 border-b border-white/10 p-4 last:border-0"
              >
                <span className="text-sm">{name}</span>
                <span
                  className={`text-xs ${stale ? "text-slate-400" : active.some((i) => i.service === id || i.service === "platform") ? "text-amber-300" : "text-emerald-300"}`}
                >
                  {stale
                    ? "Unknown"
                    : active.some(
                          (i) => i.service === id || i.service === "platform",
                        )
                      ? "Affected"
                      : snapshot?.health === "ok"
                        ? "No known issues"
                        : "Unknown"}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            {stale ? "Last received incidents" : "Active incidents"}
          </h2>
          <div className="space-y-4">
            {active.map((i) => (
              <article
                key={i.id}
                className="rounded-xl border border-white/10 bg-white/[.03] p-5"
              >
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="rounded bg-amber-400/10 px-2 py-1 text-amber-300">
                    {STATES[i.state] ?? "Under review"}
                  </span>
                  <span className="text-slate-400">{i.ref}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{i.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{i.summary}</p>
                {i.workaround && (
                  <p className="mt-3 rounded bg-white/5 p-3 text-sm">
                    {i.workaround}
                  </p>
                )}
                <ul className="mt-5 space-y-3 border-l border-white/20 pl-4">
                  {snapshot?.updates
                    .filter((u) => u.incident_id === i.id)
                    .slice(0, 5)
                    .map((u) => (
                      <li key={u.id} className="text-sm">
                        <time className="block text-xs text-slate-400">
                          {date(u.created_at)}
                        </time>
                        {u.message}
                      </li>
                    ))}
                </ul>
                <p className="mt-5 text-xs text-slate-400">
                  Updated {date(i.updated_at)}
                  {i.next_update_at
                    ? ` / Next update ${date(i.next_update_at)}`
                    : ""}
                </p>
              </article>
            ))}
            {!active.length && (
              <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-400">
                {stale
                  ? "No confirmed incident information is available."
                  : "No published active incidents."}
              </div>
            )}
          </div>
        </section>
      </div>
      <p className="mt-8 text-xs text-slate-400">
        This page is available without signing in. Private reports and
        conversations are never shown here.
      </p>
    </main>
  );
}
