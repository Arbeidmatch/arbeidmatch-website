"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Props = {
  version: string;
  type: "terms" | "privacy";
  summary: string;
  initialEmail: string;
  initialUserType: "candidate" | "employer" | "partner";
};

export default function TermsUpdateClient({ version, type, summary, initialEmail, initialUserType }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [userType, setUserType] = useState<"candidate" | "employer" | "partner">(initialUserType);
  const [showRefusal, setShowRefusal] = useState(false);
  const [refusalFeedback, setRefusalFeedback] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "refused" | "error">("idle");
  const [message, setMessage] = useState("");

  const policyLabel = type === "privacy" ? "Privacy Policy" : "Terms";
  const fullPolicyHref = type === "privacy" ? "/privacy" : "/terms";
  const termsVersion = type === "terms" ? version : "latest";
  const privacyVersion = type === "privacy" ? version : "latest";

  const canSubmit = useMemo(() => email.trim().includes("@"), [email]);

  const submitAccept = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setMessage("");
    const res = await fetch("/api/terms/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: email.trim().toLowerCase(),
        user_type: userType,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
      }),
    });
    if (!res.ok) {
      setStatus("error");
      setMessage("Could not register acceptance right now.");
      return;
    }
    setStatus("success");
    setMessage("Thank you. Your acceptance has been saved.");
  };

  const submitRefuse = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setMessage("");
    const res = await fetch("/api/terms/refuse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: email.trim().toLowerCase(),
        user_type: userType,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        refusal_feedback: refusalFeedback.trim(),
      }),
    });
    if (!res.ok) {
      setStatus("error");
      setMessage("Could not register refusal right now.");
      return;
    }
    setStatus("refused");
    setMessage("Your refusal has been saved. Access will be limited to data deletion only until you accept.");
  };

  return (
    <div className="min-h-dvh bg-[#0D1B2A] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Policy update</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight">We&apos;ve updated our {policyLabel}</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/75">{summary}</p>

        <div className="mt-5">
          <Link href={fullPolicyHref} className="inline-flex text-sm font-semibold text-[#C9A84C] hover:underline">
            Read full {policyLabel}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-white/55">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#0A1624] px-3 py-2.5 text-sm text-white"
              placeholder="name@company.no"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/55">Account type</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as "candidate" | "employer" | "partner")}
              className="w-full rounded-xl border border-white/15 bg-[#0A1624] px-3 py-2.5 text-sm text-white"
            >
              <option value="candidate">Candidate</option>
              <option value="employer">Employer</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void submitAccept()}
            disabled={status === "loading" || !canSubmit}
            className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-xl bg-[#C9A84C] px-5 py-2.5 font-semibold text-[#0D1B2A] disabled:opacity-60"
          >
            I Accept
          </button>
          <button
            type="button"
            onClick={() => setShowRefusal((v) => !v)}
            disabled={status === "loading" || !canSubmit}
            className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            I Do Not Accept
          </button>
        </div>

        {showRefusal ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs text-white/60">
              If you decline, your access will be limited to data deletion only. You can accept at any time.
            </p>
            <textarea
              value={refusalFeedback}
              onChange={(e) => setRefusalFeedback(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-xl border border-white/15 bg-[#0A1624] px-3 py-2.5 text-sm text-white"
              placeholder="Optional feedback"
            />
            <button
              type="button"
              onClick={() => void submitRefuse()}
              disabled={status === "loading" || !canSubmit}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center rounded-xl border border-[#C9A84C]/45 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#C9A84C] disabled:opacity-60"
            >
              Confirm refusal
            </button>
          </div>
        ) : null}

        {message ? (
          <p className={`mt-4 text-sm ${status === "error" ? "text-red-300" : "text-white/75"}`}>{message}</p>
        ) : null}
      </div>
    </div>
  );
}
