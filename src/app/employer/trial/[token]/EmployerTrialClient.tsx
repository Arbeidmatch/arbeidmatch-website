"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, Handshake } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type AccessLevel = "see_available" | "connect_hire";
type Step = 1 | 2 | 3 | 4;
type TrialStatus = "loading" | "ready" | "error" | "submitted";

type Props = {
  token: string;
};

type CompanySuggestion = { name: string; orgNumber: string };

const CATEGORY_OPTIONS = [
  "Construction",
  "Electrical",
  "Logistics",
  "Industry",
  "Cleaning",
  "Hospitality",
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 420 : -420,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 28 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -420 : 420,
    opacity: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 28 },
  }),
};

export default function EmployerTrialClient({ token }: Props) {
  const [status, setStatus] = useState<TrialStatus>("loading");
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState<Step>(1);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [registryQuery, setRegistryQuery] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState<CompanySuggestion[]>([]);
  const [searchingCompany, setSearchingCompany] = useState(false);

  const [category, setCategory] = useState("");
  const [checkingCandidates, setCheckingCandidates] = useState(false);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);

  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applicationKind, setApplicationKind] = useState<"employer_trial" | "partner_application">("employer_trial");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/employer/trial/token/${encodeURIComponent(token)}`);
        const data = (await response.json()) as {
          success?: boolean;
          data?: { email?: string; applicationKind?: "employer_trial" | "partner_application" };
        };
        if (!response.ok || !data.success) {
          setStatus("error");
          return;
        }
        const tokenEmail = data.data?.email?.trim().toLowerCase() || "";
        setEmail(tokenEmail);
        if (data.data?.applicationKind === "partner_application") {
          setApplicationKind("partner_application");
        }
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [token]);

  useEffect(() => {
    const q = registryQuery.trim();
    if (step !== 1 || q.length < 2) {
      setCompanySuggestions([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void (async () => {
        setSearchingCompany(true);
        try {
          const res = await fetch(`/api/brreg/search?q=${encodeURIComponent(q)}`);
          const data = (await res.json()) as { companies?: CompanySuggestion[] };
          setCompanySuggestions(data.companies ?? []);
        } catch {
          setCompanySuggestions([]);
        } finally {
          setSearchingCompany(false);
        }
      })();
    }, 320);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [registryQuery, step]);

  const canContinueStep1 = useMemo(() => companyName.trim().length > 1 && contactName.trim().length > 1 && email.includes("@"), [companyName, contactName, email]);
  const canContinueStep2 = useMemo(() => category.trim().length > 0, [category]);
  const canContinueStep3 = useMemo(() => candidateCount !== null, [candidateCount]);
  const canSubmit = useMemo(() => accessLevel !== null && !submitting, [accessLevel, submitting]);

  const goToStep = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const checkCandidates = async () => {
    if (!category) return;
    setCheckingCandidates(true);
    setError("");
    try {
      const res = await fetch("/api/check-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = (await res.json()) as { count?: number };
      setCandidateCount(Number(data.count ?? 0));
    } catch {
      setCandidateCount(0);
    } finally {
      setCheckingCandidates(false);
    }
  };

  const submitRequest = async () => {
    if (!accessLevel) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/employer/trial/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          company: {
            company_name: companyName.trim(),
            contact_name: contactName.trim(),
            email: email.trim().toLowerCase(),
          },
          category,
          access_level: accessLevel,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error || "Could not submit request right now.");
        return;
      }
      setStatus("submitted");
    } catch {
      setError("Could not submit request right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return <main className="min-h-screen bg-[#0D1B2A] px-6 py-14 text-white">Loading secure access...</main>;
  }
  if (status === "error") {
    return (
      <main className="min-h-screen bg-[#0D1B2A] px-6 py-14 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-bold">Invalid or expired access link</h1>
          <p className="mt-3 text-sm text-white/70">Please request a new secure link to continue.</p>
          <Link href="/become-a-partner" className="mt-5 inline-flex rounded-xl bg-[#C9A84C] px-5 py-3 font-semibold text-[#0D1B2A]">
            Request new link
          </Link>
        </div>
      </main>
    );
  }
  if (status === "submitted") {
    const partnerCopy = applicationKind === "partner_application";
    return (
      <main className="min-h-screen bg-[#0D1B2A] px-6 py-14 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#C9A84C]/30 bg-white/[0.03] p-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]"
          >
            <Check className="h-7 w-7" />
          </motion.div>
          <p className="mt-5 text-2xl font-bold">
            {partnerCopy
              ? "Your application is under review. We'll be in touch within 48 hours."
              : "Request received. We'll be in touch within 48 hours."}
          </p>
          <p className="mt-2 text-sm text-white/70">
            {partnerCopy ? "Thank you for applying to partner with ArbeidMatch." : "We appreciate you choosing ArbeidMatch."}
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A]">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-4 py-10 text-white md:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#C9A84C]/20 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">
          {applicationKind === "partner_application" ? "Partner application" : "Employer Trial Flow"}
        </p>
        <p className="mt-2 text-sm text-white/60">{`Step ${step} of 4`}</p>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="mt-5">
            {step === 1 && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">Company details</h1>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Search Brønnøysund (company name)</label>
                  <input
                    value={registryQuery}
                    onChange={(e) => setRegistryQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0A1624] px-4 py-3"
                    placeholder="Type at least 2 characters"
                  />
                  {searchingCompany ? <p className="mt-1 text-xs text-white/50">Searching...</p> : null}
                </div>
                {companySuggestions.length > 0 ? (
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    {companySuggestions.map((item) => (
                      <button
                        key={`${item.orgNumber}-${item.name}`}
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
                        onClick={() => {
                          setCompanyName(item.name);
                          setRegistryQuery(item.name);
                        }}
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-white/55">{item.orgNumber}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div>
                  <label className="mb-1 block text-sm text-white/70">Company name</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A1624] px-4 py-3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Contact name</label>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A1624] px-4 py-3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0A1624] px-4 py-3" />
                </div>
                <button type="button" disabled={!canContinueStep1} onClick={() => goToStep(2)} className="rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60">
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">What are you looking for?</h1>
                <div className="grid gap-3 md:grid-cols-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCategory(option)}
                      className={`rounded-xl border p-4 text-left transition ${
                        category === option ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => goToStep(1)} className="rounded-xl border border-white/20 px-5 py-3 text-white/80">
                    Back
                  </button>
                  <button type="button" disabled={!canContinueStep2} onClick={() => goToStep(3)} className="rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">Candidate Overview</h1>
                <button type="button" onClick={() => void checkCandidates()} disabled={checkingCandidates} className="rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60">
                  {checkingCandidates ? "Checking..." : "Check availability"}
                </button>
                {candidateCount !== null ? (
                  <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-6 text-center">
                    <p className="text-sm text-white/70">{`We have ${candidateCount} verified EU/EEA candidates available for ${category}`}</p>
                    <p className="mt-3 text-5xl font-extrabold text-[#C9A84C]">{candidateCount}</p>
                    {candidateCount === 0 ? (
                      <p className="mt-3 text-sm text-white/75">No candidates currently available. We'll notify you when profiles match your criteria.</p>
                    ) : null}
                    {candidateCount > 0 && candidateCount < 5 ? (
                      <div className="mt-3 inline-flex items-center rounded-full border border-[#C9A84C]/45 bg-[#C9A84C]/15 px-3 py-1 text-xs text-[#C9A84C]">
                        Rare Profile
                      </div>
                    ) : null}
                    {candidateCount > 0 && candidateCount < 5 ? (
                      <p className="mt-2 text-xs text-white/60">This category has limited active profiles right now. We monitor daily and update continuously.</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <button type="button" onClick={() => goToStep(2)} className="rounded-xl border border-white/20 px-5 py-3 text-white/80">
                    Back
                  </button>
                  <button type="button" disabled={!canContinueStep3} onClick={() => goToStep(4)} className="rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">Choose access level</h1>
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAccessLevel("see_available")}
                    className={`rounded-2xl border p-5 text-left ${accessLevel === "see_available" ? "border-[#C9A84C]" : "border-white/10"}`}
                  >
                    <Eye className="h-6 w-6 text-[#C9A84C]" />
                    <p className="mt-3 text-lg font-bold">See Who&apos;s Available</p>
                    <p className="mt-2 text-sm text-white/70">Receive an anonymised candidate presentation. See skills, experience and availability - no contact details.</p>
                    <span className="mt-3 inline-flex rounded-full border border-white/20 px-2 py-1 text-xs text-white/75">Free Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessLevel("connect_hire")}
                    className={`rounded-2xl border p-5 text-left ${accessLevel === "connect_hire" ? "border-[#C9A84C]/70" : "border-[#C9A84C]/40"}`}
                  >
                    <Handshake className="h-6 w-6 text-[#C9A84C]" />
                    <p className="mt-3 text-lg font-bold">Connect &amp; Hire</p>
                    <p className="mt-2 text-sm text-white/70">Get full candidate profiles with contact details. Available exclusively to signed ArbeidMatch partners.</p>
                    <span className="mt-3 inline-flex rounded-full bg-[#C9A84C] px-2 py-1 text-xs font-semibold text-[#0D1B2A]">Partner Access</span>
                  </button>
                </div>
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                <div className="flex gap-3">
                  <button type="button" onClick={() => goToStep(3)} className="rounded-xl border border-white/20 px-5 py-3 text-white/80">
                    Back
                  </button>
                  <button type="button" disabled={!canSubmit} onClick={() => void submitRequest()} className="rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60">
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

