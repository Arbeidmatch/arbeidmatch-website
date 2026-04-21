"use client";

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

export default function BecomePartnerClient({ initialEmail, token }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string; orgNumber: string }>>([]);
  const [companyLookupStatus, setCompanyLookupStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phone, setPhone] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      initialEmail.includes("@") &&
      !hasFreeDomain(initialEmail) &&
      token.length > 0 &&
      firstName.trim().length >= 1 &&
      lastName.trim().length >= 1 &&
      role.trim().length >= 2 &&
      companyName.trim().length >= 2 &&
      orgNumber.trim().length >= 9 &&
      phone.trim().length >= 6 &&
      gdprConsent
    );
  }, [companyName, firstName, gdprConsent, initialEmail, lastName, orgNumber, phone, role, token.length]);

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
      const response = await fetch("/api/partner-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: initialEmail,
          companyName: companyName.trim(),
          orgNumber: orgNumber.trim(),
          phone: phone.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: role.trim(),
          gdprConsent,
          token,
        }),
      });
      const data = (await response.json()) as { success?: boolean; reason?: string };
      if (!response.ok || !data.success) {
        if (data.reason === "personal_email") {
          setErrorMessage("Please use your company email address.");
        } else {
          setErrorMessage("Could not submit application right now. Please try again.");
        }
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Could not submit application right now. Please try again.");
      setStatus("error");
    }
  };

  if (!initialEmail || !token) {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-6 py-20 text-white">
        <div className="mx-auto max-w-[560px] rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-8 text-center">
          <p className="text-[20px] font-bold text-white">Invalid application link</p>
          <p className="mt-3 text-[14px] text-[rgba(255,255,255,0.6)]">Request a new partner application link from the request page.</p>
        </div>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-6 py-20 text-white">
        <div className="mx-auto max-w-[560px] rounded-[16px] border border-[rgba(201,168,76,0.2)] border-t-2 border-t-[rgba(201,168,76,0.45)] bg-[rgba(255,255,255,0.03)] p-8 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
            <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-4 text-[24px] font-bold text-white">Application received.</p>
          <p className="mt-3 text-[15px] leading-[1.7] text-[rgba(255,255,255,0.6)]">
            We will review it and notify you when your access is ready.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-dvh bg-[#0D1B2A] px-6 py-20 text-white">
      <div className="mx-auto max-w-[620px] rounded-[18px] border border-[rgba(201,168,76,0.2)] border-t-2 border-t-[rgba(201,168,76,0.45)] bg-[rgba(255,255,255,0.03)] p-8">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.45)]">Partner application</p>
        <h1 className="mt-2 text-[30px] font-bold text-white">Complete your company details</h1>
        <p className="mt-2 text-[14px] text-[rgba(255,255,255,0.58)]">This application is used for partner approval and secure platform access.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Company email</label>
            <input
              type="email"
              readOnly
              value={initialEmail}
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-[rgba(255,255,255,0.7)]"
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
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Org number</label>
            <input
              type="text"
              value={orgNumber}
              readOnly
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-[rgba(255,255,255,0.7)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[rgba(255,255,255,0.45)]">Role in company</label>
            <input
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
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

          <label className="flex items-start gap-3 rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[13px] text-[rgba(255,255,255,0.65)]">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(event) => setGdprConsent(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C9A84C]"
            />
            <span>
              I consent to ArbeidMatch processing this company data according to the <a href="/privacy" className="text-[#C9A84C] underline">privacy policy</a>.
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || status === "submitting"}
            className="w-full rounded-[10px] bg-[#C9A84C] px-4 py-[13px] text-[15px] font-bold text-[#0D1B2A] disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting..." : "Submit application"}
          </button>

          {errorMessage ? <p className="text-center text-[13px] text-red-300">{errorMessage}</p> : null}
        </form>
      </div>
    </section>
  );
}
