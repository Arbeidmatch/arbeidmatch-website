"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Props = {
  initialEmail: string;
  token: string;
};

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "msn.com",
]);

function hasFreeDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim() || "";
  return FREE_EMAIL_DOMAINS.has(domain);
}

type PartnershipType = "recruitment" | "staffing" | "both";

export default function BecomePartnerClient({ initialEmail, token }: Props) {
  const hasInviteToken = Boolean(token.trim());
  const [email, setEmail] = useState(initialEmail.trim());

  useEffect(() => {
    setEmail(initialEmail.trim());
  }, [initialEmail]);

  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string; orgNumber: string }>>([]);
  const [companyLookupStatus, setCompanyLookupStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [partnershipType, setPartnershipType] = useState<PartnershipType>("recruitment");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const effectiveEmail = email.trim().toLowerCase();

  const canSubmit = useMemo(() => {
    return (
      effectiveEmail.includes("@") &&
      !hasFreeDomain(effectiveEmail) &&
      companyName.trim().length >= 2 &&
      orgNumber.trim().length >= 2 &&
      contactPerson.trim().length >= 2 &&
      phone.trim().length >= 6 &&
      termsAccepted &&
      gdprConsent &&
      (!hasInviteToken || token.trim().length > 0)
    );
  }, [companyName, contactPerson, effectiveEmail, gdprConsent, hasInviteToken, orgNumber, phone, termsAccepted, token]);

  useEffect(() => {
    if (companyQuery.trim().length < 2) {
      setCompanySuggestions([]);
      setCompanyLookupStatus("idle");
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      setCompanyLookupStatus("loading");
      try {
        const response = await fetch(`/api/brreg/search?q=${encodeURIComponent(companyQuery.trim())}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          success?: boolean;
          companies?: Array<{ name: string; orgNumber: string }>;
        };
        if (!response.ok || !data.success) {
          setCompanyLookupStatus("error");
          setCompanySuggestions([]);
          return;
        }
        setCompanySuggestions(data.companies ?? []);
        setCompanyLookupStatus("idle");
      } catch {
        if (controller.signal.aborted) return;
        setCompanyLookupStatus("error");
        setCompanySuggestions([]);
      }
    };

    const timeout = window.setTimeout(run, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [companyQuery]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("submitting");
    setErrorMessage("");

    try {
      const body: Record<string, unknown> = {
        email: effectiveEmail,
        companyName: companyName.trim(),
        orgNumber: orgNumber.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        partnershipType,
        termsAccepted: true as const,
        gdprConsent: true as const,
      };
      if (hasInviteToken) {
        body.token = token.trim();
      }

      const response = await fetch("/api/partner-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        success?: boolean;
        reason?: string;
        error?: string;
        message?: string;
      };
      if (!response.ok || !data.success) {
        if (data.reason === "personal_email") {
          setErrorMessage("Please use your company email address.");
        } else if (data.error === "already_partner") {
          setErrorMessage("This company email is already registered as a verified partner.");
        } else if (response.status === 403) {
          setErrorMessage("This application link is invalid or the email does not match the invitation.");
        } else if (response.status === 503 && data.error === "signing_unavailable") {
          setErrorMessage(
            data.message ||
              "Electronic signing is not configured on the server. Please contact ArbeidMatch to complete onboarding.",
          );
        } else {
          setErrorMessage(data.message || "Could not start onboarding right now. Please try again.");
        }
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Could not start onboarding right now. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-6 py-20 text-white">
        <div className="mx-auto max-w-[560px] rounded-[16px] border border-[rgba(201,168,76,0.2)] border-t-2 border-t-[rgba(201,168,76,0.45)] bg-[rgba(255,255,255,0.03)] p-8 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
            <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-4 text-[24px] font-bold text-white">Next step: sign in DocuSign</p>
          <p className="mt-3 text-[15px] leading-[1.7] text-[rgba(255,255,255,0.6)]">
            We sent the partnership agreement to <span className="font-semibold text-white">{effectiveEmail}</span>. Open
            the DocuSign email, review the document, and sign electronically. After signing, your partner status becomes
            verified and you will receive a confirmation email.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-dvh bg-[#0D1B2A] px-6 py-20 text-white">
      <div className="mx-auto max-w-[620px] rounded-[18px] border border-[rgba(201,168,76,0.2)] border-t-2 border-t-[rgba(201,168,76,0.45)] bg-[rgba(255,255,255,0.03)] p-8">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.45)]">Partner onboarding</p>
        <h1 className="mt-2 text-[30px] font-bold text-white">Become an ArbeidMatch partner</h1>
        <p className="mt-2 text-[14px] text-[rgba(255,255,255,0.58)]">
          Complete the form and sign the partnership agreement electronically (DocuSign). Use your company email address.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Company email</label>
            <input
              type="email"
              readOnly={hasInviteToken}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@your-company.no"
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] read-only:text-[rgba(255,255,255,0.7)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
            />
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Company name</label>
            <input
              type="text"
              value={companyQuery}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 120);
              }}
              onChange={(event) => {
                setCompanyQuery(event.target.value);
                setCompanyName(event.target.value);
                setOrgNumber("");
                setShowSuggestions(true);
              }}
              placeholder="Search company in Bronnoysund register..."
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
            />
            {showSuggestions && companySuggestions.length > 0 ? (
              <div className="absolute z-20 mt-1 w-full rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[#102033] p-1">
                {companySuggestions.map((company) => (
                  <button
                    key={`${company.orgNumber}-${company.name}`}
                    type="button"
                    onMouseDown={() => {
                      setCompanyName(company.name);
                      setOrgNumber(company.orgNumber);
                      setCompanyQuery(company.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full rounded-[8px] px-3 py-2 text-left transition-colors hover:bg-[rgba(201,168,76,0.1)]"
                  >
                    <p className="text-[13px] font-semibold text-white">{company.name}</p>
                    <p className="text-[12px] text-[rgba(255,255,255,0.55)]">Org: {company.orgNumber}</p>
                  </button>
                ))}
              </div>
            ) : null}
            {companyLookupStatus === "loading" ? (
              <p className="mt-1 text-[12px] text-[rgba(255,255,255,0.45)]">Searching register...</p>
            ) : null}
            {companyLookupStatus === "error" ? (
              <p className="mt-1 text-[12px] text-[rgba(255,255,255,0.45)]">Could not load register results. Please try again.</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Organisation number</label>
            <input
              type="text"
              value={orgNumber}
              readOnly
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-[rgba(255,255,255,0.7)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Contact person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(event) => setContactPerson(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-[12px] text-[rgba(255,255,255,0.45)]">Type of partnership</legend>
            <div className="space-y-2 rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-3">
              {(
                [
                  { value: "recruitment" as const, label: "Recruitment" },
                  { value: "staffing" as const, label: "Staffing" },
                  { value: "both" as const, label: "Both" },
                ] as const
              ).map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-3 text-[14px] text-white/85">
                  <input
                    type="radio"
                    name="partnershipType"
                    checked={partnershipType === opt.value}
                    onChange={() => setPartnershipType(opt.value)}
                    className="h-4 w-4 accent-[#C9A84C]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-3 rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[13px] text-[rgba(255,255,255,0.65)]">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C9A84C]"
            />
            <span>
              I have read and agree to the{" "}
              <Link href="/terms" className="text-[#C9A84C] underline">
                terms of use
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[13px] text-[rgba(255,255,255,0.65)]">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(event) => setGdprConsent(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C9A84C]"
            />
            <span>
              I consent to ArbeidMatch processing this company data according to the{" "}
              <Link href="/privacy" className="text-[#C9A84C] underline">
                privacy policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || status === "submitting"}
            className="w-full rounded-[10px] bg-[#C9A84C] px-4 py-[13px] text-[15px] font-bold text-[#0D1B2A] disabled:opacity-60"
          >
            {status === "submitting" ? "Starting…" : "Continue to electronic signing"}
          </button>

          {errorMessage ? <p className="text-center text-[13px] text-red-300">{errorMessage}</p> : null}
        </form>
      </div>
    </section>
  );
}
