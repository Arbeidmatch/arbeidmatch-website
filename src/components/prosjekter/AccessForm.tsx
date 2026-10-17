"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import AccessPlans, { ACCESS_PLAN_NAMES } from "./AccessPlans";
import planStyles from "./access-plans.module.css";
import type { AccessPlan } from "@/lib/prosjekter/access";

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
 *
 * Sending is the acceptance (his decision, 16 October 2026): no box to tick.
 * The notice in the first step says that sending confirms the contact details
 * are on the company's website and accepts the terms, the privacy notice and
 * the disclaimer printed under it, so website_confirmed goes as true.
 *
 * His design of 16 October 2026, for less on screen at once: who you are in
 * one step, what you follow in the next. Counties are picked by region, with
 * the fifteen one click away; trades start at "Alle fag" (an empty list, as
 * before) with the twelve one click away.
 */

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Company = { name: string; orgNumber: string; city?: string };

const COUNTY_GROUPS: { label: string; codes: string[] }[] = [
  { label: "Øst", codes: ["NO081", "NO084", "NO083", "NO085", "NO093", "NO020"] },
  { label: "Sør", codes: ["NO094", "NO092"] },
  { label: "Vest", codes: ["NO0A1", "NO0A2", "NO0A3"] },
  { label: "Midt", codes: ["NO060"] },
  { label: "Nord", codes: ["NO071", "NO072", "NO073"] },
];
const STEP_ONE: AccessField[] = ["company", "contact_name", "contact_role", "email", "phone"];

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
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [plan, setPlan] = useState<AccessPlan>("trial");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [showCounties, setShowCounties] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const refs = {
    company: useRef<HTMLInputElement>(null),
    contact_name: useRef<HTMLInputElement>(null),
    contact_role: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
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

  const check = () =>
    checkAccessRequest({
      company: company?.name ?? "",
      orgnr: company?.orgNumber ?? "",
      contact_name: name,
      contact_role: role,
      email,
      phone,
      regions,
      domains,
      website_confirmed: true,
      requested_plan: plan,
      requested_frequency: frequency,
    });

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const checked = check();
    if (!checked.ok && STEP_ONE.includes(checked.field)) {
      setErrors({ [checked.field]: checked.error });
      refs[checked.field as keyof typeof refs]?.current?.focus();
      return;
    }
    setErrors({});
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const checked = check();
    if (!checked.ok) {
      if (STEP_ONE.includes(checked.field)) setStep(1);
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
        if (payload.field && STEP_ONE.includes(payload.field)) setStep(1);
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
      <div className={`${styles.modalForm} ${planStyles.form}`}>
        <div className={styles.done} ref={doneRef} tabIndex={-1} role="status">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="10" fill="none" stroke="#3fa87b" strokeWidth="1.5" />
            <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="#3fa87b" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div>
            <h3>Venter på aktivering</h3>
            <p>
              Vi har mottatt registreringen din. Du får beskjed på {email.trim().toLowerCase()} når ArbeidMatch har aktivert tilgangen. Prosjektvarsler starter først etter aktivering.
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
      <form className={`${styles.modalForm} ${planStyles.form}`} onSubmit={verify} noValidate aria-describedby={formError ? "pa-form-error" : undefined}>
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
                setStep(1);
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

  if (step === 0) return <AccessPlans onChoose={chosen => { setPlan(chosen); if (chosen === "trial") { setRegions([]); setDomains([]); setFrequency("weekly"); } if (chosen === "national") setRegions(regionChoices().map(r => r.code)); setStep(1); }} />;

  const progress = (
    <div className={styles.stepBar}>
      <span className={styles.stepNo}>{step === 1 ? "Kontaktinformasjon" : "Preferanser"}</span>
      <i className={styles.on} aria-hidden="true" />
      <i className={step === 2 ? styles.on : undefined} aria-hidden="true" />
    </div>
  );

  if (step === 1) {
    return (
      <form className={`${styles.modalForm} ${planStyles.form}`} onSubmit={next} noValidate>
        {progress}
        <div className={styles.formFoot}><strong>{ACCESS_PLAN_NAMES[plan]}</strong><button type="button" className={styles.linkBtn} onClick={() => setStep(0)}>Endre plan</button></div>
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
        <p className={styles.consent}>
          Ved å sende bekrefter du at kontaktinformasjonen din står på firmaets nettside, og godtar{" "}
          <Link href="/terms" target="_blank">
            vilkår
          </Link>
          ,{" "}
          <Link href="/privacy" target="_blank">
            personvern
          </Link>{" "}
          og ansvarsfraskrivelsen nedenfor.
        </p>
        <p className={styles.disclaimer}>
          <strong>Ansvarsfraskrivelse.</strong> Forsprang er i beta. Opplysningene om prosjektene kan være ufullstendige
          eller forsinket og erstatter ikke konkurransegrunnlaget. ArbeidMatch er ikke ansvarlig for beslutninger tatt på
          grunnlag av dem.
        </p>
        <div className={styles.formFoot}>
          <span />
          <button className={`${styles.btn} ${styles.btnGold}`} type="submit">
            Neste
          </button>
        </div>
      </form>
    );
  }

  const allCodes = regionChoices().map((r) => r.code);
  const has = (codes: string[]) => codes.every((c) => regions.includes(c));
  const setGroup = (codes: string[], on: boolean) =>
    setRegions((old) => (on ? [...old, ...codes.filter((c) => !old.includes(c))] : old.filter((c) => !codes.includes(c))));
  const chosen = regionChoices().filter((r) => regions.includes(r.code));
  const regionSummary =
    chosen.length === 0
      ? "Ingen fylker valgt"
      : chosen.length === allCodes.length
        ? "Alle 15 fylker"
        : chosen.length <= 4
          ? chosen.map((r) => r.label).join(", ")
          : `${chosen
              .slice(0, 3)
              .map((r) => r.label)
              .join(", ")} og ${chosen.length - 3} til`;

  return (
    <form className={`${styles.modalForm} ${planStyles.form}`} onSubmit={submit} noValidate aria-describedby={formError ? "pa-form-error" : undefined}>
      {progress}
      <div className={styles.formFoot}><strong>{ACCESS_PLAN_NAMES[plan]}</strong><button type="button" className={styles.linkBtn} onClick={() => setStep(0)}>Endre plan</button></div>
      {plan === "trial" ? <>
        <div className={styles.field}><label className={styles.lab} htmlFor="pa-county">Fylke</label><select id="pa-county" className={styles.input} value={regions[0] ?? ""} onChange={e => setRegions(e.target.value ? [e.target.value] : [])}><option value="">Velg fylke</option>{regionChoices().map(r => <option key={r.code} value={r.code}>{r.label}</option>)}</select></div>
        <div className={styles.field}><label className={styles.lab} htmlFor="pa-trade">Fagområde</label><select id="pa-trade" className={styles.input} value={domains[0] ?? ""} onChange={e => setDomains(e.target.value ? [e.target.value] : [])}><option value="">Velg fagområde</option>{domainChoices().map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></div>
        <p className={styles.small}>Ukentlig varsling til én e-postadresse. Dag og tidspunkt avtales før aktivering.</p>
      </> : <>
      {plan === "national" ? <p className={styles.small}>Alle norske fylker er inkludert.</p> : <fieldset className={styles.field}>
        <legend className={styles.lab}>Områder</legend>
        <div className={styles.opts} style={{ marginTop: 6 }}>
          <label className={styles.opt}>
            <input type="checkbox" checked={has(allCodes)} onChange={(e) => setGroup(allCodes, e.target.checked)} />
            <span>Hele Norge</span>
          </label>
          {COUNTY_GROUPS.map((g) => (
            <label key={g.label} className={styles.opt}>
              <input type="checkbox" checked={has(g.codes)} onChange={(e) => setGroup(g.codes, e.target.checked)} />
              <span>{g.label}</span>
            </label>
          ))}
        </div>
        <span className={styles.pickSum}>
          {regionSummary}
          <button type="button" className={styles.linkBtn} aria-expanded={showCounties} onClick={() => setShowCounties((v) => !v)}>
            Tilpass
          </button>
        </span>
        {showCounties ? (
          <div className={styles.opts}>
            {regionChoices().map((r) => (
              <label key={r.code} className={styles.opt}>
                <input type="checkbox" checked={regions.includes(r.code)} onChange={() => setRegions((old) => toggle(old, r.code))} />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        ) : null}
      </fieldset>}
      <fieldset className={styles.field}>
        <legend className={styles.lab}>Fag</legend>
        <span className={styles.pickSum} style={{ marginTop: 6 }}>
          <label className={styles.opt}>
            <input type="checkbox" checked={domains.length === 0} onChange={() => setDomains([])} />
            <span>Alle fag</span>
          </label>
          <button type="button" className={styles.linkBtn} aria-expanded={showTrades} onClick={() => setShowTrades((v) => !v)}>
            Velg fag
          </button>
        </span>
        {showTrades ? (
          <div className={styles.opts}>
            {domainChoices().map((d) => (
              <label key={d.key} className={styles.opt}>
                <input type="checkbox" checked={domains.includes(d.key)} onChange={() => setDomains((old) => toggle(old, d.key))} />
                <span>{d.label}</span>
              </label>
            ))}
          </div>
        ) : null}
      </fieldset>



        <div className={styles.field}><label className={styles.lab} htmlFor="pa-frequency">Varsling</label><select id="pa-frequency" className={styles.input} value={frequency} onChange={e => setFrequency(e.target.value as "daily" | "weekly")}><option value="weekly">Ukentlig</option><option value="daily">Daglig</option></select></div>
      </>}
      <p className={styles.small}>Forespørselen gir ikke tilgang automatisk. ArbeidMatch må aktivere abonnementet først.</p>
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
          options={{ theme: "dark", language: "nb", appearance: "interaction-only" }}
        />
      ) : null}
      {errorBox}
      <div className={styles.formFoot}>
        <span className={styles.footBtns}>
          <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(1)} disabled={busy}>
            Tilbake
          </button>
          <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={busy}>
            {busy ? "Sender ..." : "Send"}
          </button>
        </span>
      </div>
    </form>
  );
}
