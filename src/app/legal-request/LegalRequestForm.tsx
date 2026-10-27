"use client";

import { useState } from "react";

import type { LegalLanguage } from "@/lib/legalPageLanguage";
import { LEGAL_REQUEST_WORDS } from "@/lib/legalRequestWords";

const FIELD =
  "rounded-[4px] border border-[#0D1B2A]/20 px-3 py-2.5 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]";
const SELECT = `select-light ${FIELD} bg-white`;

export default function LegalRequestForm({ language }: { language: LegalLanguage }) {
  const w = LEGAL_REQUEST_WORDS[language];
  const [requestType, setRequestType] = useState<string>(w.requestTypes[0].value);
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
      setError(w.error);
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
        setError(w.error);
        return;
      }
      setDone(true);
    } catch {
      setError(w.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="text-base leading-relaxed text-[#0D1B2A]/85" role="status">
        {w.done}
      </p>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-[#0D1B2A]">{w.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-[#0D1B2A]/85">{w.intro}</p>

      <form className="mt-10 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="request_type" className="text-[14px] font-medium text-[#0D1B2A]">
            {w.requestType}
          </label>
          <select id="request_type" value={requestType} onChange={(e) => setRequestType(e.target.value)} className={SELECT}>
            {w.requestTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="full_name" className="text-[14px] font-medium text-[#0D1B2A]">
            {w.fullName} <span className="text-red-600">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[14px] font-medium text-[#0D1B2A]">
            {w.email} <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="identity" className="text-[14px] font-medium text-[#0D1B2A]">
            {w.identity}
          </label>
          <select id="identity" value={identityMethod} onChange={(e) => setIdentityMethod(e.target.value)} className={SELECT}>
            <option value="">{w.identityPlaceholder}</option>
            {w.identityMethods.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-[14px] font-medium text-[#0D1B2A]">
            {w.message} <span className="text-red-600">*</span> {w.messageHint}
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={20}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={FIELD}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-[#0D1B2A]/85">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[#0D1B2A]/30 text-[#C9A84C] focus:ring-[#C9A84C]"
          />
          <span>{w.confirm}</span>
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || !confirmed}
          className="mt-2 w-fit rounded-[4px] bg-[#C9A84C] px-6 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? w.submitting : w.submit}
        </button>
      </form>
    </>
  );
}
