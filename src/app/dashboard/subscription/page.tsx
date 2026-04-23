"use client";

import { useState } from "react";
import { requireFeatureFlag } from "@/lib/featureFlag";

type UsageResponse = {
  plan: string;
  status: string;
  requests_used: number;
  requests_limit: number | null;
  requests_remaining: number | null;
  period_end: string | null;
  cancel_at_period_end?: boolean;
};

export default function SubscriptionDashboardPage() {
  requireFeatureFlag();
  const [email, setEmail] = useState("");
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/usage?email=${encodeURIComponent(email)}`);
      const data = (await response.json().catch(() => ({}))) as UsageResponse;
      if (!response.ok) {
        alert("Could not load subscription.");
        return;
      }
      setUsage(data);
    } finally {
      setLoading(false);
    }
  };

  const manage = async (action: "cancel_at_period_end" | "resume") => {
    const response = await fetch("/api/subscriptions/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action }),
    });
    if (!response.ok) {
      alert("Could not update subscription.");
      return;
    }
    await loadUsage();
  };

  return (
    <main className="container-site section-y-tight">
      <h1 className="text-3xl font-semibold text-white">Subscription dashboard</h1>
      <p className="mt-2 text-sm text-white/70">Check plan usage and manage cancel/resume status.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="company@email.com"
          className="min-w-[280px] rounded-xl border border-white/20 bg-[#0D1B2A] px-3 py-2 text-sm text-white"
        />
        <button onClick={() => void loadUsage()} className="rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]">
          {loading ? "Loading..." : "Load usage"}
        </button>
      </div>

      {usage ? (
        <section className="mt-6 rounded-xl border border-white/15 bg-white/[0.03] p-5 text-sm text-white/80">
          <p>Plan: <strong>{usage.plan}</strong></p>
          <p>Status: <strong>{usage.status}</strong></p>
          <p>Requests used: <strong>{usage.requests_used}</strong></p>
          <p>Requests limit: <strong>{usage.requests_limit === null ? "Unlimited" : usage.requests_limit}</strong></p>
          <p>Remaining: <strong>{usage.requests_remaining === null ? "Unlimited" : usage.requests_remaining}</strong></p>
          <p>Period end: <strong>{usage.period_end ? new Date(usage.period_end).toUTCString() : "-"}</strong></p>
          <p>Cancel at period end: <strong>{usage.cancel_at_period_end ? "Yes" : "No"}</strong></p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void manage("cancel_at_period_end")}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-xs"
            >
              Cancel at period end
            </button>
            <button onClick={() => void manage("resume")} className="rounded-lg bg-[#C9A84C] px-3 py-1.5 text-xs text-[#0D1B2A]">
              Resume subscription
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
