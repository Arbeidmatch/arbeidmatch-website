"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, X } from "lucide-react";

import {
  RECRUITER_EEA_COUNTRIES,
  filterCountriesByPrefix,
  filterRegionsByPrefix,
  regionsForCountry,
} from "@/lib/recruiterNetworkGeo";
import {
  DEFAULT_EEA_DIAL_PREFIX,
  buildEeaPhone,
  eeaDialOptionsSortedByCountry,
  isEeaCandidatePhone,
} from "@/lib/candidates/euEeaCandidateGeo";

const GOLD = "#C9A84C";
const NAVY = "#0D1B2A";

const LABEL = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55";
const INPUT =
  "w-full rounded-[12px] border border-[rgba(201,168,76,0.22)] bg-[#0A0F18] px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/35";
const LIST =
  "absolute z-[90] mt-1.5 max-h-[min(260px,45vh)] w-full overflow-y-auto rounded-[12px] border border-[rgba(201,168,76,0.35)] bg-[#0D1B2A] py-1 shadow-[0_20px_50px_rgba(0,0,0,0.55)]";
const LIST_ITEM =
  "w-full cursor-pointer px-4 py-2.5 text-left text-[14px] text-white/90 hover:bg-[rgba(201,168,76,0.14)] focus:bg-[rgba(201,168,76,0.14)] focus:outline-none";

const ROLES = [
  { id: "independent_recruiter", label: "Independent Recruiter" },
  { id: "staffing_agency", label: "Staffing Agency" },
  { id: "hr_professional", label: "HR Professional" },
  { id: "community_influencer", label: "Community Leader / Influencer" },
] as const;

const INVOICES = [
  { id: "registered_company", label: "Registered company (AS, ENK or equivalent)" },
  { id: "sole_trader", label: "Sole trader / Self-employed" },
  { id: "freelancer_platform", label: "Freelancer via invoicing platform" },
  { id: "no_business_yet", label: "I don't have a business yet" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];
type InvoiceId = (typeof INVOICES)[number]["id"];

function RadioCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[14px] border px-4 py-3.5 text-left text-[14px] font-medium leading-snug transition ${
        selected
          ? "border-[rgba(201,168,76,0.65)] bg-[rgba(201,168,76,0.12)] text-white shadow-[0_0_0_1px_rgba(201,168,76,0.2)]"
          : "border-white/[0.12] bg-[#0A0F18] text-white/85 hover:border-[rgba(201,168,76,0.35)] hover:bg-white/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}

export default function RecruiterNetworkPremiumApplyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [[page, direction], setPage] = useState([0, 0]);

  const [roleId, setRoleId] = useState<RoleId | "">("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [countryTypeahead, setCountryTypeahead] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [regionTypeahead, setRegionTypeahead] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const countryComboRef = useRef<HTMLDivElement | null>(null);
  const regionComboRef = useRef<HTMLDivElement | null>(null);

  const [invoiceId, setInvoiceId] = useState<InvoiceId | "">("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDial, setPhoneDial] = useState(DEFAULT_EEA_DIAL_PREFIX);
  const [phoneNational, setPhoneNational] = useState("");
  const [gdpr, setGdpr] = useState(false);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setPage([0, 0]);
    setRoleId("");
    setCountry("");
    setRegion("");
    setCity("");
    setCountryTypeahead("");
    setCountryOpen(false);
    setRegionTypeahead("");
    setRegionOpen(false);
    setInvoiceId("");
    setFullName("");
    setEmail("");
    setPhoneDial(DEFAULT_EEA_DIAL_PREFIX);
    setPhoneNational("");
    setGdpr(false);
    setSuccess(false);
    setError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => reset());
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fullPhone = buildEeaPhone(phoneDial, phoneNational);

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (countryComboRef.current && !countryComboRef.current.contains(t)) setCountryOpen(false);
      if (regionComboRef.current && !regionComboRef.current.contains(t)) setRegionOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const regionChoicesList = regionsForCountry(country);
  const countryFiltered = filterCountriesByPrefix(countryTypeahead);
  const regionFiltered =
    regionChoicesList && regionChoicesList.length > 0 ? filterRegionsByPrefix(regionChoicesList, regionTypeahead) : [];

  const paginate = (newPage: number, dir: number) => {
    setPage([newPage, dir]);
  };

  const canNext0 = Boolean(roleId);
  const canNext1 = Boolean(country.trim() && region.trim() && city.trim());
  const canNext2 = Boolean(invoiceId);
  const canSubmit =
    fullName.trim().length >= 2 &&
    email.includes("@") &&
    isEeaCandidatePhone(fullPhone) &&
    gdpr;

  const goNext = () => {
    setError(null);
    if (page === 0 && !canNext0) {
      setError("Please choose the option that best describes you.");
      return;
    }
    if (page === 1 && !canNext1) {
      setError("Country, region and city are required.");
      return;
    }
    if (page === 2 && !canNext2) {
      setError("Please select how you prefer to invoice.");
      return;
    }
    if (page < 3) paginate(page + 1, 1);
  };

  const goBack = () => {
    setError(null);
    if (page > 0) paginate(page - 1, -1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please complete all fields, use an EU/EEA phone number, and accept the privacy statement.");
      return;
    }
    setSubmitting(true);
    const roleLabel = ROLES.find((r) => r.id === roleId)?.label ?? roleId;
    const invLabel = INVOICES.find((i) => i.id === invoiceId)?.label ?? invoiceId;
    const partner_type = roleId === "community_influencer" ? "influencer" : "recruiter";

    const has_company =
      invoiceId === "no_business_yet"
        ? "not_yet"
        : invoiceId === "registered_company" || invoiceId === "sole_trader" || invoiceId === "freelancer_platform"
          ? "yes"
          : "not_yet";

    const motivation = [
      "[Premium card application]",
      `Role: ${roleLabel}`,
      `Invoice: ${invLabel}`,
      `Phone: ${fullPhone}`,
    ].join("\n");

    try {
      const res = await fetch("/api/recruiter-network/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apply_flow: "premium_cards",
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          country: country.trim(),
          region: region.trim(),
          city: city.trim(),
          partner_type,
          role_card: roleId,
          invoice_card: invoiceId,
          social_url: "https://www.arbeidmatch.no/recruiter-network",
          monthly_reach: "1",
          has_company,
          motivation,
          gdpr_consent: true,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: reduce ? 0 : dir > 0 ? 48 : -48,
      opacity: reduce ? 1 : 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: reduce ? 0 : dir > 0 ? -48 : 48,
      opacity: reduce ? 1 : 0,
    }),
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="rn-premium-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[rgba(13,27,42,0.82)] backdrop-blur-[12px]"
            style={{ WebkitBackdropFilter: "blur(12px)" }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rn-premium-title"
            className="relative z-[201] w-full max-w-[480px] overflow-hidden rounded-[20px] border border-[rgba(201,168,76,0.38)] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            style={{ background: NAVY }}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex flex-1 justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? "w-8 bg-[#C9A84C]" : "w-1.5 bg-white/20"}`}
                    aria-hidden
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close application"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="relative min-h-[320px] px-5 pb-6 pt-5 md:px-7 md:pb-8 md:pt-6">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] as const }}
                    className="text-center"
                  >
                    <motion.div
                      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C9A84C] bg-[rgba(201,168,76,0.12)]"
                      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    >
                      <Check className="h-8 w-8 text-[#C9A84C]" strokeWidth={2.2} aria-hidden />
                    </motion.div>
                    <p className="text-lg font-semibold text-white">Thank you!</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      We&apos;ll review your application and be in touch within 2 business days.
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-8 w-full rounded-[12px] py-3.5 text-[15px] font-bold text-[#0D1B2A]"
                      style={{ background: GOLD }}
                    >
                      Close
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={page}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] as const }}
                  >
                    {page === 0 ? (
                      <div>
                        <h2 id="rn-premium-title" className="text-lg font-bold tracking-tight text-white md:text-xl">
                          What best describes you?
                        </h2>
                        <p className="mt-1 text-xs text-white/45">Choose one option to continue.</p>
                        <div className="mt-6 flex flex-col gap-2.5">
                          {ROLES.map((r) => (
                            <RadioCard key={r.id} selected={roleId === r.id} onSelect={() => setRoleId(r.id)}>
                              {r.label}
                            </RadioCard>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {page === 1 ? (
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">Where is your network based?</h2>
                        <p className="mt-1 text-xs text-white/45">Country, region and city.</p>
                        <div className="mt-6 space-y-4">
                          <div ref={countryComboRef} className="relative">
                            <label className={LABEL} htmlFor="rn-prem-country">
                              Country
                            </label>
                            <input
                              id="rn-prem-country"
                              type="text"
                              autoComplete="off"
                              value={countryTypeahead}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCountryTypeahead(v);
                                setCountryOpen(true);
                                setCountry("");
                                setRegion("");
                                setCity("");
                                setRegionTypeahead("");
                              }}
                              onFocus={() => setCountryOpen(true)}
                              onBlur={() => {
                                const match = RECRUITER_EEA_COUNTRIES.find(
                                  (c) => c.toLowerCase() === countryTypeahead.trim().toLowerCase(),
                                );
                                if (match) {
                                  setCountry(match);
                                  setCountryTypeahead(match);
                                  setRegion("");
                                  setCity("");
                                  setRegionTypeahead("");
                                }
                                setCountryOpen(false);
                              }}
                              placeholder="Start typing a country…"
                              className={INPUT}
                            />
                            {countryOpen && countryFiltered.length > 0 ? (
                              <ul className={LIST} role="listbox">
                                {countryFiltered.slice(0, 12).map((c) => (
                                  <li key={c} role="option">
                                    <button
                                      type="button"
                                      className={LIST_ITEM}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setCountry(c);
                                        setCountryTypeahead(c);
                                        setRegion("");
                                        setCity("");
                                        setRegionTypeahead("");
                                        setCountryOpen(false);
                                      }}
                                    >
                                      {c}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>

                          <div ref={regionComboRef} className="relative">
                            <label className={LABEL} htmlFor="rn-prem-region">
                              Region
                            </label>
                            <input
                              id="rn-prem-region"
                              type="text"
                              disabled={!country.trim()}
                              autoComplete="off"
                              value={regionTypeahead}
                              onChange={(e) => {
                                setRegionTypeahead(e.target.value);
                                setRegionOpen(true);
                                setRegion("");
                              }}
                              onFocus={() => country.trim() && setRegionOpen(true)}
                              onBlur={() => {
                                if (regionChoicesList?.length) {
                                  const exact = regionChoicesList.find(
                                    (r) => r.toLowerCase() === regionTypeahead.trim().toLowerCase(),
                                  );
                                  if (exact) {
                                    setRegion(exact);
                                    setRegionTypeahead(exact);
                                  }
                                } else if (regionTypeahead.trim()) {
                                  setRegion(regionTypeahead.trim());
                                }
                                setRegionOpen(false);
                              }}
                              placeholder={country.trim() ? "Region or county" : "Select country first"}
                              className={`${INPUT} disabled:opacity-40`}
                            />
                            {regionOpen && country.trim() && regionFiltered.length > 0 ? (
                              <ul className={LIST} role="listbox">
                                {regionFiltered.slice(0, 14).map((r) => (
                                  <li key={r} role="option">
                                    <button
                                      type="button"
                                      className={LIST_ITEM}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setRegion(r);
                                        setRegionTypeahead(r);
                                        setRegionOpen(false);
                                      }}
                                    >
                                      {r}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>

                          <div>
                            <label className={LABEL} htmlFor="rn-prem-city">
                              City
                            </label>
                            <input
                              id="rn-prem-city"
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="City"
                              className={INPUT}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {page === 2 ? (
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">How do you prefer to invoice?</h2>
                        <p className="mt-1 text-xs text-white/45">Select the option that fits your situation today.</p>
                        <div className="mt-6 flex flex-col gap-2.5">
                          {INVOICES.map((i) => (
                            <RadioCard key={i.id} selected={invoiceId === i.id} onSelect={() => setInvoiceId(i.id)}>
                              {i.label}
                            </RadioCard>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {page === 3 ? (
                      <form id="rn-premium-apply-form" onSubmit={handleSubmit} className="space-y-4">
                        <h2 className="text-lg font-bold tracking-tight text-white md:text-xl">How can we reach you?</h2>
                        <p className="mt-1 text-xs text-white/45">We use this only to follow up on your application.</p>
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                        <div>
                          <label className={LABEL} htmlFor="rn-prem-name">
                            Full name
                          </label>
                          <input
                            id="rn-prem-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={INPUT}
                            required
                            autoComplete="name"
                          />
                        </div>
                        <div>
                          <label className={LABEL} htmlFor="rn-prem-email">
                            Email address
                          </label>
                          <input
                            id="rn-prem-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={INPUT}
                            required
                            autoComplete="email"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,140px)_1fr]">
                          <div>
                            <label className={LABEL} htmlFor="rn-prem-dial">
                              Prefix
                            </label>
                            <select
                              id="rn-prem-dial"
                              value={phoneDial}
                              onChange={(e) => setPhoneDial(e.target.value)}
                              className={INPUT}
                            >
                              {eeaDialOptionsSortedByCountry().map((o) => (
                                <option key={o.iso} value={o.dial}>
                                  {o.dial} · {o.country}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={LABEL} htmlFor="rn-prem-phone">
                              Phone number
                            </label>
                            <input
                              id="rn-prem-phone"
                              type="tel"
                              inputMode="tel"
                              value={phoneNational}
                              onChange={(e) => setPhoneNational(e.target.value)}
                              className={INPUT}
                              placeholder="National number"
                              autoComplete="tel-national"
                            />
                          </div>
                        </div>
                        <label className="flex cursor-pointer items-start gap-3 pt-1 text-[13px] leading-relaxed text-white/70">
                          <input
                            type="checkbox"
                            checked={gdpr}
                            onChange={(e) => setGdpr(e.target.checked)}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 accent-[#C9A84C]"
                          />
                          <span>
                            I agree to the processing of my data as described in the{" "}
                            <a href="/privacy" className="text-[#C9A84C] underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                              Privacy Policy
                            </a>
                            .
                          </span>
                        </label>
                      </form>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>

              {error ? <p className="mt-3 text-center text-sm text-amber-200/90">{error}</p> : null}

              {!success ? (
                <div className="mt-6 flex items-center gap-3">
                  {page > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/[0.05]"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      Back
                    </button>
                  ) : (
                    <span className="min-w-[48px]" />
                  )}
                  {page < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="min-h-[48px] flex-1 rounded-[12px] py-3.5 text-[15px] font-bold text-[#0D1B2A] transition hover:brightness-105"
                      style={{ background: GOLD }}
                    >
                      Confirm & Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="rn-premium-apply-form"
                      disabled={submitting}
                      className="min-h-[48px] flex-1 rounded-[12px] py-3.5 text-[15px] font-bold text-[#0D1B2A] transition hover:brightness-105 disabled:opacity-60"
                      style={{ background: GOLD }}
                    >
                      {submitting ? "Sending…" : "Confirm & Submit"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
