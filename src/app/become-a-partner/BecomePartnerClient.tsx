"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PremiumChoiceCard from "@/components/ui/premium/PremiumChoiceCard";
import PremiumDropdown from "@/components/ui/premium/PremiumDropdown";
import PremiumInputField from "@/components/ui/premium/PremiumInputField";

const WHY_CARDS = [
  {
    title: "Pre-Screened Candidates",
    desc: "Candidates are quality-checked before presentation, so your team can focus on interview and final decision.",
  },
  {
    title: "Direct Network Access",
    desc: "Get direct access to our EU/EEA network instead of depending on public job boards.",
  },
  {
    title: "Automated Workflow",
    desc: "A streamlined process where you step in at interview and final hiring decision stages.",
  },
  {
    title: "Your Brand, Our Candidates",
    desc: "Candidate presentations can be branded with your logo and client-facing identity.",
  },
  {
    title: "Dedicated ATS Access",
    desc: "Use your own partner dashboard for candidate pipeline and communication flow.",
  },
  {
    title: "Dedicated Support",
    desc: "Partner teams receive direct support for intake, pipeline quality, and handover.",
  },
];

const PARTNERSHIP_STEPS = [
  { title: "Apply", desc: "Send your partnership application with company details." },
  { title: "Review", desc: "Our team reviews your request in 3-5 working days." },
  { title: "Contract DocuSign", desc: "Agreement is sent electronically for signature." },
  { title: "Onboarding", desc: "We configure your workflow and partner setup." },
  { title: "Access granted", desc: "Your team receives live ATS partner access." },
];

const SECTORS = ["Construction", "Electrical", "Logistics", "Industry", "Cleaning", "Hospitality"] as const;
const MONTHLY_OPTIONS = ["1-5", "6-20", "21-50", "50+"] as const;
const PREFIX_OPTIONS = ["+47", "+46", "+45"] as const;
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  }),
};

type Suggestion = { name: string; orgNumber: string };

export default function BecomePartnerClient() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref")?.trim() || "";
  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState<(typeof PREFIX_OPTIONS)[number]>("+47");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [monthlyPlacements, setMonthlyPlacements] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [tcAccepted, setTcAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [formDirection, setFormDirection] = useState(1);

  const [companyQuery, setCompanyQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [trialOpen, setTrialOpen] = useState(false);
  const [trialEmail, setTrialEmail] = useState("");
  const [trialTc, setTrialTc] = useState(false);
  const [trialStatus, setTrialStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [trialMessage, setTrialMessage] = useState("");

  const canSubmit = useMemo(
    () =>
      companyName.trim().length >= 2 &&
      contactName.trim().length >= 2 &&
      email.trim().includes("@") &&
      phone.trim().length >= 5 &&
      monthlyPlacements.length > 0 &&
      sectors.length > 0 &&
      tcAccepted,
    [companyName, contactName, email, phone, monthlyPlacements, sectors, tcAccepted],
  );

  const canGoStep2 = useMemo(
    () => companyName.trim().length >= 2 && contactName.trim().length >= 2 && email.trim().includes("@"),
    [companyName, contactName, email],
  );

  const canGoStep3 = useMemo(() => phone.trim().length >= 5, [phone]);

  useEffect(() => {
    if (companyQuery.trim().length < 2) {
      setSuggestions([]);
      setLookupStatus("idle");
      return;
    }
    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setLookupStatus("loading");
      try {
        const res = await fetch(`/api/brreg/search?q=${encodeURIComponent(companyQuery.trim())}`, { signal: controller.signal });
        const data = (await res.json().catch(() => ({}))) as { success?: boolean; companies?: Suggestion[] };
        if (!res.ok || !data.success) {
          setLookupStatus("error");
          setSuggestions([]);
          return;
        }
        setSuggestions(data.companies ?? []);
        setLookupStatus("idle");
      } catch {
        if (controller.signal.aborted) return;
        setLookupStatus("error");
        setSuggestions([]);
      }
    }, 220);
    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [companyQuery]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const toggleSector = (sector: string) => {
    setSectors((prev) => (prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]));
  };

  const submitPartner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/partner-request/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          orgNumber: orgNumber.trim(),
          contactName: contactName.trim(),
          email: email.trim().toLowerCase(),
          phone: `${phonePrefix} ${phone.trim()}`,
          website: website.trim(),
          placementsPerMonth: monthlyPlacements,
          sectors,
          message: message.trim(),
          gdprConsent: true,
          referral_code: referralCode || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Could not submit your application right now.");
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError("Could not submit your application right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitTrial = async () => {
    if (!trialEmail.trim().includes("@") || !trialTc) return;
    setTrialStatus("loading");
    setTrialMessage("");
    try {
      const res = await fetch("/api/partner/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trialEmail.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setTrialStatus("error");
        setTrialMessage(data.error || "Could not start trial.");
        return;
      }
      setTrialStatus("success");
      setTrialMessage("Trial activated. Please check your email.");
    } catch {
      setTrialStatus("error");
      setTrialMessage("Could not start trial.");
    }
  };

  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="container-site py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="inline-flex rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-4 py-1 text-xs font-semibold tracking-[0.14em] text-[#C9A84C]">
            RECRUITMENT PARTNERS ONLY
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-6xl">Source Better Candidates. Faster.</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/75 md:text-lg">
            Join ArbeidMatch as a recruitment partner and get access to pre-screened EU/EEA candidates ready to work in
            Norway. You keep the client relationship. We supply the talent.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#apply" className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A]">
              Apply for Partnership
            </a>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white"
            >
              Talk to Us First
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="container-site py-10">
        <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-bold">
          Why Partner With Us
        </motion.h2>
        <motion.div
          className="mt-6 grid gap-4 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {WHY_CARDS.map((card) => (
            <motion.article
              key={card.title}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{card.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="container-site py-12">
        <h2 className="text-3xl font-bold">How Partnership Works</h2>
        <motion.div
          className="mt-6 space-y-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
        >
          {PARTNERSHIP_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="text-sm font-semibold text-[#C9A84C]">0{i + 1}</p>
              <p className="mt-1 text-lg font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-white/70">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="container-site py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-r from-[#C9A84C]/20 via-[#C9A84C]/10 to-transparent p-8"
        >
          <h2 className="text-3xl font-bold">Not ready to commit? Try it free for 7 days.</h2>
          <p className="mt-3 max-w-3xl text-sm text-white/80">
            Access most premium features. Candidate contact details require a partnership or premium plan.
          </p>
          <button
            type="button"
            onClick={() => setTrialOpen(true)}
            className="mt-6 rounded-xl bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A]"
          >
            Start Free Trial
          </button>
        </motion.div>
      </section>

      <section id="apply" className="fixed inset-0 z-40 flex items-center justify-center bg-[#0D1B2A] px-4 py-5">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-h-[95vh] w-[90%] max-w-2xl overflow-y-auto rounded-2xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 p-6"
            >
              <p className="text-xl font-semibold text-white">Application received. We&apos;ll review and be in touch shortly.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submitPartner}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-h-[95vh] w-[90%] max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Apply for Partnership</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Step {formStep} of 3</h2>
              <div className="mt-5 overflow-hidden">
                <AnimatePresence mode="wait" custom={formDirection}>
                  {formStep === 1 ? (
                    <motion.div
                      key="step-1"
                      custom={formDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                  <div className="relative">
                    <label className="mb-1 block text-xs text-white/60">Company name</label>
                    <PremiumInputField
                      label="Company name"
                      value={companyQuery}
                      onChange={(next) => {
                        setCompanyQuery(next);
                        setCompanyName(next);
                        setOrgNumber("");
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => window.setTimeout(() => setShowSuggestions(false), 130)}
                      placeholder="Search in Brønnøysund register..."
                      className="pt-4"
                    />
                    {showSuggestions && suggestions.length > 0 ? (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-white/15 bg-[#0A1624] p-1">
                        {suggestions.map((s) => (
                          <button
                            key={`${s.orgNumber}-${s.name}`}
                            type="button"
                            onMouseDown={() => {
                              setCompanyName(s.name);
                              setCompanyQuery(s.name);
                              setOrgNumber(s.orgNumber);
                              setShowSuggestions(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                          >
                            <p className="text-sm font-semibold">{s.name}</p>
                            <p className="text-xs text-white/60">Org: {s.orgNumber}</p>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {lookupStatus === "loading" ? <p className="mt-1 text-xs text-white/50">Searching...</p> : null}
                  </div>
                  <Field label="Contact name" value={contactName} onChange={setContactName} />
                  <Field label="Email" value={email} onChange={setEmail} type="email" />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFormDirection(1);
                        setFormStep(2);
                      }}
                      disabled={!canGoStep2}
                      className="rounded-xl bg-[#C9A84C] px-5 py-2.5 font-semibold text-[#0D1B2A] disabled:opacity-60"
                    >
                      Next
                    </button>
                  </div>
                    </motion.div>
                  ) : null}

                  {formStep === 2 ? (
                    <motion.div
                      key="step-2"
                      custom={formDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Phone</label>
                    <div className="flex gap-2">
                      <PremiumDropdown
                        value={phonePrefix}
                        onChange={(next) => setPhonePrefix(next as (typeof PREFIX_OPTIONS)[number])}
                        options={PREFIX_OPTIONS.map((p) => ({ value: p, label: p }))}
                        className="w-[120px]"
                      />
                      <PremiumInputField label="Phone number" value={phone} onChange={setPhone} className="w-full pt-4" />
                    </div>
                  </div>
                  <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Organisation number</label>
                    <PremiumInputField label="Organisation number" value={orgNumber} onChange={setOrgNumber} disabled className="pt-4 text-white/80" />
                  </div>
                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormDirection(-1);
                        setFormStep(1);
                      }}
                      className="rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormDirection(1);
                        setFormStep(3);
                      }}
                      disabled={!canGoStep3}
                      className="rounded-xl bg-[#C9A84C] px-5 py-2.5 font-semibold text-[#0D1B2A] disabled:opacity-60"
                    >
                      Next
                    </button>
                  </div>
                    </motion.div>
                  ) : null}

                  {formStep === 3 ? (
                    <motion.div
                      key="step-3"
                      custom={formDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                  <div>
                    <label className="mb-1 block text-xs text-white/60">How many candidates do you place per month?</label>
                    <PremiumDropdown
                      value={monthlyPlacements}
                      onChange={setMonthlyPlacements}
                      options={[{ value: "", label: "Select" }, ...MONTHLY_OPTIONS.map((o) => ({ value: o, label: o }))]}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-white/60">Which sectors do you recruit for?</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SECTORS.map((sector) => (
                        <PremiumChoiceCard
                          key={sector}
                          type="checkbox"
                          selected={sectors.includes(sector)}
                          onClick={() => toggleSector(sector)}
                          title={sector}
                          className="py-3"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Message (optional)</label>
                    <PremiumInputField multiline rows={4} label="Message (optional)" value={message} onChange={setMessage} className="min-h-[120px]" />
                  </div>
                  <PremiumChoiceCard
                    type="checkbox"
                    selected={tcAccepted}
                    onClick={() => setTcAccepted((prev) => !prev)}
                    title="I agree to terms and privacy policy."
                  />
                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormDirection(-1);
                        setFormStep(2);
                      }}
                      className="rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="rounded-xl bg-[#C9A84C] px-5 py-2.5 font-bold text-[#0D1B2A] disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                  {submitError ? <p className="text-sm text-red-300">{submitError}</p> : null}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      <section className="container-site pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Pricing Philosophy</h2>
          <p className="mt-2 text-sm text-white/75">
            Partnership pricing is based on volume and features used. We&apos;ll prepare a custom offer after reviewing your
            application.
          </p>
        </motion.div>
      </section>

      <AnimatePresence>
        {trialOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[320] flex items-center justify-center bg-[#0D1B2A]/80 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0D1B2A] p-6"
            >
              <h3 className="text-xl font-bold">Start Free Trial</h3>
              <p className="mt-2 text-sm text-white/70">Enter your business email to activate a 7-day trial.</p>
              <PremiumInputField
                type="email"
                label="Business email"
                value={trialEmail}
                onChange={setTrialEmail}
                className="mt-4 pt-4"
                placeholder="name@agency.no"
              />
              <div className="mt-3">
                <PremiumChoiceCard
                  type="checkbox"
                  selected={trialTc}
                  onClick={() => setTrialTc((prev) => !prev)}
                  title="I accept terms and trial conditions."
                />
              </div>
              <button
                type="button"
                onClick={() => void submitTrial()}
                disabled={trialStatus === "loading" || !trialTc || !trialEmail.includes("@")}
                className="mt-4 w-full rounded-xl bg-[#C9A84C] px-5 py-3 font-semibold text-[#0D1B2A] disabled:opacity-60"
              >
                {trialStatus === "loading" ? "Starting..." : "Start Trial"}
              </button>
              {trialMessage ? <p className={`mt-2 text-sm ${trialStatus === "error" ? "text-red-300" : "text-white/70"}`}>{trialMessage}</p> : null}
              <button type="button" onClick={() => setTrialOpen(false)} className="mt-4 w-full text-xs text-white/50 hover:text-white/80">
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <PremiumInputField type={type} label={label} value={value} onChange={onChange} placeholder={placeholder} className="pt-4" />
  );
}
