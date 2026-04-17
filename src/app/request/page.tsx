"use client";

import { FormEvent, useEffect, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

type CompanyResult = {
  name: string;
  orgNumber: string;
};

export default function RequestPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [companyQuery, setCompanyQuery] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [partnershipStatus, setPartnershipStatus] = useState<"existing" | "new" | "">("");
  const [engagementModel, setEngagementModel] = useState("Occasional candidate requests");
  const [engagementDetails, setEngagementDetails] = useState("");
  const [howDidYouHear, setHowDidYouHear] = useState("Referral from another company");
  const [socialMediaPlatform, setSocialMediaPlatform] = useState("Facebook");
  const [socialMediaOther, setSocialMediaOther] = useState("");
  const [howDidYouHearOther, setHowDidYouHearOther] = useState("");
  const [referralCompanyName, setReferralCompanyName] = useState("");
  const [referralOrgNumber, setReferralOrgNumber] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [referralCompanyResults, setReferralCompanyResults] = useState<CompanyResult[]>([]);
  const [isSearchingReferralCompanies, setIsSearchingReferralCompanies] = useState(false);
  const [hasSearchedReferral, setHasSearchedReferral] = useState(false);
  const [companyResults, setCompanyResults] = useState<CompanyResult[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>;
    const requestedLocation = payload.requested_location?.trim();

    if (!partnershipStatus) {
      setStatus("error");
      return;
    }

    payload.partnershipStatus = partnershipStatus;

    if (requestedLocation) {
      payload.job_summary = `${payload.job_summary?.trim()}\nLocation needed: ${requestedLocation}`;
    }

    if (partnershipStatus === "new") {
      try {
        const response = await fetch("/api/send-partnership-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            engagementModel,
            engagementDetails,
            requestedLocation,
          }),
        });

        if (!response.ok) throw new Error("Partnership request failed");
        setStatus("success");
      } catch {
        setStatus("error");
      }
      return;
    }

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

  useEffect(() => {
    if (howDidYouHear !== "Referral from another company") {
      setReferralCompanyResults([]);
      setHasSearchedReferral(false);
      return;
    }

    if (referralCompanyName.trim().length < 2) {
      setReferralCompanyResults([]);
      setHasSearchedReferral(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingReferralCompanies(true);
        const response = await fetch(
          `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(
            referralCompanyName,
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
        setReferralCompanyResults(results);
      } catch {
        setReferralCompanyResults([]);
      } finally {
        setHasSearchedReferral(true);
        setIsSearchingReferralCompanies(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [howDidYouHear, referralCompanyName]);

  const onReferralCompanyPick = (item: CompanyResult) => {
    setReferralCompanyName(item.name);
    setReferralOrgNumber(item.orgNumber);
    setReferralCompanyResults([]);
    setHasSearchedReferral(false);
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
          <a href="/score" className="font-semibold text-gold">
            Start with eligibility check →
          </a>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-4 max-w-md space-y-4 rounded-xl border border-border bg-white p-6">
          <fieldset className="space-y-2 rounded-md border border-border p-3">
            <legend className="px-1 text-sm font-medium text-navy">
              Quick question: Are you already partnering with ArbeidMatch?
            </legend>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="radio"
                name="partnershipStatus"
                checked={partnershipStatus === "existing"}
                onChange={() => setPartnershipStatus("existing")}
                required
              />
              Yes, we are already a partner
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="radio"
                name="partnershipStatus"
                checked={partnershipStatus === "new"}
                onChange={() => setPartnershipStatus("new")}
                required
              />
              No, we are a new company
            </label>
          </fieldset>

          {!partnershipStatus && (
            <div className="rounded-md border border-border bg-surface p-3 text-sm text-text-secondary">
              Please choose your partnership status to continue.
            </div>
          )}

          {partnershipStatus && (
            <>
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
                    No company found. You can still continue.
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
            <span className="mb-1 block text-sm font-medium text-navy">Where do you need candidates?*</span>
            <input
              required
              name="requested_location"
              className={inputClass}
              placeholder="E.g. Oslo, Trondheim, Stavanger"
            />
          </label>

          {partnershipStatus === "new" && (
            <div className="space-y-3 rounded-md border border-border bg-surface p-3">
              <p className="text-sm font-medium text-navy">What type of collaboration are you looking for?</p>
              {[
                "Occasional candidate requests",
                "Volume-based engagement",
                "Quality-focused engagement",
              ].map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="radio"
                    name="engagementModel"
                    checked={engagementModel === option}
                    onChange={() => setEngagementModel(option)}
                  />
                  {option}
                </label>
              ))}
              <label className="block text-sm text-navy">
                Tell us what you need
                <textarea
                  name="engagementDetails"
                  rows={3}
                  className={`${inputClass} mt-1`}
                  value={engagementDetails}
                  onChange={(event) => setEngagementDetails(event.target.value)}
                  placeholder="Describe your hiring needs, timeline, and expected collaboration format"
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">How did you hear about us?</span>
            <select
              name="howDidYouHear"
              className={inputClass}
              value={howDidYouHear}
              onChange={(event) => {
                setHowDidYouHear(event.target.value);
                setSocialMediaOther("");
                setHowDidYouHearOther("");
                if (event.target.value !== "Referral from another company") {
                  setReferralCompanyName("");
                  setReferralOrgNumber("");
                  setReferralEmail("");
                }
              }}
            >
              {[
                "Referral from another company",
                "Referral from a friend",
                "Google search",
                "Social media",
                "Other",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {howDidYouHear === "Social media" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Social media platform</span>
              <select
                name="socialMediaPlatform"
                className={inputClass}
                value={socialMediaPlatform}
                onChange={(event) => {
                  setSocialMediaPlatform(event.target.value);
                  setSocialMediaOther("");
                }}
              >
                {[
                  "Facebook",
                  "Instagram",
                  "LinkedIn",
                  "TikTok",
                  "YouTube",
                  "Twitter/X",
                  "Snapchat",
                  "Pinterest",
                  "Reddit",
                  "WhatsApp",
                  "Other",
                ].map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
          )}

          {howDidYouHear === "Social media" && socialMediaPlatform === "Other" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Other social media platform</span>
              <input
                name="socialMediaOther"
                className={inputClass}
                value={socialMediaOther}
                onChange={(event) => setSocialMediaOther(event.target.value)}
                required
              />
            </label>
          )}

          {howDidYouHear === "Other" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Please specify</span>
              <input
                name="howDidYouHearOther"
                className={inputClass}
                value={howDidYouHearOther}
                onChange={(event) => setHowDidYouHearOther(event.target.value)}
                required
              />
            </label>
          )}

          {howDidYouHear === "Referral from another company" && (
            <>
              <label className="relative block">
                <span className="mb-1 block text-sm font-medium text-navy">Referring company</span>
                <input
                  name="referralCompanyName"
                  className={inputClass}
                  value={referralCompanyName}
                  onChange={(event) => {
                    setReferralCompanyName(event.target.value);
                    setReferralOrgNumber("");
                  }}
                  autoComplete="off"
                  required
                />
                <input type="hidden" name="referralOrgNumber" value={referralOrgNumber} />
                {(isSearchingReferralCompanies ||
                  referralCompanyResults.length > 0 ||
                  (hasSearchedReferral && referralCompanyName.trim().length >= 2)) && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-[0_8px_24px_rgba(13,27,42,0.12)]">
                    {isSearchingReferralCompanies && (
                      <p className="px-3 py-2 text-sm text-text-secondary">Searching...</p>
                    )}
                    {!isSearchingReferralCompanies &&
                      referralCompanyResults.map((item) => (
                        <button
                          key={`${item.orgNumber}-${item.name}-referral`}
                          type="button"
                          onClick={() => onReferralCompanyPick(item)}
                          className="block w-full border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-gold/10"
                        >
                          <span className="block text-sm font-medium text-navy">{item.name}</span>
                          <span className="block text-xs text-gold">Org.nr. {item.orgNumber}</span>
                        </button>
                      ))}
                    {!isSearchingReferralCompanies &&
                      hasSearchedReferral &&
                      referralCompanyResults.length === 0 && (
                        <p className="px-3 py-2 text-sm text-text-secondary">
                          No company found. You can still continue.
                        </p>
                      )}
                  </div>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">
                  Contact email at referring company (optional)
                </span>
                <input
                  name="referralEmail"
                  type="email"
                  className={inputClass}
                  value={referralEmail}
                  onChange={(event) => setReferralEmail(event.target.value)}
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-md bg-gold py-4 text-lg font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting"
              ? "Please wait..."
              : partnershipStatus === "new"
                ? "Send request →"
                : "Continue →"}
          </button>

          {status === "success" && partnershipStatus === "new" && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
              Request sent successfully. You will receive an offer for your request as soon as possible.
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              Something went wrong. Please email post@arbeidmatch.no
            </div>
          )}
            </>
          )}
        </form>
      </div>
    </section>
  );
}
