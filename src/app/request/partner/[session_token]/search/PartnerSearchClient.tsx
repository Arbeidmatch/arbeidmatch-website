"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

type Mode = "quick_match" | "custom_search";

type CandidateResult = {
  candidate_hash: string;
  initials: string;
  category: string;
  experience_years: number;
  compatibility_score: number;
  skills_preview: string[];
};

type SessionCheck = { valid: boolean; reason?: "expired" | "invalid" };
interface Props {
  session_token: string;
}

const CATEGORY_OPTIONS = [
  "Construction & Civil",
  "Electrical & Technical",
  "Logistics & Transport",
  "Industry & Production",
  "Cleaning & Facility",
  "Hospitality & Healthcare",
];

const LANGUAGE_OPTIONS = ["English", "Norwegian", "Romanian", "Polish"];

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/12">
      <div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ResultCard({
  candidate,
  requested,
  requesting,
  onRequest,
  index,
}: {
  candidate: CandidateResult;
  requested: boolean;
  requesting: boolean;
  onRequest: (candidateHash: string, category: string) => Promise<void>;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.05 }}
      className="rounded-2xl border border-white/15 bg-white/[0.04] p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C9A84C] text-sm font-bold text-[#0D1B2A]">
          {candidate.initials}
        </div>
        <span className="rounded-full bg-[#C9A84C]/15 px-2 py-1 text-xs font-semibold text-[#C9A84C]">{candidate.category}</span>
      </div>
      <p className="mt-3 text-sm text-white/80">Experience: {candidate.experience_years} years</p>
      <p className="mt-1 text-sm font-semibold text-white">Compatibility: {candidate.compatibility_score}%</p>
      <ProgressBar value={candidate.compatibility_score} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.skills_preview.map((skill) => (
          <span key={skill} className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-2 py-1 text-xs text-[#C9A84C]">
            {skill}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void onRequest(candidate.candidate_hash, candidate.category)}
        disabled={requested || requesting}
        className="mt-4 w-full rounded-xl border border-[#C9A84C]/45 bg-transparent px-4 py-2 text-sm font-semibold text-[#C9A84C] disabled:opacity-60"
      >
        {requested ? "Requested ✓" : requesting ? "Requesting..." : "Request Full Profile"}
      </button>
    </motion.article>
  );
}

export default function PartnerSearchClient({ session_token }: Props) {
  const sessionToken = session_token;
  const searchParams = useSearchParams();

  const [sessionState, setSessionState] = useState<"loading" | "ready" | "expired" | "invalid">("loading");
  const [mode, setMode] = useState<Mode>("quick_match");

  useLayoutEffect(() => {
    const p = searchParams.get("mode");
    if (p === "custom_search") setMode("custom_search");
    else setMode("quick_match");
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [quickCategory, setQuickCategory] = useState(CATEGORY_OPTIONS[0]);
  const [quickExperienceMin, setQuickExperienceMin] = useState(2);
  const [quickDrivingLicense, setQuickDrivingLicense] = useState(false);
  const [quickLanguage, setQuickLanguage] = useState("English");

  const [customCategory, setCustomCategory] = useState("");
  const [customExperienceMin, setCustomExperienceMin] = useState("");
  const [customExperienceMax, setCustomExperienceMax] = useState("");
  const [customDrivingLicense, setCustomDrivingLicense] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");
  const [customAvailability, setCustomAvailability] = useState<"all" | "available" | "unavailable">("all");

  const customPayload = useMemo(
    () => ({
      session_token: sessionToken,
      filters: {
        category: customCategory || undefined,
        experience_min: customExperienceMin ? Number(customExperienceMin) : undefined,
        experience_max: customExperienceMax ? Number(customExperienceMax) : undefined,
        driving_license: customDrivingLicense || undefined,
        languages: customLanguage ? [customLanguage] : undefined,
        availability: customAvailability,
      },
    }),
    [sessionToken, customCategory, customExperienceMin, customExperienceMax, customDrivingLicense, customLanguage, customAvailability],
  );

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify-partner-session?token=${encodeURIComponent(sessionToken)}`);
        const data = (await res.json()) as SessionCheck;
        if (res.ok && data.valid) {
          setSessionState("ready");
          return;
        }
        setSessionState(data.reason === "expired" ? "expired" : "invalid");
      } catch {
        setSessionState("invalid");
      }
    }
    void verify();
  }, [sessionToken]);

  useEffect(() => {
    if (sessionState !== "ready" || mode !== "custom_search") return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/partner/custom-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...customPayload, page: 1 }),
        });
        const payload = (await res.json()) as { candidates?: CandidateResult[]; has_more?: boolean; error?: string };
        if (!res.ok) {
          setMessage(payload.error ?? "Custom search failed.");
          return;
        }
        setResults(payload.candidates ?? []);
        setPage(1);
        setHasMore(Boolean(payload.has_more));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [customPayload, mode, sessionState]);

  async function runQuickMatch() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/partner/quick-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          job_category: quickCategory,
          experience_min: quickExperienceMin,
          driving_license_required: quickDrivingLicense,
          languages: [quickLanguage],
        }),
      });
      const payload = (await res.json()) as { candidates?: CandidateResult[]; error?: string };
      if (!res.ok) {
        setMessage(payload.error ?? "Quick match failed.");
        return;
      }
      setResults(payload.candidates ?? []);
      setPage(1);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await fetch("/api/partner/custom-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customPayload, page: nextPage }),
      });
      const payload = (await res.json()) as { candidates?: CandidateResult[]; has_more?: boolean };
      if (res.ok) {
        setResults((prev) => [...prev, ...(payload.candidates ?? [])]);
        setPage(nextPage);
        setHasMore(Boolean(payload.has_more));
      }
    } finally {
      setLoading(false);
    }
  }

  async function requestProfile(candidateHash: string, jobCategory: string) {
    if (requesting[candidateHash] || requested[candidateHash]) return;
    setRequesting((prev) => ({ ...prev, [candidateHash]: true }));
    setMessage(null);
    try {
      const res = await fetch("/api/partner/request-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          candidate_hash: candidateHash,
          job_category: jobCategory,
        }),
      });
      const payload = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !payload.success) {
        setMessage(payload.error ?? "Could not send request.");
        return;
      }
      setRequested((prev) => ({ ...prev, [candidateHash]: true }));
      setMessage(payload.message ?? "Request received.");
    } finally {
      setRequesting((prev) => ({ ...prev, [candidateHash]: false }));
    }
  }

  if (sessionState === "loading") {
    return <section className="min-h-screen bg-[#0D1B2A] px-6 py-20 text-center text-white/70">Verifying secure link...</section>;
  }
  if (sessionState === "expired" || sessionState === "invalid") {
    return (
      <section className="min-h-screen bg-[#0D1B2A] px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C9A84C]/25 bg-white/[0.04] p-8 text-center">
          <h1 className="text-2xl font-bold">{sessionState === "expired" ? "This link has expired." : "Invalid partner link."}</h1>
          <Link href="/request" className="mt-6 inline-flex rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]">
            Back to request
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0D1B2A] px-4 py-12 text-white md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-white">Find Your Candidates</h1>
        <p className="mt-3 text-white/75">Search anonymized profiles and request full profile access in one flow.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("quick_match")}
            className={`rounded-2xl border p-6 text-left transition ${
              mode === "quick_match" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-white/15 bg-white/[0.04] hover:border-white/30"
            }`}
          >
            <Zap className="h-8 w-8 text-[#C9A84C]" />
            <h2 className="mt-3 text-xl font-semibold text-white">Quick Match</h2>
            <p className="mt-2 text-sm text-white/70">Automatically find high-compatibility candidate profiles.</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("custom_search")}
            className={`rounded-2xl border p-6 text-left transition ${
              mode === "custom_search" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-white/15 bg-white/[0.04] hover:border-white/30"
            }`}
          >
            <SlidersHorizontal className="h-8 w-8 text-[#C9A84C]" />
            <h2 className="mt-3 text-xl font-semibold text-white">Custom Search</h2>
            <p className="mt-2 text-sm text-white/70">Build your own filters and explore all matching candidates.</p>
          </button>
        </div>

        {mode === "quick_match" ? (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <label className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white">
                Experience min: {quickExperienceMin} years
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={1}
                  value={quickExperienceMin}
                  onChange={(e) => setQuickExperienceMin(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white">
                <input type="checkbox" checked={quickDrivingLicense} onChange={(e) => setQuickDrivingLicense(e.target.checked)} />
                Driving license required
              </label>
              <select
                value={quickLanguage}
                onChange={(e) => setQuickLanguage(e.target.value)}
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white"
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void runQuickMatch()}
              disabled={loading}
              className="mt-4 inline-flex rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A] disabled:opacity-60"
            >
              {loading ? "Finding..." : "Find Matches"}
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white"
              >
                <option value="">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={customExperienceMin}
                onChange={(e) => setCustomExperienceMin(e.target.value)}
                placeholder="Experience min"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <input
                type="number"
                value={customExperienceMax}
                onChange={(e) => setCustomExperienceMax(e.target.value)}
                placeholder="Experience max"
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <select
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white"
              >
                <option value="">All languages</option>
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              <select
                value={customAvailability}
                onChange={(e) => setCustomAvailability(e.target.value as "all" | "available" | "unavailable")}
                className="rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white"
              >
                <option value="all">All availability</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#0A1624] px-3 py-2 text-sm text-white">
                <input type="checkbox" checked={customDrivingLicense} onChange={(e) => setCustomDrivingLicense(e.target.checked)} />
                Driving license only
              </label>
            </div>
          </div>
        )}

        {message ? <p className="mt-4 text-sm text-[#C9A84C]">{message}</p> : null}

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="mt-4 h-3 w-3/4 rounded bg-white/10" />
                  <div className="mt-2 h-2 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map((candidate, index) => (
                  <ResultCard
                    key={candidate.candidate_hash}
                    candidate={candidate}
                    requested={Boolean(requested[candidate.candidate_hash])}
                    requesting={Boolean(requesting[candidate.candidate_hash])}
                    onRequest={requestProfile}
                    index={index}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
          {!loading && results.length === 0 ? <p className="text-sm text-white/70">No candidates found for current filters.</p> : null}
        </div>

        {mode === "custom_search" && hasMore ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loading}
              className="rounded-xl border border-[#C9A84C]/45 bg-transparent px-5 py-3 text-sm font-semibold text-[#C9A84C] disabled:opacity-60"
            >
              Load More
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
