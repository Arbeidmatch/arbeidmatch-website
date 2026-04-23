"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { IconCheckCircle } from "./RecruiterNetworkIcons";
import { RECRUITER_EEA_COUNTRIES, filterCountriesByPrefix, filterRegionsByPrefix, regionsForCountry } from "@/lib/recruiterNetworkGeo";
import PremiumChoiceCard from "@/components/ui/premium/PremiumChoiceCard";
import PremiumInputField from "@/components/ui/premium/PremiumInputField";

const HERO_WORDS = ["Influence.", "Select.", "Earn."] as const;

const RN_LABEL = "mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55";
const RN_INPUT =
  "w-full rounded-[12px] border border-[rgba(201,168,76,0.22)] bg-[#0D1B2A] px-[18px] py-[14px] text-[15px] text-white placeholder:text-white/40 transition-[border-color,box-shadow] duration-200 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/35";
const RN_LIST =
  "absolute z-[80] mt-1.5 max-h-[min(280px,50vh)] w-full overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-[#0D1B2A] py-1";
const RN_LIST_ITEM =
  "w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none";

const stepVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  }),
};

const heroWordVariants: Variants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.25 } },
};

const BENEFITS = [
  "Access to verified EU/EEA candidate profiles",
  "Automated sourcing workflow - less admin, more placements",
  "Branded professional candidate presentations",
  "Dedicated support & partner tools",
] as const;

export default function RecruiterNetworkClient() {
  const reduce = useReducedMotion();
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motivation, setMotivation] = useState("");
  const [form, setForm] = useState({
    country: "",
    region: "",
    city: "",
    businessType: "",
  });
  const [countryTypeahead, setCountryTypeahead] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [regionTypeahead, setRegionTypeahead] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [monthlyReach, setMonthlyReach] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const countryComboRef = useRef<HTMLDivElement | null>(null);
  const regionComboRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) return;
    const interval = window.setInterval(() => {
      setHeroWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [reduce]);

  useEffect(() => {
    const onDocMouseDown = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (countryComboRef.current && !countryComboRef.current.contains(t)) setCountryOpen(false);
      if (regionComboRef.current && !regionComboRef.current.contains(t)) setRegionOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const mapBusinessTypeToHasCompany = (value: string) => {
    if (!value) return "";
    if (value === "no_business") return "not_yet";
    if (value === "freelancer_platform") return "want_setup";
    return "yes";
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const website = fd.get("website");
    if (typeof website === "string" && website.trim()) return;

    setSubmitting(true);
    try {
      if (!fullName.trim() || !email.trim() || !socialUrl.trim() || !monthlyReach.trim()) {
        setError("Please complete all required fields before submitting.");
        return;
      }
      if (!partnerType.trim()) {
        setError("Please select which partner path fits you best.");
        return;
      }
      if (!gdprConsent) {
        setError("Please accept GDPR consent to continue.");
        return;
      }
      let resolvedCountry = form.country.trim();
      if (!resolvedCountry && countryTypeahead.trim()) {
        const guess = RECRUITER_EEA_COUNTRIES.find((c) => c.toLowerCase() === countryTypeahead.trim().toLowerCase());
        if (guess) resolvedCountry = guess;
      }
      if (!resolvedCountry) {
        setError("Please select your country from the list.");
        return;
      }
      if (!form.region.trim()) {
        setError("Please enter or select your region.");
        return;
      }
      if (!form.city.trim()) {
        setError("Please enter your city.");
        return;
      }

      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        country: resolvedCountry,
        region: form.region.trim(),
        city: form.city.trim(),
        partner_type: partnerType.trim(),
        social_url: socialUrl.trim(),
        monthly_reach: monthlyReach.trim(),
        has_company: mapBusinessTypeToHasCompany(form.businessType),
        business_type: form.businessType,
        motivation: motivation.trim(),
        gdpr_consent: gdprConsent,
      };

      const res = await fetch("/api/recruiter-network/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccessEmail(payload.email);
      e.currentTarget.reset();
      setForm({ country: "", region: "", city: "", businessType: "" });
      setFullName("");
      setEmail("");
      setSocialUrl("");
      setMonthlyReach("");
      setPartnerType("");
      setGdprConsent(false);
      setMotivation("");
      setCountryTypeahead("");
      setRegionTypeahead("");
      setApplyOpen(false);
      setFormStep(1);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const regionChoicesList = regionsForCountry(form.country);
  const countryFiltered = filterCountriesByPrefix(countryTypeahead);
  const regionFiltered = regionChoicesList && regionChoicesList.length > 0 ? filterRegionsByPrefix(regionChoicesList, regionTypeahead) : [];
  const hasCommittedCountry = Boolean(form.country.trim());

  return (
    <>
      <div className="min-h-screen bg-[#0D1B2A] text-white">
        <section className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col items-center justify-center px-4 py-14 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={HERO_WORDS[heroWordIndex]}
              variants={heroWordVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-[44px] font-extrabold leading-none tracking-tight text-white md:text-[72px]"
            >
              {HERO_WORDS[heroWordIndex]}
            </motion.p>
          </AnimatePresence>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-6 text-balance break-words text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-7xl"
          >
            Join the ArbeidMatch Recruiter Network
          </motion.h1>

          <span className="mt-6 inline-flex rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-4 py-1 text-sm text-[#C9A84C]">
            EU/EEA Recruiters Only
          </span>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">
            Built for European recruiters. Source and present top EU/EEA talent for Norwegian employers - faster, smarter,
            together.
          </p>

          <button
            type="button"
            onClick={() => setApplyOpen(true)}
            className="mt-8 w-full rounded-xl bg-[#C9A84C] px-8 py-3 text-base font-bold text-[#0D1B2A] transition hover:bg-[#b8953f] sm:w-auto"
          >
            Apply to Join
          </button>

          <div className="mt-14 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <article
                key={benefit}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:border-[#C9A84C]/40"
              >
                <p className="text-base font-semibold text-white">{benefit}</p>
              </article>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            We work exclusively with recruitment professionals operating within the EU/EEA zone.
          </p>

          <button
            type="button"
            onClick={() => setApplyOpen(true)}
            className="mt-9 w-full rounded-xl bg-[#C9A84C] px-10 py-3.5 text-lg font-bold text-[#0D1B2A] transition hover:bg-[#b8953f] sm:w-auto"
          >
            Apply to Join the Network
          </button>
        </section>
      </div>

      <AnimatePresence>
        {applyOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setApplyOpen(false);
            }}
          >
            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-h-[92vh] w-[90%] max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1B2A] p-8"
            >
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white"
              >
                ✕
              </button>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Apply - Step {formStep} of 3</p>

              <AnimatePresence mode="wait" custom={stepDirection}>
                <motion.div
                  key={`rn-step-${formStep}`}
                  custom={stepDirection}
                  variants={stepVariants}
                  initial={reduce ? false : "enter"}
                  animate="center"
                  exit={reduce ? undefined : "exit"}
                  className="space-y-4"
                >
                  {formStep === 1 ? (
                    <>
                      <PremiumInputField label="Full name *" value={fullName} onChange={setFullName} placeholder="Your name" />
                      <PremiumInputField label="Email address *" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
                      <div ref={countryComboRef} className="relative">
                        <label htmlFor="rn-country-input" className={RN_LABEL}>
                          Country *
                        </label>
                        <input
                          id="rn-country-input"
                          type="text"
                          autoComplete="off"
                          value={countryTypeahead}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCountryTypeahead(v);
                            setCountryOpen(true);
                            setForm((f) => ({ ...f, country: "", region: "", city: "" }));
                            setRegionTypeahead("");
                          }}
                          onFocus={() => setCountryOpen(true)}
                          placeholder="Start typing a country..."
                          className={RN_INPUT}
                        />
                        {countryOpen && countryFiltered.length > 0 ? (
                          <ul id="rn-country-listbox" role="listbox" className={RN_LIST}>
                            {countryFiltered.map((country) => (
                              <li key={country} role="none">
                                <button
                                  type="button"
                                  role="option"
                                  className={RN_LIST_ITEM}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    setForm((f) => ({ ...f, country, region: "", city: "" }));
                                    setCountryTypeahead(country);
                                    setCountryOpen(false);
                                  }}
                                >
                                  {country}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {formStep === 2 ? (
                    <>
                      {hasCommittedCountry ? (
                        <div className="space-y-3">
                          {regionChoicesList ? (
                            <div ref={regionComboRef} className="relative">
                              <label htmlFor="rn-region-input" className={RN_LABEL}>
                                Region *
                              </label>
                              <input
                                id="rn-region-input"
                                type="text"
                                autoComplete="off"
                                value={regionTypeahead}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setRegionTypeahead(v);
                                  setRegionOpen(true);
                                  setForm((f) => ({ ...f, region: "", city: "" }));
                                }}
                                onFocus={() => setRegionOpen(true)}
                                placeholder="Search regions..."
                                className={RN_INPUT}
                              />
                              {regionOpen && regionFiltered.length > 0 ? (
                                <ul id="rn-region-listbox" role="listbox" className={RN_LIST}>
                                  {regionFiltered.map((region) => (
                                    <li key={region} role="none">
                                      <button
                                        type="button"
                                        role="option"
                                        className={RN_LIST_ITEM}
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          setForm((f) => ({ ...f, region, city: "" }));
                                          setRegionTypeahead(region);
                                          setRegionOpen(false);
                                        }}
                                      >
                                        {region}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          ) : (
                            <PremiumInputField label="Region *" value={form.region} onChange={(region) => setForm((f) => ({ ...f, region }))} />
                          )}
                          <PremiumInputField label="City *" value={form.city} onChange={(city) => setForm((f) => ({ ...f, city }))} />
                        </div>
                      ) : (
                        <p className="text-sm text-white/65">Select country in step 1 to continue.</p>
                      )}
                      <p className="text-xs text-white/50">How do you invoice?</p>
                      {[
                        ["company", "Registered company (AS/ENK or local equivalent)"],
                        ["sole_trader", "Sole trader / self-employed"],
                        ["freelancer_platform", "Freelancer via invoicing platform"],
                        ["no_business", "I do not have a business yet"],
                      ].map(([value, title]) => (
                        <PremiumChoiceCard
                          key={value}
                          selected={form.businessType === value}
                          onClick={() => setForm((f) => ({ ...f, businessType: value }))}
                          title={title}
                          type="radio"
                        />
                      ))}
                    </>
                  ) : null}

                  {formStep === 3 ? (
                    <>
                      <p className="text-xs text-white/50">Which path fits you best? *</p>
                      {[
                        ["influencer", "The Influencer"],
                        ["recruiter", "The Recruiter"],
                        ["learner", "The Learner"],
                      ].map(([value, label]) => (
                        <PremiumChoiceCard
                          key={value}
                          selected={partnerType === value}
                          onClick={() => setPartnerType(value)}
                          title={label}
                          type="radio"
                        />
                      ))}
                      <PremiumInputField label="Social media/profile link *" value={socialUrl} onChange={setSocialUrl} placeholder="https://" />
                      <PremiumInputField label="Monthly reach / visitors *" value={monthlyReach} onChange={setMonthlyReach} placeholder="e.g. 150,000" />
                      <PremiumInputField multiline rows={4} label="Tell us why you want to join" value={motivation} onChange={setMotivation} />
                      <PremiumChoiceCard
                        selected={gdprConsent}
                        onClick={() => setGdprConsent((prev) => !prev)}
                        title="I agree that ArbeidMatch Norge AS may store and process my information to evaluate my partnership application. *"
                        type="checkbox"
                      />
                      <p className="mt-1 text-right text-[11px] text-white/40">{motivation.length}/500</p>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

              <div className="mt-6 flex gap-3">
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStepDirection(-1);
                      setFormStep((prev) => Math.max(1, prev - 1));
                    }}
                    className="w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white"
                  >
                    Back
                  </button>
                ) : null}
                {formStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStepDirection(1);
                      setFormStep((prev) => Math.min(3, prev + 1));
                    }}
                    className="w-full rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-[#0D1B2A]"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-[#C9A84C] py-3 text-sm font-bold text-[#0D1B2A] disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Submit Application"}
                  </button>
                )}
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {successEmail ? (
          <motion.div
            className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl border border-[#C9A84C]/30 bg-[#0D1B2A] p-8 text-center"
            >
              <div className="mx-auto mb-4 flex justify-center">
                <IconCheckCircle />
              </div>
              <p className="text-lg font-semibold">Thank you! Your application is under review.</p>
              <p className="mt-2 text-sm text-white/70">
                We will contact you at <span className="text-[#C9A84C]">{successEmail}</span>.
              </p>
              <button
                type="button"
                onClick={() => setSuccessEmail(null)}
                className="mt-6 rounded-xl bg-[#C9A84C] px-5 py-2.5 font-bold text-[#0D1B2A]"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
