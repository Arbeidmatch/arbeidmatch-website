"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, LogIn, Mail, MapPin, Search, Shield, UserPlus, Users } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

import ScrollReveal from "@/components/ScrollReveal";
import { trackEvent } from "@/lib/analytics";
import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import { CANDIDATE_NEED, EMPLOYER_NEED } from "@/lib/contactNeeds";
import { JOBS_PORTAL_URL } from "@/lib/featureFlags";
import { formatOrgNumber } from "@/lib/orgNumber";

const inputClass =
  "w-full rounded-lg border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[15px] text-white placeholder:text-white/55 focus:border-[#C9A84C] focus:outline-none";
const labelClass = "block text-[13px] font-medium text-[rgba(255,255,255,0.65)]";
const submitClass =
  "mt-6 w-full rounded-lg bg-[#C9A84C] py-3.5 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:opacity-60";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const needsTurnstile = Boolean(TURNSTILE_SITE_KEY);

// Split so the address never appears as a plain string in the page source - stops basic
// regex/HTML scrapers. Not shown (or made a mailto: link) until the visitor clicks reveal.
const EMAIL_USER = "support";
const EMAIL_DOMAIN = "arbeidmatch.no";

type Audience = "employer" | "candidate";
type Company = { name: string; orgNumber: string };

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
    orgRequired: "Velg bedriften fra Brønnøysundregistrene.",
    orgMissing: "Vi fant ikke organisasjonsnummeret i Brønnøysundregistrene.",
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
    orgRequired: "Please fill in all required fields.",
    orgMissing: "Please fill in all required fields.",
    failed: "We could not send your message. Please try again later.",
    sending: "Sending…",
    send: "Send message",
    thanks: "Thank you! We will get back to you soon.",
  },
} as const;

/** The contact API answers in English; each form prints its own words by status. */
function errorMessageFor(audience: Audience, status: number, serverError: string | undefined): string {
  const copy = COPY[audience];
  if (status === 429) return copy.tooMany;
  if (status === 400 && serverError === "Bot detected") return copy.bot;
  if (status === 400 && serverError === "Organisation number required.") return copy.orgRequired;
  if (status === 400 && serverError === "Organisation number not found.") return copy.orgMissing;
  if (status === 400) return copy.required;
  return copy.failed;
}

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
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [emailRevealed, setEmailRevealed] = useState(false);

  const [companyQuery, setCompanyQuery] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const [askCandidate, setAskCandidate] = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const { suggestions, lookup } = useCompanySearch(companyQuery, audience === "employer" && !company);

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
    if (next === audience) return;
    setAudience(next);
    setAskCandidate(false);
    resetFeedback();
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  };

  const pickCompany = (picked: Company) => {
    setCompany(picked);
    setCompanyQuery(picked.name);
    setAskCandidate(false);
  };

  const clearCompany = () => {
    setCompany(null);
    setCompanyQuery("");
    window.requestAnimationFrame(() => companyInputRef.current?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    // No company picked from Brreg: perhaps this is a candidate at the wrong door.
    if (audience === "employer" && !company) {
      setAskCandidate(true);
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      company: audience === "employer" ? company?.name ?? "" : "",
      orgNumber: audience === "employer" ? company?.orgNumber ?? "" : "",
      email: String(formData.get("email") || "").trim(),
      need: audience === "employer" ? EMPLOYER_NEED : CANDIDATE_NEED,
      message: String(formData.get("message") || "").trim(),
      website: String(formData.get("website") || ""),
      turnstileToken: turnstileToken ?? "",
    };

    setStatus("submitting");
    setErrorMessage("");
    setSubmitted(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorMessageFor(audience, response.status, data.error));
      }
      setSubmitted(true);
      trackEvent("contact_form_submitted", { audience });
      form.reset();
      if (audience === "employer") {
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
  const isEmployer = audience === "employer";

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-semibold transition-colors ${
      active ? "bg-[#C9A84C] text-[#0D1B2A]" : "text-white/70 hover:text-white"
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
              ) : null}

              <form
                key={audience}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8"
              >
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
                      className={`${inputClass} mt-1.5`}
                      placeholder={isEmployer ? "Fullt navn" : "Full name"}
                    />
                  </label>

                  {isEmployer ? (
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
                          <button type="button" onClick={clearCompany} className="shrink-0 text-[13px] font-semibold text-[#C9A84C] hover:underline">
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
                            onChange={(e) => {
                              setCompanyQuery(e.target.value);
                              setAskCandidate(false);
                            }}
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
                                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[14px] text-white hover:bg-[rgba(201,168,76,0.1)]"
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
                                  : "Velg bedriften fra Brønnøysundregistrene."}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <label className={labelClass}>
                    {isEmployer ? "E-post" : "Email"} <span className="text-[#C9A84C]">*</span>
                    <input
                      required
                      name="email"
                      type="email"
                      autoComplete="email"
                      className={`${inputClass} mt-1.5`}
                      placeholder={isEmployer ? "navn@firma.no" : "name@example.com"}
                    />
                  </label>
                  <label className={labelClass}>
                    {isEmployer ? "Melding" : "Message"} <span className="text-[#C9A84C]">*</span>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      className={`${inputClass} mt-1.5 min-h-[120px] resize-y`}
                      placeholder={isEmployer ? "Hva kan vi hjelpe dere med?" : "How can we help you?"}
                    />
                  </label>
                </div>

                {askCandidate ? (
                  <div role="alert" className="mt-5 rounded-lg border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)] px-4 py-4">
                    <p className="text-[14px] font-semibold text-white">Er du kandidat eller jobbsøker?</p>
                    <p className="mt-1 text-[13px] text-white/65">
                      Bedrifter skriver til oss med organisasjonsnummeret. Looking for a job? Choose candidate.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => switchTo("candidate")}
                        className="rounded-lg bg-[#C9A84C] px-4 py-2.5 text-[14px] font-semibold text-[#0D1B2A] hover:bg-[#b8953f]"
                      >
                        Ja, I am a candidate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAskCandidate(false);
                          companyInputRef.current?.focus();
                        }}
                        className="rounded-lg border border-[rgba(201,168,76,0.35)] px-4 py-2.5 text-[14px] font-semibold text-white hover:border-[#C9A84C]"
                      >
                        Nei, jeg søker opp bedriften
                      </button>
                    </div>
                  </div>
                ) : null}

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
    </section>
  );
}
