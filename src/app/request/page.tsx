"use client";

import { FormEvent, useEffect, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

type CompanyResult = {
  name: string;
  orgNumber: string;
};

export default function RequestPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [companyQuery, setCompanyQuery] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/simple-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();

      if (data.success && data.token) {
        window.location.href = `/request/${data.token}`;
      } else {
        throw new Error("No token received");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (companyQuery.trim().length < 2) {
      setCompanyResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingCompanies(true);
        const response = await fetch(
          `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(
            companyQuery,
          )}&size=10`,
        );
        const data = (await response.json()) as {
          _embedded?: { enheter?: Array<{ navn?: string; organisasjonsnummer?: string }> };
        };
        const results =
          data._embedded?.enheter?.map((item) => ({
            name: item.navn ?? "",
            orgNumber: item.organisasjonsnummer ?? "",
          })) ?? [];
        setCompanyResults(results);
      } catch {
        setCompanyResults([]);
      } finally {
        setHasSearched(true);
        setIsSearchingCompanies(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [companyQuery]);

  const onCompanyPick = (item: CompanyResult) => {
    setCompanyQuery(item.name);
    setOrgNumber(item.orgNumber);
    setCompanyResults([]);
    setHasSearched(false);
  };

  return (
    <section className="bg-surface py-10">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-navy">Request Candidates</h1>
        <p className="mt-3 text-text-secondary">
          For Norwegian employers only. Fill in your details and we&apos;ll get you started.
        </p>

        <div className="mx-auto mt-8 max-w-md rounded-r-md border-l-4 border-gold bg-gold/10 p-3 text-sm text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-4 max-w-md space-y-4 rounded-xl border border-border bg-white p-6">
          <label className="relative block">
            <span className="mb-1 block text-sm font-medium text-navy">Company name*</span>
            <input
              required
              name="company"
              className={inputClass}
              placeholder="Hansen AS"
              value={companyQuery}
              onChange={(event) => {
                setCompanyQuery(event.target.value);
                setOrgNumber("");
              }}
              autoComplete="off"
            />
            <input type="hidden" name="orgNumber" value={orgNumber} />
            {(isSearchingCompanies || companyResults.length > 0 || (hasSearched && companyQuery.trim().length >= 2)) && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-[0_8px_24px_rgba(13,27,42,0.12)]">
                {isSearchingCompanies && (
                  <p className="px-3 py-2 text-sm text-text-secondary">Searching...</p>
                )}
                {!isSearchingCompanies &&
                  companyResults.map((item) => (
                    <button
                      key={`${item.orgNumber}-${item.name}`}
                      type="button"
                      onClick={() => onCompanyPick(item)}
                      className="block w-full border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-gold/10"
                    >
                      <span className="block text-sm font-medium text-navy">{item.name}</span>
                      <span className="block text-xs text-gold">Org.nr. {item.orgNumber}</span>
                    </button>
                  ))}
                {!isSearchingCompanies && hasSearched && companyResults.length === 0 && (
                  <p className="px-3 py-2 text-sm text-text-secondary">
                    No company found — you can still continue
                  </p>
                )}
              </div>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Company email*</span>
            <input
              required
              name="email"
              type="email"
              className={inputClass}
              placeholder="post@company.no"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">
              What kind of candidate are you looking for?*
            </span>
            <textarea
              required
              name="job_summary"
              rows={2}
              className={inputClass}
              placeholder="E.g. 2 experienced carpenters for a construction project in Oslo, starting ASAP"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">How did you hear about us?</span>
            <select name="howDidYouHear" className={inputClass}>
              {[
                "Google search",
                "LinkedIn",
                "Referral from someone",
                "Facebook/Instagram",
                "Other",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-md bg-gold py-4 text-lg font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? "Please wait..." : "Continue →"}
          </button>

          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              Something went wrong. Please email post@arbeidmatch.no
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
