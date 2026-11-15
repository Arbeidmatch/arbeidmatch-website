"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { townName } from "@/components/rask-foresporsel/ContactStep";
import { SITE_PATHS, type SiteLang } from "@/components/site/siteNav";
import { SupportButton } from "@/components/support/SupportRequest";
import { trackEvent } from "@/lib/analytics";
import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import { CANDIDATE_NEED, EMPLOYER_NEED } from "@/lib/contactNeeds";
import { CONTACT_FORM_COPY, ORIGIN_LABELS, type ContactFormLang } from "@/lib/contactFormCopy";
import { JOBS_PORTAL_URL } from "@/lib/featureFlags";
import { EEA_COUNTRIES, POLICY_REFUSAL, RECRUITER_NETWORK_URL, judgeForeignCompany } from "@/lib/foreignCompany";
import { formatOrgNumber } from "@/lib/orgNumber";

import { AreaRow, Done, Group, Hint, InputRow, LinkRow, NavRow, OptionRow, Segmented } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";

/**
 * "Send melding" (ORDER 295, stage 2): the contact form of /contact as a
 * sheet. Bedrift or Kandidat at the top; a Norwegian company is found in the
 * register and reads Norwegian, a company from another EU/EEA country and a
 * job seeker read English (W1, 6 October 2026). Every field, rule and answer
 * of the form is kept: what is required, the foreign-company rules said
 * before sending, the honeypot and render time, the CV for a job seeker, and
 * the same POST to /api/contact with the same refusals.
 */

type Audience = "employer" | "candidate";
type Origin = "norway" | "foreign";
type Company = { name: string; orgNumber: string; city?: string };
type Sub = { kind: "who" } | { kind: "policy" } | { kind: "error"; title: string; body: string } | { kind: "country" } | null;

const CANDIDATE_OPTIONS = [
  { href: JOBS_PORTAL_URL, label: "Browse open jobs", icon: "brief" as const },
  { href: CANDIDATE_PORTAL_SIGNUP_URL, label: "Create your profile", icon: "user" as const },
  { href: CANDIDATE_PORTAL_LOGIN_URL, label: "Candidate portal", icon: "lock" as const },
  { href: SITE_PATHS.candidates, label: "Information for candidates", icon: "help" as const },
];

const CV_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

export function ContactSheet({ open, close, preset }: SheetProps) {
  const [audience, setAudience] = useState<Audience>(preset.who === "candidate" ? "candidate" : "employer");
  const [origin, setOrigin] = useState<Origin>(preset.origin === "foreign" ? "foreign" : "norway");
  const [sub, setSub] = useState<Sub>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const renderedAt = useRef(0);

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
  const [website, setWebsite] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [company, setCompany] = useState<Company | null>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  const isEmployer = audience === "employer";
  const isForeign = isEmployer && origin === "foreign";
  const lang: ContactFormLang = isEmployer && !isForeign ? "nb" : "en";
  const sheetLang: SiteLang = lang === "nb" ? "no" : "en";
  const copy = CONTACT_FORM_COPY[lang];
  const { suggestions, lookup } = useCompanySearch(companyQuery, isEmployer && !isForeign && !company);

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  const switchTo = (next: Audience) => {
    setSub(null);
    if (next === audience) return;
    setAudience(next);
    setStatus("idle");
    setErrorMessage("");
  };

  const errorSub = (title: string, body: string) => setSub({ kind: "error", title, body });

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (status === "done") return close();
    if (status === "submitting") return;
    // What the form's required fields refused before; said here in the form's language.
    const missing =
      !name.trim() ||
      !email.trim() ||
      !message.trim() ||
      (isForeign && (!foreignName.trim() || !country || !vatNumber.trim() || !phone.trim())) ||
      (!isEmployer && (!phone.trim() || !trade.trim()));
    if (isEmployer && !isForeign && !company) {
      setSub({ kind: "who" });
      return;
    }
    if (missing || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("error");
      setErrorMessage(copy.required);
      return;
    }
    if (isForeign) {
      const verdict = judgeForeignCompany({ country, email, phone, vatNumber });
      if (!verdict.ok && verdict.reason === "phone_unreadable") {
        setStatus("error");
        setErrorMessage(copy.phoneFormat);
        return;
      }
      if (!verdict.ok) {
        setSub({ kind: "policy" });
        return;
      }
    }

    const fields: Record<string, string> = {
      name: name.trim(),
      company: isEmployer ? (isForeign ? foreignName.trim() : company?.name ?? "") : "",
      orgNumber: isEmployer && !isForeign ? company?.orgNumber ?? "" : "",
      email: email.trim(),
      need: isEmployer ? EMPLOYER_NEED : CANDIDATE_NEED,
      lang,
      message: message.trim(),
      website,
      formRenderedAt: String(renderedAt.current),
      ...(isForeign ? { foreign: "1", country, vatNumber: vatNumber.trim(), phone: phone.trim() } : {}),
      ...(!isEmployer ? { phone: phone.trim(), trade: trade.trim() } : {}),
    };

    setStatus("submitting");
    setErrorMessage("");
    try {
      let response: Response;
      if (!isEmployer && cvFile) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.append(k, v);
        fd.append("cv", cvFile);
        response = await fetch("/api/contact", { method: "POST", body: fd });
      } else {
        response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string; refused?: string; code?: string };
        setStatus("idle");
        if (response.status === 422 && data.refused === "policy") return setSub({ kind: "policy" });
        if (data.code === "vies_unreachable") return errorSub(copy.viesTitle, copy.viesBody);
        if (data.error === "Organisation number not found.") {
          return errorSub("Fant ikke firmaet", "Vi fant ikke organisasjonsnummeret i Brønnøysundregistrene. Søk på nytt og velg firmaet fra listen.");
        }
        if (response.status === 429) throw new Error(copy.tooMany);
        if (response.status === 400 && data.error === "Bot detected") throw new Error(copy.bot);
        if (data.code === "phone_format") throw new Error(copy.phoneFormat);
        if (data.code === "cv_type") throw new Error("The CV must be a PDF or Word file.");
        if (data.code === "cv_too_large") throw new Error("The CV can be at most 5 MB.");
        if (response.status === 400) throw new Error(copy.required);
        return errorSub(copy.failedTitle, copy.failed);
      }
      trackEvent("contact_form_submitted", { audience });
      setStatus("done");
    } catch (error) {
      setStatus("error");
      // A network failure throws a browser message in English; only our own messages are shown.
      setErrorMessage(error instanceof Error && error.name === "Error" && error.message ? error.message : copy.generic);
    }
  };

  let subPanel: { title: string; content: ReactNode } | null = null;
  if (sub?.kind === "who") {
    subPanel = {
      title: "Er du jobbsøker eller bedrift?",
      content: (
        <>
          <Hint>Bedrifter skriver til oss med firmaet valgt fra Brønnøysundregistrene. Looking for a job? Choose job seeker.</Hint>
          <Group>
            <NavRow icon="user" label="Jeg er jobbsøker" onClick={() => switchTo("candidate")} />
            <NavRow
              icon="building"
              label="Jeg representerer en bedrift"
              onClick={() => {
                setSub(null);
                window.setTimeout(() => companyInputRef.current?.focus(), 320);
              }}
            />
          </Group>
        </>
      ),
    };
  } else if (sub?.kind === "policy") {
    subPanel = {
      title: copy.policyTitle,
      content: (
        <div className="sh-text">
          <p lang="en">
            {POLICY_REFUSAL.en}{" "}
            <a className="plink" href={RECRUITER_NETWORK_URL}>
              Recruiter network
            </a>
          </p>
          {lang === "nb" ? (
            <p lang="nb">
              {POLICY_REFUSAL.nb}{" "}
              <a className="plink" href={RECRUITER_NETWORK_URL}>
                Recruiter network
              </a>
            </p>
          ) : null}
        </div>
      ),
    };
  } else if (sub?.kind === "error") {
    subPanel = {
      title: sub.title,
      content: (
        <>
          <div className="sh-text">
            <p>{sub.body}</p>
          </div>
          <Group>
            <div className="row">
              <SupportButton lang={lang} className="rl plink" showIcon={false} />
            </div>
          </Group>
        </>
      ),
    };
  } else if (sub?.kind === "country") {
    subPanel = {
      title: copy.country,
      content: (
        <Group>
          {EEA_COUNTRIES.map((c) => (
            <OptionRow
              key={c.code}
              label={c.name}
              chosen={country === c.code}
              onPick={() => {
                setCountry(c.code);
                setSub(null);
              }}
            />
          ))}
        </Group>
      ),
    };
  }

  const countryName = EEA_COUNTRIES.find((c) => c.code === country)?.name ?? copy.countryPlaceholder;

  return (
    <SheetFrame
      open={open}
      lang={sheetLang}
      title={status === "done" ? (lang === "nb" ? "Sendt" : "Sent") : isEmployer && !isForeign ? "Send melding" : "Send a message"}
      sub={subPanel}
      onBack={() => setSub(null)}
      onClose={close}
      footer={
        <>
          {status === "error" && errorMessage ? (
            <p className="sh-err" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button type="button" className="btn gold" onClick={() => void submit()} disabled={status === "submitting"}>
            {status === "done" ? (lang === "nb" ? "Lukk" : "Close") : status === "submitting" ? copy.sending : copy.send}
          </button>
          {status !== "done" ? (
            <p>
              {copy.privacyBefore}
              <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">
                {copy.privacyLink}
              </a>
              {copy.privacyAfter}
            </p>
          ) : null}
        </>
      }
    >
      {status === "done" ? (
        <Done title={lang === "nb" ? "Takk." : "Thank you."} text={copy.thanks} />
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Segmented
            label="Hvem skriver / Who is writing"
            options={[
              { value: "employer", label: copy.employerTab },
              { value: "candidate", label: "Candidate" },
            ]}
            value={audience}
            onChange={switchTo}
          />
          {isEmployer ? (
            <Segmented
              label={copy.originGroupLabel}
              options={[
                { value: "norway", label: ORIGIN_LABELS.norway },
                { value: "foreign", label: "EU/EEA company" },
              ]}
              value={origin}
              onChange={(v) => setOrigin(v)}
            />
          ) : (
            <Group label="Before you write">
              {CANDIDATE_OPTIONS.map((o) => (
                <LinkRow key={o.label} href={o.href} icon={o.icon} label={o.label} onNavigate={close} />
              ))}
            </Group>
          )}
          <Group>
            <InputRow id="am-ct-name" icon="user" label={copy.name} placeholder={copy.namePlaceholder} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            {isEmployer && !isForeign ? (
              company ? (
                <div className="row firm">
                  <span className="rl">
                    <b>{company.name}</b>
                    <small>
                      Org.nr. {formatOrgNumber(company.orgNumber)}
                      {company.city ? `, ${townName(company.city)}` : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="plink"
                    onClick={() => {
                      setCompany(null);
                      setCompanyQuery("");
                      requestAnimationFrame(() => companyInputRef.current?.focus());
                    }}
                  >
                    Endre
                  </button>
                </div>
              ) : (
                <>
                  <InputRow
                    ref={companyInputRef}
                    id="am-ct-company"
                    icon="brief"
                    label={copy.companyField}
                    placeholder="Firmanavn eller org.nr."
                    autoComplete="organization"
                    value={companyQuery}
                    onChange={(e) => setCompanyQuery(e.target.value)}
                  />
                  {suggestions.map((c) => (
                    <button
                      key={c.orgNumber}
                      type="button"
                      className="row hit"
                      onClick={() => {
                        setCompany(c);
                        setCompanyQuery(c.name);
                      }}
                    >
                      <span className="rl">
                        <b>{c.name}</b>
                        <small>
                          {formatOrgNumber(c.orgNumber)}
                          {c.city ? `, ${townName(c.city)}` : ""}
                        </small>
                      </span>
                    </button>
                  ))}
                </>
              )
            ) : null}
            {isForeign ? (
              <>
                <InputRow id="am-ct-fname" icon="brief" label={copy.companyName} placeholder={copy.companyNamePlaceholder} value={foreignName} onChange={(e) => setForeignName(e.target.value)} required />
                <NavRow icon="flag" label={copy.country} value={countryName} onClick={() => setSub({ kind: "country" })} />
                <InputRow id="am-ct-vat" icon="file" label={copy.vat} placeholder={copy.vatPlaceholder} value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} required />
              </>
            ) : null}
            <InputRow
              id="am-ct-email"
              icon="mail"
              label={copy.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={isEmployer ? copy.emailPlaceholder : "name@example.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {isForeign || !isEmployer ? (
              <InputRow
                id="am-ct-phone"
                icon="phone"
                label={copy.phone}
                type="tel"
                autoComplete="tel"
                placeholder={isEmployer ? copy.phonePlaceholder : "+47 400 00 000"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            ) : null}
            {!isEmployer ? (
              <InputRow id="am-ct-trade" icon="wrench" label="Trade" placeholder="Electrician, carpenter, welder…" value={trade} onChange={(e) => setTrade(e.target.value)} required />
            ) : null}
          </Group>
          {isEmployer && !isForeign && !company && lookup === "loading" ? <Hint>Søker i Brønnøysundregistrene ...</Hint> : null}
          {isEmployer && !isForeign && !company && lookup === "error" ? <Hint>Søket svarer ikke akkurat nå. Prøv igjen om litt.</Hint> : null}
          {!isEmployer ? (
            <Group>
              <label className="row" htmlFor="am-ct-cv">
                <span className="rl">CV (optional, PDF or Word, max 5 MB)</span>
                <span className="rv">{cvFile ? cvFile.name : "Choose file"}</span>
                <input id="am-ct-cv" type="file" accept={CV_ACCEPT} className="sr-only" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
              </label>
            </Group>
          ) : null}
          <Group>
            <AreaRow id="am-ct-message" label={copy.message} placeholder={copy.messagePlaceholder} value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} />
          </Group>
          <div className="hp" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
        </form>
      )}
    </SheetFrame>
  );
}
