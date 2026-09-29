"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "@/components/prosjekter/portal.module.css";
import { checkAccessCode, checkAccessRequest, type AccessField } from "@/lib/prosjekter/access";
import { domainChoices, regionChoices } from "@/lib/prosjekter/format";

/**
 * "Be om tilgang": a firm asks for the whole picture in its counties and
 * trades. The body of the access dialog (see PortalDialogs): it opens over any
 * page from a link to #tilgang.
 *
 * The owner's rules, 29 September 2026:
 *   - the company is looked up in the register, by name or by organisation
 *     number, and picked from the list, so its number and name are the
 *     register's and not typed;
 *   - the person gives their name and their role in the company, and confirms
 *     that their contact details are on the company's website, which we check
 *     before access is given;
 *   - an address we do not already hold confirms itself with a six-digit code
 *     sent to it, typed here in a second step. The ATS decides which; the
 *     request reaches the owner only once the address is confirmed.
 */

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Company = { name: string; orgNumber: string; city?: string };

const spacedOrg = (v: string) => v.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
// The register writes towns in capitals ("MO I RANA"); read as "Mo i Rana".
const town = (v: string) =>
  v
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && w === "i" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

export default function AccessForm({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Company[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [honey, setHoney] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<AccessField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeStep, setCodeStep] = useState<{ requestId: string } | null>(null);
  const [code, setCode] = useState("");
  const [codeNote, setCodeNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const refs = {
    company: useRef<HTMLInputElement>(null),
    contact_name: useRef<HTMLInputElement>(null),
    contact_role: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    website_confirmed: useRef<HTMLInputElement>(null),
  };
  const codeRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // The register, asked as the visitor types: by name, or by number when it is nine digits.
  useEffect(() => {
    if (company) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/brreg/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = (await res.json().catch(() => ({}))) as { companies?: Company[] };
        setHits(Array.isArray(body.companies) ? body.companies.filter((c) => c.name && c.orgNumber) : []);
      } catch {
        if (!ctrl.signal.aborted) setHits([]);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, company]);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const clearError = (f: AccessField) => setErrors((o) => (o[f] ? { ...o, [f]: undefined } : o));

  const pick = (c: Company) => {
    setCompany(c);
    setHits(null);
    clearError("company");
    requestAnimationFrame(() => refs.contact_name.current?.focus());
  };

  const finish = () => {
    setDone(true);
    requestAnimationFrame(() => doneRef.current?.focus());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const checked = checkAccessRequest({
      company: company?.name ?? "",
      orgnr: company?.orgNumber ?? "",
      contact_name: name,
      contact_role: role,
      email,
      phone,
      regions,
      domains,
      website_confirmed: confirmed,
    });
    if (!checked.ok) {
      setErrors({ [checked.field]: checked.error });
      const r = refs[checked.field as keyof typeof refs];
      r?.current?.focus();
      if (!r) setFormError(checked.error);
      return;
    }
    setErrors({});
    if (TURNSTILE_SITE_KEY && !token) {
      setFormError("Bekreft at du ikke er en robot, og prøv igjen.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...checked.value, turnstileToken: token ?? "", website: honey }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        needsCode?: boolean;
        requestId?: string;
        error?: string;
        field?: AccessField;
      };
      if (!res.ok || payload.ok !== true) {
        if (payload.field) setErrors({ [payload.field]: payload.error ?? "Sjekk feltet." });
        setFormError(payload.error ?? "Forespørselen kunne ikke sendes. Prøv igjen om litt.");
        setToken(null);
        setTurnstileKey((n) => n + 1);
        return;
      }
      if (payload.needsCode && payload.requestId) {
        setCodeStep({ requestId: payload.requestId });
        setCode("");
        setCodeNote(null);
        requestAnimationFrame(() => codeRef.current?.focus());
        return;
      }
      finish();
    } catch {
      setFormError("Forespørselen kunne ikke sendes. Prøv igjen om litt.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeStep) return;
    setFormError(null);
    setCodeNote(null);
    const c = checkAccessCode(code);
    if (!c.ok) {
      setFormError(c.error);
      codeRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/access/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: codeStep.requestId, code: c.code }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || payload.ok !== true) {
        setFormError(payload.error ?? "Koden kunne ikke sjekkes. Prøv igjen.");
        codeRef.current?.focus();
        return;
      }
      finish();
    } catch {
      setFormError("Koden kunne ikke sjekkes. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!codeStep) return;
    setFormError(null);
    setCodeNote(null);
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/access/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: codeStep.requestId }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || payload.ok !== true) setFormError(payload.error ?? "Koden kunne ikke sendes. Prøv igjen om litt.");
      else setCodeNote(`Vi har sendt en ny kode til ${email.trim().toLowerCase()}.`);
    } catch {
      setFormError("Koden kunne ikke sendes. Prøv igjen om litt.");
    } finally {
      setBusy(false);
    }
  };

  const fieldProps = (f: AccessField) => ({
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? `pa-e-${f}` : undefined,
  });
  const fieldError = (f: AccessField) =>
    errors[f] ? (
      <span className={styles.err} id={`pa-e-${f}`}>
        {errors[f]}
      </span>
    ) : null;
  const errorBox = formError ? (
    <p className={styles.formError} id="pa-form-error" role="alert">
      {formError}
    </p>
  ) : null;

  if (done) {
    return (
      <div className={styles.modalForm}>
        <div className={styles.done} ref={doneRef} tabIndex={-1} role="status">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="10" fill="none" stroke="#3fa87b" strokeWidth="1.5" />
            <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="#3fa87b" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div>
            <h3>Takk, {company?.name}.</h3>
            <p>
              Vi har fått forespørselen og går gjennom den. Du får en personlig lenke på {email.trim().toLowerCase()} når
              tilgangen er klar.
            </p>
          </div>
        </div>
        <div>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    );
  }

  if (codeStep) {
    return (
      <form className={styles.modalForm} onSubmit={verify} noValidate aria-describedby={formError ? "pa-form-error" : undefined}>
        <p className={styles.modalLede} style={{ margin: 0 }}>
          Vi har sendt en kode på 6 siffer til <strong>{email.trim().toLowerCase()}</strong>. Skriv den inn her for å
          bekrefte e-postadressen. Koden virker i 10 minutter.
        </p>
        <div className={styles.field}>
          <label className={styles.lab} htmlFor="pa-code">
            Kode
          </label>
          <input
            ref={codeRef}
            data-autofocus
            id="pa-code"
            className={`${styles.input} ${styles.codeInput}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
            required
          />
        </div>
        {codeNote ? (
          <p className={styles.small} role="status" style={{ maxWidth: "none" }}>
            {codeNote}
          </p>
        ) : null}
        {errorBox}
        <div className={styles.formFoot}>
          <span className={styles.linkRow}>
            <button type="button" className={styles.linkBtn} onClick={() => void resend()} disabled={busy}>
              Send ny kode
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setCodeStep(null);
                setFormError(null);
                setToken(null);
                setTurnstileKey((n) => n + 1);
                requestAnimationFrame(() => refs.email.current?.focus());
              }}
              disabled={busy}
            >
              Endre e-post
            </button>
          </span>
          <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={busy}>
            {busy ? "Sjekker ..." : "Bekreft"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className={styles.modalForm} onSubmit={submit} noValidate aria-describedby={formError ? "pa-form-error" : undefined}>
      <p className={styles.modalLede} style={{ margin: 0 }}>
        Fortell oss hvem dere er og hva dere følger med på. Vi går gjennom forespørselen og sender dere en personlig lenke.
      </p>

      <div className={styles.field}>
        <label className={styles.lab} htmlFor="pa-company">
          Firma
        </label>
        {company ? (
          <div className={styles.picked}>
            <div className={styles.pickedText}>
              <strong>{company.name}</strong>
              <span>
                Org.nr. {spacedOrg(company.orgNumber)}
                {company.city ? ` · ${town(company.city)}` : ""}
              </span>
            </div>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setCompany(null);
                requestAnimationFrame(() => refs.company.current?.focus());
              }}
            >
              Endre
            </button>
          </div>
        ) : (
          <>
            <input
              ref={refs.company}
              data-autofocus
              id="pa-company"
              className={styles.input}
              type="text"
              autoComplete="organization"
              placeholder="Firmanavn eller org.nr."
              maxLength={160}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                clearError("company");
              }}
              aria-controls="pa-company-hits"
              {...fieldProps("company")}
            />
            {hits && hits.length ? (
              <ul className={styles.hits} id="pa-company-hits" aria-label="Treff i Enhetsregisteret">
                {hits.map((c) => (
                  <li key={c.orgNumber}>
                    <button type="button" className={styles.hit} onClick={() => pick(c)}>
                      <strong>{c.name}</strong>
                      <span>
                        {spacedOrg(c.orgNumber)}
                        {c.city ? ` · ${town(c.city)}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : hits && !searching && query.trim().length >= 2 ? (
              <span className={styles.small} style={{ maxWidth: "none" }}>
                Ingen treff i Enhetsregisteret. Prøv org.nr.
              </span>
            ) : searching ? (
              <span className={styles.small} style={{ maxWidth: "none" }}>
                Søker i Enhetsregisteret ...
              </span>
            ) : null}
          </>
        )}
        {fieldError("company")}
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.lab} htmlFor="pa-name">
            Navn
          </label>
          <input
            ref={refs.contact_name}
            id="pa-name"
            className={styles.input}
            type="text"
            autoComplete="name"
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("contact_name");
            }}
            required
            {...fieldProps("contact_name")}
          />
          {fieldError("contact_name")}
        </div>
        <div className={styles.field}>
          <label className={styles.lab} htmlFor="pa-role">
            Rolle i firmaet
          </label>
          <input
            ref={refs.contact_role}
            id="pa-role"
            className={styles.input}
            type="text"
            autoComplete="organization-title"
            placeholder="F.eks. daglig leder, prosjektleder"
            maxLength={80}
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              clearError("contact_role");
            }}
            required
            {...fieldProps("contact_role")}
          />
          {fieldError("contact_role")}
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.lab} htmlFor="pa-email">
            E-post
          </label>
          <input
            ref={refs.email}
            id="pa-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            required
            {...fieldProps("email")}
          />
          {fieldError("email")}
        </div>
        <div className={styles.field}>
          <label className={styles.lab} htmlFor="pa-phone">
            Telefon <span className={styles.optional}>(valgfritt)</span>
          </label>
          <input
            ref={refs.phone}
            id="pa-phone"
            className={styles.input}
            type="tel"
            autoComplete="tel"
            maxLength={24}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
            {...fieldProps("phone")}
          />
          {fieldError("phone")}
        </div>
      </div>

      <fieldset className={styles.field}>
        <legend className={styles.lab}>Fylker dere vil følge</legend>
        <div className={styles.opts} style={{ marginTop: 6 }}>
          {regionChoices().map((r) => (
            <label key={r.code} className={styles.opt}>
              <input type="checkbox" checked={regions.includes(r.code)} onChange={() => setRegions((old) => toggle(old, r.code))} />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.field}>
        <legend className={styles.lab}>Fag</legend>
        <div className={styles.opts} style={{ marginTop: 6 }}>
          {domainChoices().map((d) => (
            <label key={d.key} className={styles.opt}>
              <input type="checkbox" checked={domains.includes(d.key)} onChange={() => setDomains((old) => toggle(old, d.key))} />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label className={styles.check}>
          <input
            ref={refs.website_confirmed}
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              clearError("website_confirmed");
            }}
            {...fieldProps("website_confirmed")}
          />
          <span>Kontaktinformasjonen min står på firmaets nettside. Jeg vet at ArbeidMatch sjekker dette før tilgang gis.</span>
        </label>
        {fieldError("website_confirmed")}
      </div>

      <div className={styles.honey} aria-hidden="true">
        <label htmlFor="pa-website">Nettsted</label>
        <input id="pa-website" type="text" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
      </div>
      {TURNSTILE_SITE_KEY ? (
        <Turnstile
          key={turnstileKey}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setToken}
          onExpire={() => setToken(null)}
          onError={() => setToken(null)}
          options={{ theme: "dark", language: "nb" }}
        />
      ) : null}
      {errorBox}
      <div className={styles.formFoot}>
        <span className={styles.small}>
          Vi bruker opplysningene bare til å vurdere forespørselen, gi dere tilgang og sende varslene dere velger.{" "}
          <Link href="/privacy">Personvern</Link>
        </span>
        <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={busy}>
          {busy ? "Sender ..." : "Be om tilgang"}
        </button>
      </div>
    </form>
  );
}
