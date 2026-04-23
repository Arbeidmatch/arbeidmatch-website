"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SlidersHorizontal, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type SessionCheck = {
  valid: boolean;
  reason?: "expired" | "invalid";
};

type CandidateCard = {
  candidateId: string;
  initials: string;
  category: string;
  experienceYears: number;
  compatibilityScore: number;
};

type FilterState = {
  jobCategory: string;
  experienceMin: string;
  experienceMax: string;
  drivingLicense: boolean;
  language: string;
  availability: string;
};

type Mode = "quick" | "custom";

const DEFAULT_FILTERS: FilterState = {
  jobCategory: "",
  experienceMin: "",
  experienceMax: "",
  drivingLicense: false,
  language: "",
  availability: "",
};

export default function PartnerSessionPage() {
  const { session_token } = useParams<{ session_token: string }>();
  const [state, setState] = useState<"loading" | "ready" | "expired" | "invalid">("loading");
  const [mode, setMode] = useState<Mode>("quick");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResults, setQuickResults] = useState<CandidateCard[]>([]);
  const [customFilters, setCustomFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [customResults, setCustomResults] = useState<CandidateCard[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [requestingIds, setRequestingIds] = useState<Record<string, boolean>>({});
  const [requestedIds, setRequestedIds] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/verify-partner-session?token=${encodeURIComponent(session_token)}`);
        const data = (await response.json()) as SessionCheck;
        if (response.ok && data.valid) {
          setState("ready");
          return;
        }
        if (data.reason === "expired") {
          setState("expired");
          return;
        }
        setState("invalid");
      } catch {
        setState("invalid");
      }
    };
    void run();
  }, [session_token]);

  const activeResults = mode === "quick" ? quickResults : customResults;
  const isActiveLoading = mode === "quick" ? quickLoading : customLoading;

  async function runQuickMatch() {
    setQuickLoading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/partner/quick-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token }),
      });
      const payload = (await response.json().catch(() => null)) as { candidates?: CandidateCard[]; error?: string } | null;
      if (!response.ok) {
        setFeedback(payload?.error || "Quick Match failed.");
        return;
      }
      setQuickResults(payload?.candidates || []);
    } finally {
      setQuickLoading(false);
    }
  }

  useEffect(() => {
    if (mode !== "custom" || state !== "ready") return;
    const t = window.setTimeout(async () => {
      setCustomLoading(true);
      try {
        const response = await fetch("/api/partner/custom-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_token,
            jobCategory: customFilters.jobCategory || undefined,
            experienceMin: customFilters.experienceMin ? Number(customFilters.experienceMin) : undefined,
            experienceMax: customFilters.experienceMax ? Number(customFilters.experienceMax) : undefined,
            drivingLicense: customFilters.drivingLicense,
            language: customFilters.language || undefined,
            availability: customFilters.availability || undefined,
          }),
        });
        const payload = (await response.json().catch(() => null)) as { candidates?: CandidateCard[] } | null;
        if (response.ok) {
          setCustomResults(payload?.candidates || []);
        }
      } finally {
        setCustomLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [customFilters, mode, session_token, state]);

  async function requestFullProfile(candidateId: string) {
    if (requestingIds[candidateId] || requestedIds[candidateId]) return;
    setRequestingIds((prev) => ({ ...prev, [candidateId]: true }));
    setFeedback(null);
    try {
      const partnerDomain = typeof window !== "undefined" ? window.location.hostname : "arbeidmatch.no";
      const response = await fetch("/api/candidate-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": session_token,
        },
        body: JSON.stringify({
          candidateId,
          role: mode === "quick" ? "Quick Match Request" : "Custom Search Request",
          partnerDomain,
        }),
      });
      if (response.ok) {
        setRequestedIds((prev) => ({ ...prev, [candidateId]: true }));
        setFeedback("Request sent. Our team will review and follow up on post@arbeidmatch.no.");
      } else {
        setFeedback("Could not send request right now.");
      }
    } finally {
      setRequestingIds((prev) => ({ ...prev, [candidateId]: false }));
    }
  }

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setCustomFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (state === "loading") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-center text-white">
        <p className="text-white/70">Verifying secure link...</p>
      </section>
    );
  }

  if (state === "expired") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            This link has expired. Partner links are valid for 14 days. Request a new one below.
          </h1>
          <Link
            href="/request"
            className="mx-auto mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
          >
            Request new link
          </Link>
        </div>
      </section>
    );
  }

  if (state === "invalid") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Invalid link.</h1>
          <Link
            href="/request"
            className="mx-auto mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
          >
            Back to request
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0D1B2A] px-4 py-12 text-white md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-white">Find Candidates</h1>
        <p className="mt-3 text-white/75">Choose how you want to discover anonymized candidate profiles.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`rounded-2xl border p-6 text-left transition ${
              mode === "quick" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-white/15 bg-white/[0.04] hover:border-white/30"
            }`}
          >
            <Zap className="h-8 w-8 text-[#C9A84C]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Quick Match</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Get matched automatically</h2>
            <p className="mt-2 text-sm text-white/70">Receive candidates with 80%+ compatibility score based on your requirements</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`rounded-2xl border p-6 text-left transition ${
              mode === "custom" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-white/15 bg-white/[0.04] hover:border-white/30"
            }`}
          >
            <SlidersHorizontal className="h-8 w-8 text-[#C9A84C]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Custom Search</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Define your own criteria</h2>
            <p className="mt-2 text-sm text-white/70">Filter candidates manually by skills, experience, location and more</p>
          </button>
        </div>

        {mode === "quick" ? (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-5">
            <button
              type="button"
              onClick={() => void runQuickMatch()}
              disabled={quickLoading}
              className="inline-flex rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A] disabled:opacity-60"
            >
              {quickLoading ? "Matching..." : "Start Quick Match"}
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input
                value={customFilters.jobCategory}
                onChange={(e) => updateFilter("jobCategory", e.target.value)}
                placeholder="Job category"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <input
                type="number"
                value={customFilters.experienceMin}
                onChange={(e) => updateFilter("experienceMin", e.target.value)}
                placeholder="Experience min (years)"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <input
                type="number"
                value={customFilters.experienceMax}
                onChange={(e) => updateFilter("experienceMax", e.target.value)}
                placeholder="Experience max (years)"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <input
                value={customFilters.language}
                onChange={(e) => updateFilter("language", e.target.value)}
                placeholder="Languages"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <input
                value={customFilters.availability}
                onChange={(e) => updateFilter("availability", e.target.value)}
                placeholder="Availability"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white/85">
                <input
                  type="checkbox"
                  checked={customFilters.drivingLicense}
                  onChange={(e) => updateFilter("drivingLicense", e.target.checked)}
                />
                Driving license required
              </label>
            </div>
          </div>
        )}

        {feedback ? <p className="mt-4 text-sm text-[#C9A84C]">{feedback}</p> : null}

        <div className="mt-8">
          {isActiveLoading ? <p className="text-white/70">Loading candidates...</p> : null}
          {!isActiveLoading && activeResults.length === 0 ? (
            <p className="text-white/70">No candidates found for this selection yet.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeResults.map((candidate) => {
              const score = Math.max(0, Math.min(100, candidate.compatibilityScore));
              return (
                <article key={candidate.candidateId} className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-white">{candidate.initials}</p>
                    <span className="rounded-full bg-[#C9A84C]/20 px-2 py-1 text-xs font-semibold text-[#C9A84C]">{score}%</span>
                  </div>
                  <p className="mt-3 text-sm text-white/80">Category: {candidate.category}</p>
                  <p className="mt-1 text-sm text-white/70">Experience: {candidate.experienceYears} years</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${score}%` }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => void requestFullProfile(candidate.candidateId)}
                    disabled={requestingIds[candidate.candidateId] || requestedIds[candidate.candidateId]}
                    className="mt-4 w-full rounded-xl border border-[#C9A84C]/45 bg-transparent px-4 py-2 text-sm font-semibold text-[#C9A84C] disabled:opacity-60"
                  >
                    {requestedIds[candidate.candidateId]
                      ? "Request Sent"
                      : requestingIds[candidate.candidateId]
                        ? "Sending..."
                        : "Request Full Profile"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
