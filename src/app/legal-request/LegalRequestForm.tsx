"use client";

import { useState } from "react";

const REQUEST_TYPES = [
  "GDPR Access (Art. 15)",
  "GDPR Rectification (Art. 16)",
  "GDPR Erasure (Art. 17)",
  "GDPR Restriction (Art. 18)",
  "GDPR Portability (Art. 20)",
  "GDPR Objection (Art. 21)",
  "Withdraw consent",
  "Privacy Policy question",
  "DPA inquiry",
  "Other legal matter",
] as const;

const IDENTITY_OPTIONS = [
  "",
  "Reply from registered email",
  "Will provide ID copy on request",
  "Other",
] as const;

export default function LegalRequestForm() {
  const [requestType, setRequestType] = useState<string>(REQUEST_TYPES[0]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [identityMethod, setIdentityMethod] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmed || message.trim().length < 20) {
      setError("Something went wrong. Please try again or email legal@arbeidmatch.no directly.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/legal-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: requestType,
          full_name: fullName.trim(),
          email: email.trim(),
          identity_verification_method: identityMethod || null,
          message: message.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setError("Something went wrong. Please try again or email legal@arbeidmatch.no directly.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again or email legal@arbeidmatch.no directly.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="min-h-[50vh] bg-white text-[#0D1B2A]">
        <div className="mx-auto w-full max-w-[640px] px-6 py-12 md:px-12">
          <p className="text-base leading-relaxed text-[#0D1B2A]/85">
            Your request has been received. You will get a confirmation email shortly. We respond within 30 days as
            required by GDPR Article 12.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[60vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[640px] px-6 py-12 md:px-12">
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Submit a Legal Request</h1>
        <p className="mt-4 text-base leading-relaxed text-[#0D1B2A]/85">
          Use this form to exercise your rights under GDPR (access, rectification, erasure, portability, etc.) or to ask
          any legal or privacy question. We respond within 30 days.
        </p>

        <form className="mt-10 flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="request_type" className="text-[14px] font-medium text-[#0D1B2A]">
              Request type
            </label>
            <select
              id="request_type"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="rounded-[4px] border border-[#0D1B2A]/20 px-3 py-2.5 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="full_name" className="text-[14px] font-medium text-[#0D1B2A]">
              Full name <span className="text-red-600">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-[4px] border border-[#0D1B2A]/20 px-3 py-2.5 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[14px] font-medium text-[#0D1B2A]">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[4px] border border-[#0D1B2A]/20 px-3 py-2.5 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="identity" className="text-[14px] font-medium text-[#0D1B2A]">
              Identity verification method (optional)
            </label>
            <select
              id="identity"
              value={identityMethod}
              onChange={(e) => setIdentityMethod(e.target.value)}
              className="rounded-[4px] border border-[#0D1B2A]/20 px-3 py-2.5 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            >
              <option value="">Select if applicable</option>
              {IDENTITY_OPTIONS.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-[14px] font-medium text-[#0D1B2A]">
              Message <span className="text-red-600">*</span> (min. 20 characters)
            </label>
            <textarea
              id="message"
              name="message"
              required
              minLength={20}
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-[4px] border border-[#0D1B2A]/20 px-3 py-2.5 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-[#0D1B2A]/85">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-[#0D1B2A]/30 text-[#C9A84C] focus:ring-[#C9A84C]"
            />
            <span>
              I confirm that the information I provided is accurate. I understand my submission will be logged and a
              copy of this request will be sent to me by email.
            </span>
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !confirmed}
            className="mt-2 w-fit rounded-[4px] bg-[#C9A84C] px-6 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting" : "Submit"}
          </button>
        </form>
      </div>
    </section>
  );
}
