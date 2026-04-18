"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const PREMIUM_EASE = [0.16, 1, 0.3, 1] as const;

function useIsMobileWidth(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
}

type CompanyResult = {
  name: string;
  orgNumber: string;
};

const fieldContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const fieldItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: PREMIUM_EASE },
  },
};

export default function RequestPage() {
  const reduce = useReducedMotion();
  const isMobile = useIsMobileWidth();
  const d = (sec: number) => (reduce ? 0 : isMobile ? sec * 0.7 : sec);
  const dur = (sec: number) => (reduce ? 0.01 : isMobile ? sec * 0.7 : sec);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [drawSuccessCheck, setDrawSuccessCheck] = useState(false);
  const [cardError, setCardError] = useState("");
  const [errorShakeKey, setErrorShakeKey] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [companyQuery, setCompanyQuery] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [partnershipStatus, setPartnershipStatus] = useState<"existing" | "new" | "">("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [engagementModel, setEngagementModel] = useState("Occasional candidate requests");
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

  const maxCard = partnershipStatus === "new" ? 3 : 1;
  const progress = ((currentCard + 1) / (maxCard + 1)) * 100;
  const isAutoAdvanceCard = currentCard === 0 || (partnershipStatus === "new" && currentCard === 2);

  const inputClass = "request-premium-input input-premium";

  const selectedOptionBadge = (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
      <span role="img" aria-label="Selected">
        ✓
      </span>
    </span>
  );

  const optionButtonClass = (isSelected: boolean) =>
    `request-option-btn ${isSelected ? "request-option-btn-selected request-option-btn-pulse" : ""}`;

  useEffect(() => {
    if (status !== "success") {
      setDrawSuccessCheck(false);
      return;
    }
    const t = window.requestAnimationFrame(() => setDrawSuccessCheck(true));
    return () => window.cancelAnimationFrame(t);
  }, [status]);

  const validateLeadSource = () => {
    if (howDidYouHear === "Social media" && socialMediaPlatform === "Other" && !socialMediaOther.trim()) {
      return false;
    }
    if (howDidYouHear === "Other" && !howDidYouHearOther.trim()) {
      return false;
    }
    if (howDidYouHear === "Referral from another company" && !referralCompanyName.trim()) {
      return false;
    }
    return true;
  };

  const validateCurrentCard = () => {
    if (currentCard === 0) {
      return Boolean(partnershipStatus);
    }
    if (currentCard === 1) {
      return (
        companyQuery.trim().length > 1 &&
        companyEmail.trim().length > 3 &&
        companyEmail.includes("@") &&
        contactName.trim().length > 2 &&
        contactRole.trim().length > 1 &&
        contactPhone.trim().length > 5
      );
    }
    if (partnershipStatus === "new" && currentCard === 2) {
      return Boolean(engagementModel);
    }
    return validateLeadSource();
  };

  const bumpError = (message: string) => {
    setCardError(message);
    setErrorShakeKey((k) => k + 1);
  };

  const nextCard = () => {
    if (!validateCurrentCard()) {
      bumpError("Please complete the required fields in this card before continuing.");
      return;
    }
    setCardError("");
    if (currentCard < maxCard) setCurrentCard((prev) => prev + 1);
  };

  const prevCard = () => {
    setCardError("");
    if (currentCard > 0) setCurrentCard((prev) => prev - 1);
  };
  const goToNextCard = () => {
    setCardError("");
    if (currentCard < maxCard) setCurrentCard((prev) => prev + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCurrentCard()) {
      bumpError("Please complete the required fields in this card before sending.");
      return;
    }

    setCardError("");
    setStatus("submitting");

    if (!partnershipStatus) {
      setStatus("error");
      return;
    }

    const payload: Record<string, string> = {
      company: companyQuery,
      orgNumber,
      email: companyEmail,
      full_name: contactName,
      contactRole,
      phone: contactPhone,
      job_summary: "",
      requested_location: "",
      partnershipStatus,
      howDidYouHear,
      socialMediaPlatform: howDidYouHear === "Social media" ? socialMediaPlatform : "",
      socialMediaOther:
        howDidYouHear === "Social media" && socialMediaPlatform === "Other" ? socialMediaOther : "",
      howDidYouHearOther: howDidYouHear === "Other" ? howDidYouHearOther : "",
      referralCompanyName:
        howDidYouHear === "Referral from another company" ? referralCompanyName : "",
      referralOrgNumber:
        howDidYouHear === "Referral from another company" ? referralOrgNumber : "",
      referralEmail: howDidYouHear === "Referral from another company" ? referralEmail : "",
    };

    try {
      const response = await fetch("/api/simple-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          requestedLocation: "",
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      const data = (await response.json()) as { success?: boolean; token?: string };
      if (data.success && data.token) {
        setStatus("success");
        window.setTimeout(() => {
          window.location.href = `/request/${data.token}`;
        }, 700);
        return;
      }
      throw new Error("No token received");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (orgNumber.trim()) {
      setCompanyResults([]);
      setHasSearched(false);
      return;
    }

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
  }, [companyQuery, orgNumber]);

  const onCompanyPick = (item: CompanyResult) => {
    setCompanyQuery(item.name);
    setOrgNumber(item.orgNumber);
    setCompanyResults([]);
    setHasSearched(false);
  };

  useEffect(() => {
    if (referralOrgNumber.trim()) {
      setReferralCompanyResults([]);
      setHasSearchedReferral(false);
      return;
    }

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
  }, [howDidYouHear, referralCompanyName, referralOrgNumber]);

  const onReferralCompanyPick = (item: CompanyResult) => {
    setReferralCompanyName(item.name);
    setReferralOrgNumber(item.orgNumber);
    setReferralCompanyResults([]);
    setHasSearchedReferral(false);
  };

  const motionHero = !reduce;

  return (
    <section className="bg-surface py-12 md:py-20">
      <div className="relative mx-auto w-full max-w-2xl rounded-xl border border-border bg-white p-8 shadow-[0_12px_40px_rgba(13,27,42,0.06)]">
        {status === "success" && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/96 px-6 text-center backdrop-blur-[2px]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: dur(0.6), ease: PREMIUM_EASE }}
          >
            <svg
              className={`request-success-check mx-auto h-14 w-14 ${drawSuccessCheck ? "is-drawn" : ""}`}
              viewBox="0 0 56 56"
              fill="none"
              aria-hidden
            >
              <circle cx="28" cy="28" r="24" stroke="#B8860B" strokeWidth="2" className="opacity-30" />
              <path
                d="M16 28l9 9 16-16"
                fill="none"
                stroke="#B8860B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-4 text-lg font-semibold text-navy">You&apos;re all set</p>
            <p className="mt-2 text-sm text-text-secondary">Taking you to the next step…</p>
          </motion.div>
        )}

        {motionHero ? (
          <>
            <motion.p
              className="inline-block rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur(0.55), delay: d(0.05), ease: PREMIUM_EASE }}
            >
              For Norwegian employers only
            </motion.p>
            <motion.h1
              className="mt-4 text-3xl font-bold text-navy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur(0.7), delay: d(0.1), ease: PREMIUM_EASE }}
            >
              Request Candidates
            </motion.h1>
            <motion.p
              className="mt-3 text-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur(0.55), delay: d(0.25), ease: PREMIUM_EASE }}
            >
              Fill in your details and we&apos;ll get you started.
            </motion.p>
            <motion.div
              className="mt-6 rounded-r-md border-l-4 border-gold bg-gold/10 p-3 text-sm text-navy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur(0.5), delay: d(0.35), ease: PREMIUM_EASE }}
            >
              Looking for a job?{" "}
              <a href="/score" className="font-semibold text-gold">
                Start here →
              </a>
            </motion.div>
          </>
        ) : (
          <>
            <p className="inline-block rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
              For Norwegian employers only
            </p>
            <h1 className="mt-4 text-3xl font-bold text-navy">Request Candidates</h1>
            <p className="mt-3 text-text-secondary">Fill in your details and we&apos;ll get you started.</p>
            <div className="mt-6 rounded-r-md border-l-4 border-gold bg-gold/10 p-3 text-sm text-navy">
              Looking for a job?{" "}
              <a href="/score" className="font-semibold text-gold">
                Start here →
              </a>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="request-progress-fill h-full bg-gold"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="mt-8 min-h-[120px]">
            <AnimatePresence mode="wait">
              {currentCard === 0 && (
                <motion.fieldset
                  key="card-0"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: dur(0.35), ease: PREMIUM_EASE }}
                  className="space-y-2"
                >
                  <legend className="px-1 text-sm font-medium text-navy">
                    Quick question: Is your company already a partner with ArbeidMatch?
                  </legend>
                  {[
                    ["new", "No, we are not a partner yet"],
                    ["existing", "Yes, we are already a partner"],
                  ].map(([value, label], i) => (
                    <motion.button
                      key={value}
                      type="button"
                      initial={reduce ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: dur(0.45),
                        delay: d(0.3 + i * 0.1),
                        ease: PREMIUM_EASE,
                      }}
                      onClick={() => {
                        setPartnershipStatus(value as "existing" | "new");
                        goToNextCard();
                      }}
                      className={optionButtonClass(partnershipStatus === value)}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>{label}</span>
                        {partnershipStatus === value && selectedOptionBadge}
                      </span>
                    </motion.button>
                  ))}
                </motion.fieldset>
              )}

              {currentCard === 1 && (
                <motion.div
                  key="card-1"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: dur(0.35), ease: PREMIUM_EASE }}
                  className="space-y-4"
                >
                  <h2 className="text-sm font-semibold text-navy">Company and Contact Details</h2>
                  <motion.div className="space-y-4" variants={fieldContainer} initial="hidden" animate="show">
                    <motion.label variants={fieldItem} className="relative block">
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
                      {(isSearchingCompanies ||
                        companyResults.length > 0 ||
                        (hasSearched && companyQuery.trim().length >= 2)) && (
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
                    </motion.label>

                    <motion.label variants={fieldItem} className="block">
                      <span className="mb-1 block text-sm font-medium text-navy">Contact person email*</span>
                      <input
                        required
                        name="email"
                        type="email"
                        className={inputClass}
                        placeholder="post@company.no"
                        value={companyEmail}
                        onChange={(event) => setCompanyEmail(event.target.value)}
                      />
                    </motion.label>

                    <motion.label variants={fieldItem} className="block">
                      <span className="mb-1 block text-sm font-medium text-navy">Contact person name*</span>
                      <input
                        required
                        name="full_name"
                        className={inputClass}
                        placeholder="First name last name"
                        value={contactName}
                        onChange={(event) => setContactName(event.target.value)}
                      />
                    </motion.label>

                    <motion.label variants={fieldItem} className="block">
                      <span className="mb-1 block text-sm font-medium text-navy">Contact person role/title*</span>
                      <input
                        required
                        name="contact_role"
                        className={inputClass}
                        placeholder="E.g. HR Manager, Site Manager"
                        value={contactRole}
                        onChange={(event) => setContactRole(event.target.value)}
                      />
                    </motion.label>

                    <motion.label variants={fieldItem} className="block">
                      <span className="mb-1 block text-sm font-medium text-navy">Contact phone number*</span>
                      <input
                        required
                        name="phone"
                        className={inputClass}
                        placeholder="+47 900 00 000"
                        value={contactPhone}
                        onChange={(event) => setContactPhone(event.target.value)}
                      />
                    </motion.label>
                  </motion.div>
                </motion.div>
              )}

              {partnershipStatus === "new" && currentCard === 2 && (
                <motion.div
                  key="card-2"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: dur(0.35), ease: PREMIUM_EASE }}
                  className="space-y-3"
                >
                  <h2 className="text-sm font-semibold text-navy">Collaboration Type</h2>
                  <p className="text-sm font-medium text-navy">What type of collaboration are you looking for?</p>
                  {[
                    "Occasional candidate requests",
                    "Volume-based engagement",
                    "Quality-focused engagement",
                  ].map((option, i) => (
                    <motion.button
                      key={option}
                      type="button"
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: dur(0.4),
                        delay: d(0.08 + i * 0.06),
                        ease: PREMIUM_EASE,
                      }}
                      onClick={() => {
                        setEngagementModel(option);
                        goToNextCard();
                      }}
                      className={optionButtonClass(engagementModel === option)}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>{option}</span>
                        {engagementModel === option && selectedOptionBadge}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {(partnershipStatus === "existing" && currentCard === 2) ||
              (partnershipStatus === "new" && currentCard === 3) ? (
                <motion.div
                  key="card-lead"
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: dur(0.35), ease: PREMIUM_EASE }}
                  className="space-y-4"
                >
                  <h2 className="text-sm font-semibold text-navy">How did you hear about us?</h2>
                  <motion.div
                    variants={fieldContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    <motion.label variants={fieldItem} className="block">
                      <span className="sr-only">How did you hear about us?</span>
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
                    </motion.label>

                    {howDidYouHear === "Social media" && (
                      <motion.label variants={fieldItem} className="block">
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
                      </motion.label>
                    )}

                    {howDidYouHear === "Social media" && socialMediaPlatform === "Other" && (
                      <motion.label variants={fieldItem} className="block">
                        <span className="mb-1 block text-sm font-medium text-navy">Other social media platform</span>
                        <input
                          name="socialMediaOther"
                          className={inputClass}
                          value={socialMediaOther}
                          onChange={(event) => setSocialMediaOther(event.target.value)}
                          required
                        />
                      </motion.label>
                    )}

                    {howDidYouHear === "Other" && (
                      <motion.label variants={fieldItem} className="block">
                        <span className="mb-1 block text-sm font-medium text-navy">Please specify</span>
                        <input
                          name="howDidYouHearOther"
                          className={inputClass}
                          value={howDidYouHearOther}
                          onChange={(event) => setHowDidYouHearOther(event.target.value)}
                          required
                        />
                      </motion.label>
                    )}

                    {howDidYouHear === "Referral from another company" && (
                      <motion.div variants={fieldItem} className="space-y-4">
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
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {cardError && (
            <motion.div
              key={errorShakeKey}
              className="request-error-shake rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {cardError}
            </motion.div>
          )}

          {!isAutoAdvanceCard && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevCard}
                disabled={currentCard === 0 || status === "submitting" || status === "success"}
                className="w-full rounded-md border border-navy px-4 py-3 text-sm font-medium text-navy transition-colors duration-200 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {currentCard < maxCard ? (
                <button
                  type="button"
                  onClick={nextCard}
                  disabled={status === "submitting" || status === "success"}
                  className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white transition-transform duration-200 hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting" || status === "success"}
                  className="btn-gold-premium relative flex w-full items-center justify-center gap-2 rounded-md bg-gold py-3 text-sm font-semibold text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "submitting" ? (
                    <>
                      <span className="request-submit-spinner shrink-0" aria-hidden />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Continue to candidate details"
                  )}
                </button>
              )}
            </div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: dur(0.35), ease: PREMIUM_EASE }}
              className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700"
            >
              Something went wrong. Please email post@arbeidmatch.no
            </motion.div>
          )}
        </form>
      </div>
    </section>
  );
}
