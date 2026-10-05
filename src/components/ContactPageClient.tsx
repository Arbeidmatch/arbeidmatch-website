"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, LogIn, Mail, MapPin, Search, Shield, UserPlus, Users } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import ScrollReveal from "@/components/ScrollReveal";
import { ContactPopup } from "@/components/contact/ContactPopup";
import { trackEvent } from "@/lib/analytics";
import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import { CANDIDATE_NEED, EMPLOYER_NEED } from "@/lib/contactNeeds";
import { JOBS_PORTAL_URL } from "@/lib/featureFlags";
import { EEA_COUNTRIES, POLICY_REFUSAL, RECRUITER_NETWORK_URL, judgeForeignCompany } from "@/lib/foreignCompany";
import { formatOrgNumber } from "@/lib/orgNumber";

const inputClass =
  "w-full rounded-lg border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[15px] text-white placeholder:text-white/55 focus:border-[#C9A84C] focus:outline-none";
const labelClass = "block text-[13px] font-medium text-[rgba(255,255,255,0.65)]";
const submitClass =
  "mt-6 w-full rounded-lg bg-[#C9A84C] py-3.5 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:opacity-60";
const popupButton = "min-h-11 rounded-lg px-4 py-2.5 text-[14px] font-semibold";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const needsTurnstile = Boolean(TURNSTILE_SITE_KEY);

// Split so the address never appears as a plain string in the page source - stops basic
// regex/HTML scrapers. Not shown (or made a mailto: link) until the visitor clicks reveal.
const EMAIL_USER = "support";
const EMAIL_DOMAIN = "arbeidmatch.no";

type Audience = "employer" | "candidate";
type CompanyOrigin = "norway" | "foreign";
type Company = { name: string; orgNumber: string };

/** What the popup says now (ORDER 44): every refusal and redirection is a popup, never a mail. */
type Popup =
  | { kind: "who" }
  | { kind: "policy" }
  | { kind: "error"; title: string; body: string; context: string };

/**
 * Two doors, his decision of 28 September 2026: a client writes with the
 * company's organisation number, found in Brreg; a candidate is shown the
 * candidate's ways in first, and can still write. The employer copy is
 * Norwegian like the rest of the page; the candidate copy is English, because
 * the candidates come from across the EU/EEA.
 */
const COPY = {
  employer: {
    generic: "Noe gikk galt. Prøv igjen.",
    tooMany: "For mange forespørsler. Prøv igjen litt senere.",
    bot: "Sikkerhetskontrollen ble ikke godkjent. Prøv igjen.",
    required: "Fyll ut alle obligatoriske felt.",
    phoneFormat: "Skriv telefonnummeret med landskode, for eksempel +49 …",
    failed: "Vi kunne ikke sende meldingen. Prøv igjen senere.",
    sending: "Sender…",
    send: "Send melding",
    thanks: "Takk! Vi tar kontakt med dere snart.",
  },
  candidate: {
    generic: "Something went wrong. Please try again.",
    tooMany: "Too many requests. Please try again a little later.",
    bot: "The security check did not pass. Please try again.",
    required: "Please fill in all required fields.",
    phoneFormat: "Please fill in all required fields.",
    failed: "We could not send your message. Please try again later.",
    sending: "Sending…",
    send: "Send message",
    thanks: "Thank you! We will get back to you soon.",
  },
} as const;

const CANDIDATE_OPTIONS = [
  { href: JOBS_PORTAL_URL, label: "Browse open jobs", hint: "See the positions we are hiring for now.", Icon: Briefcase },
  { href: CANDIDATE_PORTAL_SIGNUP_URL, label: "Create your profile", hint: "Register once and apply faster.", Icon: UserPlus },
  { href: CANDIDATE_PORTAL_LOGIN_URL, label: "Candidate portal", hint: "Sign in to your applications and documents.", Icon: LogIn },
  { href: "/for-candidates", label: "Information for candidates", hint: "How working in Norway with us works.", Icon: Users },
] as const;

function useCompanySearch(query: string, active: boolean) {
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [lookup, setLookup] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!active || query.trim().length < 2) {
      setSuggestions([]);
      setLookup("idle");
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLookup("loading");
      try {
        const response = await fetch(`/api/brreg/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = (await response.json()) as { success?: boolean; companies?: Company[] };
        if (!response.ok || !data.success) throw new Error("lookup failed");
        setSuggestions((data.companies ?? []).filter((c) => c.name && c.orgNumber));
        setLookup("idle");
      } catch {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setLookup("error");
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, active]);

  return { suggestions, lookup };
}

export default function ContactPageClient() {
  const [audience, setAudience] = useState<Audience>("employer");
  const [origin, setOrigin] = useState<CompanyOrigin>("norway");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);

  // Kept across a change of door, so the words the visitor wrote are not lost (ORDER 44).
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [foreignName, setForeignName] = useState("");
  const [country, setCountry] = useState("");
  const [vatNumber, setVatNumber] = useState("");

  const [companyQuery, setCompanyQuery] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const isEmployer = audience === "employer";
  const isForeign = isEmployer && origin === "foreign";
  const { suggestions, lookup } = useCompanySearch(companyQuery, isEmployer && !isForeign && !company);

  // /contact?for=candidate opens on the candidate's side.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("for") === "candidate") setAudience("candidate");
  }, []);

  const onTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const resetFeedback = () => {
    setSubmitted(false);
    setStatus("idle");
    setErrorMessage("");
  };

  const switchTo = (next: Audience) => {
    setPopup(null);
    if (next === audience) return;
    setAudience(next);
    resetFeedback();
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  };

  const pickCompany = (picked: Company) => {
    setCompany(picked);
    setCompanyQuery(picked.name);
  };

  const clearCompany = () => {
    setCompany(null);
    setCompanyQuery("");
    window.requestAnimationFrame(() => companyInputRef.current?.focus());
  };

  const errorPopup = (title: string, body: string, context: string) => setPopup({ kind: "error", title, body, context });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    // No company picked from Brreg: ask who is writing (ORDER 44).
    if (isEmployer && !isForeign && !company) {
      setPopup({ kind: "who" });
      return;
    }
    // The rules a foreign company is held to, said before anything is sent.
    if (isForeign) {
      const verdict = judgeForeignCompany({ country, email, phone, vatNumber });
      if (!verdict.ok && verdict.reason === "phone_unreadable") {
        setStatus("error");
        setErrorMessage(COPY.employer.phoneFormat);
        return;
      }
      if (!verdict.ok) {
        setPopup({ kind: "policy" });
        return;
      }
    }

    const fields: Record<string, string> = {
      name: name.trim(),
      company: isEmployer ? (isForeign ? foreignName.trim() : company?.name ?? "") : "",
      orgNumber: isEmployer && !isForeign ? company?.orgNumber ?? "" : "",
      email: email.trim(),
      need: isEmployer ? EMPLOYER_NEED : CANDIDATE_NEED,
      message: message.trim(),
      website: String(new FormData(form).get("website") || ""),
      turnstileToken: turnstileToken ?? "",
      ...(isForeign ? { foreign: "1", country, vatNumber: vatNumber.trim(), phone: phone.trim() } : {}),
      ...(!isEmployer ? { phone: phone.trim(), trade: trade.trim() } : {}),
    };

    setStatus("submitting");
    setErrorMessage("");
    setSubmitted(false);

    try {
      let response: Response;
      if (!isEmployer && cvFile) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.append(k, v);
        fd.append("cv", cvFile);
        response = await fetch("/api/contact", { method: "POST", body: fd });
      } else {
        response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string; refused?: string; code?: string };
        setStatus("idle");
        setTurnstileToken(null);
        setTurnstileKey((k) => k + 1);
        if (response.status === 422 && data.refused === "policy") {
          setPopup({ kind: "policy" });
          return;
        }
        if (data.code === "vies_unreachable") {
          errorPopup(
            "MVA-registeret svarer ikke",
            "EU-registeret VIES svarer ikke akkurat nå, så vi kunne ikke bekrefte MVA-nummeret. Prøv igjen om litt. / The EU VAT register (VIES) is not answering right now. Please try again shortly.",
            "VIES unreachable on the foreign company form.",
          );
          return;
        }
        if (data.error === "Organisation number not found.") {
          errorPopup(
            "Fant ikke firmaet",
            "Vi fant ikke organisasjonsnummeret i Brønnøysundregistrene. Søk på nytt og velg firmaet fra listen.",
            "Brreg did not find the organisation number on submit.",
          );
          return;
        }
        if (response.status === 429) throw new Error(COPY[audience].tooMany);
        if (response.status === 400 && data.error === "Bot detected") throw new Error(COPY[audience].bot);
        if (data.code === "phone_format") throw new Error(COPY.employer.phoneFormat);
        if (data.code === "cv_type") throw new Error("The CV must be a PDF or Word file.");
        if (data.code === "cv_too_large") throw new Error("The CV can be at most 5 MB.");
        if (response.status === 400) throw new Error(COPY[audience].required);
        errorPopup(
          isEmployer ? "Meldingen ble ikke sendt" : "Your message was not sent",
          COPY[audience].failed,
          `Contact form submit failed with status ${response.status}.`,
        );
        return;
      }
      setSubmitted(true);
      trackEvent("contact_form_submitted", { audience });
      form.reset();
      setMessage("");
      setCvFile(null);
      if (isEmployer) {
        setCompany(null);
        setCompanyQuery("");
      }
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    } catch (error) {
      setSubmitted(false);
      setStatus("error");
      // A network failure throws a browser message in English; only our own messages are shown.
      setErrorMessage(error instanceof Error && error.name === "Error" && error.message ? error.message : COPY[audience].generic);
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      return;
    }

    setStatus("idle");
  };

  const copy = COPY[audience];

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors ${
      active ? "bg-[#C9A84C] text-[#0D1B2A]" : "text-white/70 hover:text-white"
    }`;
  const originClass = (active: boolean) =>
    `min-h-11 flex-1 rounded-lg border px-3 text-[13px] font-semibold ${
      active ? "border-[#C9A84C] text-[#C9A84C]" : "border-[rgba(201,168,76,0.2)] text-white/65 hover:text-white"
    }`;

  return (
    <section className="bg-[#0D1B2A] py-14 text-white md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <ScrollReveal variant="fadeUp">
          <header className="max-w-3xl">
            <h1 className="am-h1 font-display font-extrabold tracking-[-0.03em] text-white">Ta kontakt</h1>
            <p className="mt-4 text-base leading-relaxed text-[rgba(255,255,255,0.65)] md:text-lg">
              Har dere spørsmål, eller er dere klare til å finne arbeidskraft til bedriften? Vi svarer innen én virkedag.
            </p>
          </header>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal variant="fadeUp">
            <div>
              <div
                role="tablist"
                aria-label="Hvem skriver / Who is writing"
                className="mb-6 flex gap-1 rounded-xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-1"
              >
                <button type="button" role="tab" aria-selected={isEmployer} onClick={() => switchTo("employer")} className={tabClass(isEmployer)}>
                  <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Bedrift
                </button>
                <button type="button" role="tab" aria-selected={!isEmployer} onClick={() => switchTo("candidate")} className={tabClass(!isEmployer)}>
                  <Users className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Candidate
                </button>
              </div>

              {!isEmployer ? (
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CANDIDATE_OPTIONS.map(({ href, label, hint, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      className="group flex items-start gap-3 rounded-xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:border-[#C9A84C]"
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-[14px] font-semibold text-white">
                          {label}
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                        <span className="mt-1 block text-[12px] leading-snug text-white/60">{hint}</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mb-4 flex gap-2" role="group" aria-label="Hvor er bedriften registrert?">
                  <button type="button" aria-pressed={origin === "norway"} onClick={() => setOrigin("norway")} className={originClass(origin === "norway")}>
                    Norsk bedrift
                  </button>
                  <button type="button" aria-pressed={origin === "foreign"} onClick={() => setOrigin("foreign")} className={originClass(origin === "foreign")}>
                    Bedrift i et annet EU/EØS-land
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                {!isEmployer ? (
                  <p className="mb-4 text-[14px] font-semibold text-white">Still have a question? Write to us.</p>
                ) : null}
                <div className="space-y-4">
                  <label className={labelClass}>
                    {isEmployer ? "Navn" : "Name"} <span className="text-[#C9A84C]">*</span>
                    <input
                      required
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`${inputClass} mt-1.5`}
                      placeholder={isEmployer ? "Fullt navn" : "Full name"}
                    />
                  </label>

                  {isEmployer && !isForeign ? (
                    <div className={labelClass}>
                      <label htmlFor="contact-company">
                        Bedrift <span className="text-[#C9A84C]">*</span>
                      </label>
                      {company ? (
                        <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-[#C9A84C]/60 bg-[rgba(201,168,76,0.08)] px-4 py-3">
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] text-white">{company.name}</span>
                            <span className="block text-[12px] text-white/60">Org.nr {formatOrgNumber(company.orgNumber)}</span>
                          </span>
                          <button type="button" onClick={clearCompany} className="min-h-11 shrink-0 text-[13px] font-semibold text-[#C9A84C] hover:underline">
                            Endre
                          </button>
                        </div>
                      ) : (
                        <div className="relative mt-1.5">
                          <Search className="pointer-events-none absolute left-4 top-[25px] h-4 w-4 -translate-y-1/2 text-white/45" aria-hidden />
                          <input
                            id="contact-company"
                            ref={companyInputRef}
                            type="text"
                            autoComplete="off"
                            value={companyQuery}
                            onChange={(e) => setCompanyQuery(e.target.value)}
                            className={`${inputClass} pl-10`}
                            placeholder="Søk på firmanavn eller org.nr"
                            aria-describedby="contact-company-hint"
                          />
                          {suggestions.length > 0 ? (
                            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[rgba(201,168,76,0.25)] bg-[#0D1B2A] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                              {suggestions.map((s) => (
                                <li key={s.orgNumber}>
                                  <button
                                    type="button"
                                    onClick={() => pickCompany(s)}
                                    className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] text-white hover:bg-[rgba(201,168,76,0.1)]"
                                  >
                                    <span className="min-w-0 truncate">{s.name}</span>
                                    <span className="shrink-0 text-[12px] text-white/55">{formatOrgNumber(s.orgNumber)}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <p id="contact-company-hint" className="mt-1.5 text-[12px] font-normal text-white/50">
                            {lookup === "loading"
                              ? "Søker i Brønnøysundregistrene…"
                              : lookup === "error"
                                ? "Søket svarer ikke akkurat nå. Prøv igjen om litt."
                                : companyQuery.trim().length >= 2 && suggestions.length === 0
                                  ? "Ingen treff i Brønnøysundregistrene."
                                  : "Velg bedriften fra Brønnøysundregistrene."}{" "}
                            <button type="button" onClick={() => setPopup({ kind: "who" })} className="font-semibold text-[#C9A84C] hover:underline">
                              Fant ikke firmaet?
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {isForeign ? (
                    <>
                      <label className={labelClass}>
                        Bedriftens navn <span className="text-[#C9A84C]">*</span>
                        <input required type="text" value={foreignName} onChange={(e) => setForeignName(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Company name" />
                      </label>
                      <label className={labelClass}>
                        Land <span className="text-[#C9A84C]">*</span>
                        <select required value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} mt-1.5`}>
                          <option value="">Velg land / Choose country</option>
                          {EEA_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={labelClass}>
                        MVA-nummer (EU VAT) <span className="text-[#C9A84C]">*</span>
                        <input required type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="DE123456789" />
                      </label>
                    </>
                  ) : null}

                  <label className={labelClass}>
                    {isEmployer ? "E-post" : "Email"} <span className="text-[#C9A84C]">*</span>
                    <input
                      required
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} mt-1.5`}
                      placeholder={isEmployer ? "navn@firma.no" : "name@example.com"}
                    />
                  </label>

                  {isForeign || !isEmployer ? (
                    <label className={labelClass}>
                      {isEmployer ? "Telefon" : "Phone"} <span className="text-[#C9A84C]">*</span>
                      <input
                        required
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${inputClass} mt-1.5`}
                        placeholder="+47 400 00 000"
                      />
                    </label>
                  ) : null}

                  {!isEmployer ? (
                    <>
                      <label className={labelClass}>
                        Trade <span className="text-[#C9A84C]">*</span>
                        <input required type="text" value={trade} onChange={(e) => setTrade(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Electrician, carpenter, welder…" />
                      </label>
                      <label className={labelClass}>
                        CV (optional, PDF or Word, max 5 MB)
                        <input
                          ref={cvInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                          className="mt-1.5 block w-full text-[14px] text-white/80 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-[rgba(201,168,76,0.15)] file:px-4 file:text-[#C9A84C]"
                        />
                      </label>
                    </>
                  ) : null}

                  <label className={labelClass}>
                    {isEmployer ? "Melding" : "Message"} <span className="text-[#C9A84C]">*</span>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`${inputClass} mt-1.5 min-h-[120px] resize-y`}
                      placeholder={isEmployer ? "Hva kan vi hjelpe dere med?" : "How can we help you?"}
                    />
                  </label>
                </div>

                {needsTurnstile ? (
                  <div className="mt-4 flex justify-center">
                    <Turnstile
                      key={turnstileKey}
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={onTurnstileSuccess}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => setTurnstileToken(null)}
                    />
                  </div>
                ) : null}

                <button type="submit" disabled={status === "submitting" || (needsTurnstile && !turnstileToken)} className={submitClass}>
                  {status === "submitting" ? copy.sending : copy.send}
                </button>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-white/60">
                  {isEmployer ? "Les hvordan vi behandler opplysningene deres i " : "Read how we handle your information in our "}
                  <Link href="/privacy" className="text-[#C9A84C] underline-offset-2 hover:underline">
                    {isEmployer ? "personvernerklæringen" : "privacy notice"}
                  </Link>
                  {isEmployer ? " vår." : "."}
                </p>

                {submitted ? (
                  <p className="mt-5 rounded-lg border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] px-4 py-3 text-center text-sm text-[rgba(255,255,255,0.9)]" role="status">
                    {copy.thanks}
                  </p>
                ) : null}
                {status === "error" ? (
                  <p className="mt-5 rounded-lg border border-[rgba(226,75,74,0.45)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-center text-sm text-[#f0a8a8]" role="alert">
                    {errorMessage}
                  </p>
                ) : null}
              </form>

              <div className="mt-8 flex flex-col gap-3 rounded-xl border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)]">
                  <Shield className="h-4 w-4 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                  <span>Org.nr: 935 667 089 MVA</span>
                </p>
                <p className="text-sm text-[rgba(255,255,255,0.5)]">Registrert i Norge</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp">
            <aside className="space-y-8 lg:pl-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">E-post</p>
                {emailRevealed ? (
                  <a
                    href={`mailto:${EMAIL_USER}@${EMAIL_DOMAIN}`}
                    className="mt-2 inline-flex items-center gap-2 text-lg font-medium text-[#C9A84C] transition-colors hover:text-[#d8bc6a]"
                  >
                    <Mail className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                    {EMAIL_USER}@{EMAIL_DOMAIN}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEmailRevealed(true)}
                    className="mt-2 inline-flex items-center gap-2 text-lg font-medium text-[#C9A84C] transition-colors hover:text-[#d8bc6a]"
                  >
                    <Mail className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                    Vis e-postadressen
                  </button>
                )}
              </div>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Adresse</p>
                <p className="mt-2 flex items-start gap-2 text-[15px] leading-relaxed text-[rgba(255,255,255,0.55)]">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                  <span>Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norge</span>
                </p>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
                <p className="text-[15px] text-[rgba(255,255,255,0.55)]">Vi holder til i Trondheim</p>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>

      {popup?.kind === "who" ? (
        <ContactPopup title="Er du jobbsøker eller bedrift?" onClose={() => setPopup(null)}>
          <p>Bedrifter skriver til oss med firmaet valgt fra Brønnøysundregistrene. Looking for a job? Choose job seeker.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => switchTo("candidate")} className={`${popupButton} bg-[#C9A84C] text-[#0D1B2A] hover:bg-[#b8953f]`}>
              Jeg er jobbsøker
            </button>
            <button
              type="button"
              onClick={() => {
                setPopup(null);
                window.requestAnimationFrame(() => companyInputRef.current?.focus());
              }}
              className={`${popupButton} border border-[rgba(201,168,76,0.35)] text-white hover:border-[#C9A84C]`}
            >
              Jeg representerer en bedrift
            </button>
          </div>
        </ContactPopup>
      ) : null}

      {popup?.kind === "policy" ? (
        <ContactPopup title="Vi kan ikke ta imot denne henvendelsen / We cannot take this request" onClose={() => setPopup(null)}>
          <p>
            {POLICY_REFUSAL.en}{" "}
            <a href={RECRUITER_NETWORK_URL} className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
              Recruiter network
            </a>
          </p>
          <p className="text-white/65">
            {POLICY_REFUSAL.nb}{" "}
            <a href={RECRUITER_NETWORK_URL} className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
              Rekrutterernettverk
            </a>
          </p>
        </ContactPopup>
      ) : null}

      {popup?.kind === "error" ? (
        <ContactPopup title={popup.title} onClose={() => setPopup(null)} flagContext={popup.context} replyEmail={email}>
          <p>{popup.body}</p>
        </ContactPopup>
      ) : null}
    </section>
  );
}
