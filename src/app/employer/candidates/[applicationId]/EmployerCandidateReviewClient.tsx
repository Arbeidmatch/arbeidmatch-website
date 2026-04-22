"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ApiPayload = {
  stage: 1 | 2;
  jobTitle: string;
  matchScore: number | null;
  jobCategory: string;
  jobExperienceSignal: number | null;
  candidateExperienceBand: string;
  salaryExpectationLabel: string;
  rotationPreference: string;
  hasDrivingLicense: boolean;
  housingPreference: string;
  travelPreference: string;
  behavioralAnswers: { deliveryUnderPressure?: string; safetyOnSite?: string } | null;
  employerDecision: string;
  fullName?: string;
  email?: string;
  phone?: string;
  videoUrl?: string;
};

function compatibilityTierLabel(percent: number): string {
  if (percent >= 85) return "Strong compatibility";
  if (percent >= 70) return "Good compatibility";
  return "Low compatibility";
}

function experienceBandLabel(band: string): string {
  switch (band) {
    case "0_2":
      return "0 to 2 years band";
    case "2_5":
      return "2 to 5 years band";
    case "5_10":
      return "5 to 10 years band";
    case "10_plus":
      return "10+ years band";
    default:
      return band;
  }
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function EmployerCandidateReviewClient({ applicationId }: { applicationId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiPayload | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<"Experience" | "Salary" | "Location" | "Professionalism" | "Other">(
    "Experience",
  );
  const [rejectDetails, setRejectDetails] = useState("");
  const [rejectShare, setRejectShare] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Secure token missing from link.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/employer/applications/${applicationId}?token=${encodeURIComponent(token)}`);
    const body = (await res.json().catch(() => ({}))) as ApiPayload & { error?: string };
    if (!res.ok) {
      setError(body.error || "Could not load application.");
      setData(null);
    } else {
      setError(null);
      setData(body as ApiPayload);
    }
    setLoading(false);
  }, [applicationId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const embedUrl = useMemo(() => {
    if (!data || data.stage !== 2 || !data.videoUrl) return null;
    return youtubeEmbedUrl(data.videoUrl);
  }, [data]);

  async function postDecision(payload: Record<string, unknown>) {
    setBusy(String(payload.action));
    setError(null);
    const res = await fetch(`/api/employer/applications/${applicationId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(body.error || "Request failed.");
      setBusy(null);
      return;
    }
    setRejectOpen(false);
    setBusy(null);
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-white/70">
        <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" aria-hidden />
        <span className="text-sm">Loading candidate...</span>
      </div>
    );
  }

  if (error && !data) {
    return <p className="text-center text-sm text-red-300">{error}</p>;
  }

  if (!data) return null;

  const pending = data.employerDecision === "pending";
  const stage2 = data.stage === 2;

  return (
    <div className="space-y-6">
      <header className="rounded-[18px] border border-[#C9A84C]/25 bg-white/[0.03] p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Employer review</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{data.jobTitle}</h1>
        <p className="mt-2 text-sm text-white/65">
          {stage2 ? "Contact unlocked for this candidate." : "Anonymous profile preview. Contact stays hidden until you accept."}
        </p>
      </header>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="grid gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:grid-cols-2 md:p-6">
        <Stat
          label="Compatibility level"
          value={
            data.matchScore !== null
              ? `${compatibilityTierLabel(data.matchScore)} (${data.matchScore}% compatible with this role)`
              : "n/a"
          }
        />
        <Stat label="Job category" value={data.jobCategory} />
        <Stat label="Candidate experience band" value={experienceBandLabel(data.candidateExperienceBand)} />
        <Stat label="Salary expectations" value={data.salaryExpectationLabel} />
        <Stat label="Rotation preference" value={data.rotationPreference} />
        <Stat label="Driving licence (profile signal)" value={data.hasDrivingLicense ? "Yes" : "No"} />
        <Stat label="Housing preference" value={data.housingPreference} />
        <Stat label="Travel preference" value={data.travelPreference} />
        {data.jobExperienceSignal !== null ? (
          <Stat label="Employer experience signal (years)" value={String(data.jobExperienceSignal)} />
        ) : null}
      </section>

      <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Behavioral answers</h2>
        <div className="mt-3 space-y-3 text-sm text-white/75">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[#C9A84C]">Delivery under pressure</p>
            <p className="mt-1 whitespace-pre-wrap">{data.behavioralAnswers?.deliveryUnderPressure || "Not provided."}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[#C9A84C]">Safety mindset</p>
            <p className="mt-1 whitespace-pre-wrap">{data.behavioralAnswers?.safetyOnSite || "Not provided."}</p>
          </div>
        </div>
      </section>

      {stage2 ? (
        <section className="rounded-[18px] border border-[#C9A84C]/30 bg-[rgba(201,168,76,0.06)] p-5 md:p-6">
          <h2 className="text-lg font-semibold text-white">Unlocked contact</h2>
          <div className="mt-3 grid gap-3 text-sm text-white/85 md:grid-cols-2">
            <Stat label="Full name" value={data.fullName ?? ""} />
            <Stat label="Email" value={data.email ?? ""} />
            <Stat label="Phone" value={data.phone ?? ""} />
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[#C9A84C]">Video</p>
            {embedUrl ? (
              <iframe
                title="Candidate video"
                src={embedUrl}
                className="mt-2 aspect-video w-full max-w-xl rounded-md border border-white/15"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : data.videoUrl ? (
              <a
                href={data.videoUrl}
                className="mt-2 inline-block text-sm font-semibold text-[#C9A84C] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open candidate video
              </a>
            ) : (
              <p className="mt-2 text-sm text-white/55">No video URL on file.</p>
            )}
          </div>
        </section>
      ) : null}

      {pending ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void postDecision({ action: "accept_interview", token })}
            className="btn-gold-premium min-h-[44px] rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-50"
          >
            {busy === "accept_interview" ? "Saving..." : "Accept for interview"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void postDecision({ action: "accept_hire", token })}
            className="btn-outline-premium min-h-[44px] rounded-md border border-[#C9A84C]/45 px-4 py-2 text-sm font-semibold text-[#C9A84C] disabled:opacity-50"
          >
            {busy === "accept_hire" ? "Saving..." : "Accept for hire"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => {
              setRejectDetails("");
              setRejectReason("Experience");
              setRejectShare(false);
              setRejectOpen(true);
            }}
            className="min-h-[44px] rounded-md border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <p className="text-sm text-white/70">Decision recorded as {data.employerDecision.replace(/_/g, " ")}.</p>
      )}

      {rejectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[16px] border border-[#C9A84C]/25 bg-[#0f1923] p-5 text-white">
            <h2 className="text-lg font-semibold text-white">Rejection feedback</h2>
            <p className="mt-2 text-sm text-white/65">Feedback is required before you can leave this step.</p>
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-white/85">
                <span>Reason</span>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as typeof rejectReason)}
                  className="input-premium--dark min-h-[44px] rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white"
                >
                  <option>Experience</option>
                  <option>Salary</option>
                  <option>Location</option>
                  <option>Professionalism</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-white/85">
                <span>Details</span>
                <textarea
                  value={rejectDetails}
                  onChange={(e) => setRejectDetails(e.target.value)}
                  className="input-premium--dark min-h-[120px] rounded-md border border-white/15 bg-[#0A0F18] px-3 py-2 text-sm text-white"
                  minLength={8}
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={rejectShare} onChange={(e) => setRejectShare(e.target.checked)} />
                Share feedback with candidate by email
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-gold-premium min-h-[44px] rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-50"
                disabled={busy === "reject" || rejectDetails.trim().length < 8}
                onClick={() =>
                  void postDecision({
                    action: "reject",
                    token,
                    reason: rejectReason,
                    details: rejectDetails.trim(),
                    shareWithCandidate: rejectShare,
                  })
                }
              >
                {busy === "reject" ? "Submitting..." : "Submit rejection"}
              </button>
              <button
                type="button"
                className="btn-outline-premium min-h-[44px] rounded-md border border-white/20 px-4 py-2 text-sm text-white/75"
                disabled={!!busy}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const ok = window.confirm("Leave rejection without sending? You can open Reject again later.");
                    if (ok) setRejectOpen(false);
                  }
                }}
              >
                Back without submitting
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0D1B2A]/60 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
