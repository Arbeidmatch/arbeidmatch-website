"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Candidate = {
  id: string;
  nationality: string | null;
  city: string | null;
  country: string | null;
  availableFrom: string | null;
  englishLevel: string | null;
  norwegianLevel: string | null;
  yearsOfExperience: number | null;
  hasDrivingLicense: boolean | null;
  salaryExpectations: string | number | null;
  salaryExpectationsCurrency: string | null;
  qualificationOtherText: string | null;
  preferenceTags: unknown;
  rating: number | null;
  compatibilityScore: number;
};

type CandidatesResponse = {
  candidates: Candidate[];
  total: number;
};

type LoadState = "loading" | "ready" | "expired" | "error";

function formatValue(value: string | null | undefined, fallback = "Not provided"): string {
  const trimmed = (value || "").trim();
  return trimmed || fallback;
}

export default function PartnerCandidatesPage() {
  const params = useParams<{ session_token: string }>();
  const router = useRouter();
  const sessionToken = params?.session_token || "";

  const [state, setState] = useState<LoadState>("loading");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [interestedIds, setInterestedIds] = useState<Record<string, boolean>>({});

  const partnerDomain = useMemo(() => {
    if (typeof window === "undefined") return "unknown";
    const saved = window.localStorage.getItem("arbeidmatch_partner_domain") || "";
    return saved.trim() || "unknown";
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCandidates() {
      if (!sessionToken) {
        if (mounted) setState("expired");
        return;
      }

      const role = (window.localStorage.getItem("arbeidmatch_selected_role") || "").trim();
      if (mounted) setSelectedRole(role);
      const query = role ? `?role=${encodeURIComponent(role)}` : "";

      const response = await fetch(`/api/candidates${query}`, {
        method: "GET",
        headers: {
          "x-session-token": sessionToken,
        },
      }).catch(() => null);

      if (!mounted) return;

      if (!response) {
        setState("error");
        return;
      }

      if (response.status === 401) {
        setState("expired");
        return;
      }

      if (!response.ok) {
        setState("error");
        return;
      }

      const payload = (await response.json().catch(() => null)) as CandidatesResponse | null;
      setCandidates(payload?.candidates || []);
      setState("ready");
    }

    loadCandidates();
    return () => {
      mounted = false;
    };
  }, [sessionToken]);

  async function expressInterest(candidate: Candidate) {
    if (!sessionToken || interestedIds[candidate.id]) return;

    const response = await fetch("/api/candidate-interest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": sessionToken,
      },
      body: JSON.stringify({
        candidateId: candidate.id,
        role: selectedRole || "unspecified",
        partnerDomain,
      }),
    }).catch(() => null);

    if (response?.ok) {
      setInterestedIds((prev) => ({ ...prev, [candidate.id]: true }));
    }
  }

  if (state === "loading") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-4 py-16 text-white">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto h-10 w-10">
            <svg className="spinner-arc" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="46 18" />
            </svg>
          </div>
          <p className="mt-4 text-white/80">Loading candidate profiles...</p>
        </div>
        <style jsx>{`
          .spinner-arc {
            width: 100%;
            height: 100%;
            color: #c9a84c;
            animation: spin 1s linear infinite;
            transform-origin: 50% 50%;
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </section>
    );
  }

  if (state === "expired") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-4 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
          <p className="text-lg font-medium text-white">Your session has expired. Please request a new access link.</p>
          <button
            type="button"
            onClick={() => router.push("/request")}
            className="mt-6 rounded-[10px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
          >
            Back to start
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-dvh bg-[#0D1B2A] px-4 py-12 text-white md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold text-white">Available Candidate Profiles</h1>
        <p className="mt-3 text-[15px] text-white/75">Profiles are shown anonymously. Contact details are shared only after mutual agreement.</p>
        {selectedRole ? <p className="mt-2 text-sm text-[#C9A84C]">Role filter: {selectedRole}</p> : null}

        {state === "error" ? (
          <div className="mt-8 rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-6 text-white/85">
            Could not load candidates right now. Please try again.
          </div>
        ) : null}

        {state === "ready" && candidates.length === 0 ? (
          <div className="mt-8 rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-6 text-white/85">
            No candidate profiles available for this role yet. Please try another role from the request page.
            <div className="mt-4">
              <Link href="/request" className="inline-flex rounded-[10px] bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]">
                Back to start
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate, index) => {
            const location = [formatValue(candidate.city, ""), formatValue(candidate.country, "")]
              .filter(Boolean)
              .join(", ");
            const salaryValue = candidate.salaryExpectations;
            const salaryCurrency = (candidate.salaryExpectationsCurrency || "").trim();
            const hasSalary = salaryValue !== null && salaryValue !== "" && salaryCurrency;
            const sent = !!interestedIds[candidate.id];

            return (
              <article
                key={candidate.id}
                className="relative flex h-full flex-col rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-6 transition-colors duration-[220ms] hover:border-[rgba(201,168,76,0.4)]"
              >
                <span className="absolute right-4 top-4 rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-bold text-[#0D1B2A]">
                  {candidate.compatibilityScore}%
                </span>
                <h2 className="pr-20 text-lg font-bold text-white">Candidate #{index + 1}</h2>
                <div className="mt-4 space-y-2 text-sm text-white/82">
                  <p>Nationality: {formatValue(candidate.nationality)}</p>
                  <p>Location: {location || "Not provided"}</p>
                  <p>Experience: {candidate.yearsOfExperience ?? 0} years experience</p>
                  <p>Available from: {formatValue(candidate.availableFrom)}</p>
                  <p>English level: {formatValue(candidate.englishLevel)}</p>
                  <p>Norwegian level: {formatValue(candidate.norwegianLevel)}</p>
                  <p>Driving license: {candidate.hasDrivingLicense ? "Yes" : "No"}</p>
                  {hasSalary ? (
                    <p>
                      Salary expectations: {String(salaryValue)} {salaryCurrency}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => expressInterest(candidate)}
                  disabled={sent}
                  className="mt-6 w-full rounded-[10px] bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {sent ? "Interest Sent" : "Express Interest"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
