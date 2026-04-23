"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, Mail, Pause, Play, Trash2 } from "lucide-react";

import { trackAlertLinkClicked, trackAlertSubscribed } from "@/lib/analytics/roleAlertEvents";
import { useToast } from "@/lib/toast-context";

type Frequency = "instant" | "daily" | "weekly";
type Status = "active" | "paused";

type RoleAlert = {
  id: string;
  role: string;
  status: Status;
  frequency: Frequency;
};

const ROLE_OPTIONS = [
  "Construction",
  "Electrician",
  "Plumber",
  "HVAC Technician",
  "Welder",
  "Logistics",
  "Industry",
  "Cleaning",
];

const FREQUENCY_OPTIONS: Array<{ value: Frequency; label: string }> = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export default function PartnerAlertsClient() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [alerts, setAlerts] = useState<RoleAlert[]>([
    { id: "a1", role: "Construction", status: "active", frequency: "instant" },
    { id: "a2", role: "Electrician", status: "paused", frequency: "daily" },
  ]);
  const [newRole, setNewRole] = useState("");
  const [newFrequency, setNewFrequency] = useState<Frequency>("instant");
  const [submitting, setSubmitting] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");

  const plan: "free" | "growth" | "scale" = "free";
  const activeAlerts = alerts.length;
  const maxAlerts = plan === "free" ? 2 : Number.POSITIVE_INFINITY;
  const limitReached = Number.isFinite(maxAlerts) && activeAlerts >= maxAlerts;

  const usageLabel = useMemo(() => {
    if (!Number.isFinite(maxAlerts)) return "Alerte active: unlimited (Growth/Scale)";
    return `Alerte active: ${activeAlerts}/${maxAlerts} (free tier)`;
  }, [activeAlerts, maxAlerts]);

  const costPerAlert = plan === "free" ? "0 NOK (inclus)" : "50 NOK/month";

  useEffect(() => {
    const sessionToken = searchParams.get("session_token") || searchParams.get("token");
    if (!sessionToken) return;
    let isActive = true;
    const loadPartnerEmail = async () => {
      try {
        const res = await fetch(`/api/verify-partner-session?token=${encodeURIComponent(sessionToken)}`);
        const data = (await res.json().catch(() => null)) as { valid?: boolean; email?: string | null } | null;
        if (!isActive || !res.ok || !data?.valid) return;
        if (data.email && data.email.includes("@")) {
          setPartnerEmail(data.email.trim().toLowerCase());
        }
      } catch {
        // leave manual email input available if session validation fails
      }
    };
    void loadPartnerEmail();
    return () => {
      isActive = false;
    };
  }, [searchParams]);

  const updateFrequency = (id: string, frequency: Frequency) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, frequency } : a)));
  };

  const toggleStatus = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === "active" ? "paused" : "active",
            }
          : a,
      ),
    );
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const subscribe = async () => {
    if (!newRole || submitting || limitReached) return;
    if (!partnerEmail.includes("@")) {
      toast.error("Enter your partner email to subscribe.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/alerts/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          partner_email: partnerEmail.trim().toLowerCase(),
          job_category: newRole,
          frequency: newFrequency,
          min_candidates: 1,
        }),
      });
      if (!res.ok) {
        toast.error("Could not create alert right now.");
        return;
      }
      setAlerts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: newRole,
          status: "active",
          frequency: newFrequency,
        },
      ]);
      setNewRole("");
      setNewFrequency("instant");
      trackAlertSubscribed(newRole, newFrequency);
      toast.success("You'll be notified when candidates arrive");
    } catch {
      toast.error("Could not create alert right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Partner dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Role Alerts</h1>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Active Role Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-white/10 bg-[#0A1624] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-[#C9A84C]" />
                    <p className="font-medium text-white">{alert.role}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        alert.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/65"
                      }`}
                    >
                      {alert.status === "active" ? "Active" : "Paused"}
                    </span>
                  </div>
                  <select
                    value={alert.frequency}
                    onChange={(e) => updateFrequency(alert.id, e.target.value as Frequency)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(alert.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:text-white"
                  >
                    {alert.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {alert.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAlert(alert.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-300/25 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Subscribe to New Role</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs text-white/60">Partner email</label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="name@company.no"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/60">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              >
                <option value="">Select role</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-white/60">Frequency</p>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      newFrequency === option.value
                        ? "border-[#C9A84C]/60 bg-[#C9A84C]/10 text-[#C9A84C]"
                        : "border-white/15 bg-white/5 text-white/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="alert-frequency"
                      className="sr-only"
                      checked={newFrequency === option.value}
                      onChange={() => setNewFrequency(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void subscribe()}
            disabled={!newRole || !partnerEmail.includes("@") || submitting || limitReached}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#C9A84C] px-6 py-3 font-bold text-[#0D1B2A] disabled:opacity-60"
          >
            {submitting ? "Subscribing..." : "Subscribe"}
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Usage & Pricing</h2>
          <p className="mt-3 text-sm text-white/75">{usageLabel}</p>
          <p className="mt-1 text-sm text-white/65">Cost per alert: {costPerAlert}</p>
          {limitReached ? (
            <Link
              href="/pricing"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84C]/45 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#C9A84C]"
            >
              Upgrade to Growth/Scale
            </Link>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Email Preview</h2>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0A1624] p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-2.5 py-1 text-xs text-[#C9A84C]">
              <Mail className="h-3.5 w-3.5" />
              Premium notification
            </div>
            <p className="mt-3 text-lg font-semibold text-white">New candidates available for Electrician</p>
            <p className="mt-1 text-sm text-white/70">Candidate count: 6</p>
            <Link
              href="/partner/search?role=Electrician"
              onClick={() => trackAlertLinkClicked("Electrician", "preview")}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-bold text-[#0D1B2A]"
            >
              View candidates
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
