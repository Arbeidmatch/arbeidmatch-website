"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useRef, useState } from "react";

import styles from "@/components/prosjekter/portal.module.css";
import { AccessPerks } from "@/components/prosjekter/PortalSteps";
import { checkAccessRequest, type AccessField } from "@/lib/prosjekter/access";
import { domainChoices, regionChoices } from "@/lib/prosjekter/format";

/**
 * "Be om tilgang": a firm asks for the whole picture in its counties and
 * trades. The website checks the fields, Turnstile when it is configured and
 * a hidden honeypot, and passes the request to the ATS, where the owner
 * approves it; the personal link follows by e-mail after that.
 */

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function AccessForm() {
  const [company, setCompany] = useState("");
  const [orgnr, setOrgnr] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [existing, setExisting] = useState(false);
  const [honey, setHoney] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<AccessField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ company: string; email: string; regions: number } | null>(null);
  const refs = {
    company: useRef<HTMLInputElement>(null),
    orgnr: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
  };
  const doneRef = useRef<HTMLDivElement>(null);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const checked = checkAccessRequest({ company, orgnr, email, phone, regions, domains, existing_client: existing });
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
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: AccessField };
      if (!res.ok || payload.ok !== true) {
        if (payload.field) setErrors({ [payload.field]: payload.error ?? "Sjekk feltet." });
        setFormError(payload.error ?? "Forespørselen kunne ikke sendes. Prøv igjen om litt.");
        setToken(null);
        setTurnstileKey((n) => n + 1);
        return;
      }
      setDone({ company: checked.value.company, email: checked.value.email, regions: checked.value.regions.length });
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setFormError("Forespørselen kunne ikke sendes. Prøv igjen om litt.");
    } finally {
      setBusy(false);
    }
  };

  const fieldProps = (name: AccessField) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `pa-e-${name}` : undefined,
  });

  return (
    <section className={styles.band} id="tilgang" aria-labelledby="tilgang-h" style={{ scrollMarginTop: 80 }}>
      <div className={`${styles.wrap} ${styles.access}`}>
        <div className={styles.accessSide}>
          <p className={styles.eyebrow}>Be om tilgang</p>
          <h2 id="tilgang-h">Få hele bildet for ditt område</h2>
          <p>
            Fortell oss hvem dere er og hva dere følger med på. Vi går gjennom forespørselen og sender dere en personlig
            lenke.
          </p>
          <AccessPerks />
          <p className={styles.small} style={{ marginTop: 22 }}>
            Har dere tilgang allerede?{" "}
            <Link href="/prosjekter/logg-inn" className={styles.linkGold}>
              Logg inn
            </Link>
          </p>
        </div>

        {done ? (
          <div className={styles.card}>
            <div className={styles.done} ref={doneRef} tabIndex={-1} role="status">
              <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                <circle cx="11" cy="11" r="10" fill="none" stroke="#3fa87b" strokeWidth="1.5" />
                <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="#3fa87b" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <div>
                <h3>Takk, {done.company}.</h3>
                <p>
                  Vi har fått forespørselen
                  {done.regions ? ` for ${done.regions} ${done.regions === 1 ? "fylke" : "fylker"}` : ""}. Du får en
                  personlig lenke på {done.email} når tilgangen er klar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className={styles.card} onSubmit={submit} noValidate aria-describedby={formError ? "pa-form-error" : undefined}>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.lab} htmlFor="pa-company">
                  Firma
                </label>
                <input
                  ref={refs.company}
                  id="pa-company"
                  className={styles.input}
                  type="text"
                  autoComplete="organization"
                  maxLength={160}
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors((o) => ({ ...o, company: undefined }));
                  }}
                  required
                  {...fieldProps("company")}
                />
                {errors.company ? (
                  <span className={styles.err} id="pa-e-company">
                    {errors.company}
                  </span>
                ) : null}
              </div>
              <div className={styles.field}>
                <label className={styles.lab} htmlFor="pa-orgnr">
                  Org.nr.
                </label>
                <input
                  ref={refs.orgnr}
                  id="pa-orgnr"
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  placeholder="9 siffer"
                  maxLength={14}
                  value={orgnr}
                  onChange={(e) => {
                    setOrgnr(e.target.value);
                    if (errors.orgnr) setErrors((o) => ({ ...o, orgnr: undefined }));
                  }}
                  required
                  {...fieldProps("orgnr")}
                />
                {errors.orgnr ? (
                  <span className={styles.err} id="pa-e-orgnr">
                    {errors.orgnr}
                  </span>
                ) : null}
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
                    if (errors.email) setErrors((o) => ({ ...o, email: undefined }));
                  }}
                  required
                  {...fieldProps("email")}
                />
                {errors.email ? (
                  <span className={styles.err} id="pa-e-email">
                    {errors.email}
                  </span>
                ) : null}
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
                    if (errors.phone) setErrors((o) => ({ ...o, phone: undefined }));
                  }}
                  {...fieldProps("phone")}
                />
                {errors.phone ? (
                  <span className={styles.err} id="pa-e-phone">
                    {errors.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <fieldset className={styles.field}>
              <legend className={styles.lab}>Fylker dere vil følge</legend>
              <div className={styles.opts} style={{ marginTop: 6 }}>
                {regionChoices().map((r) => (
                  <label key={r.code} className={styles.opt}>
                    <input
                      type="checkbox"
                      checked={regions.includes(r.code)}
                      onChange={() => setRegions((old) => toggle(old, r.code))}
                    />
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
                    <input
                      type="checkbox"
                      checked={domains.includes(d.key)}
                      onChange={() => setDomains((old) => toggle(old, d.key))}
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={styles.check}>
              <input type="checkbox" checked={existing} onChange={(e) => setExisting(e.target.checked)} />
              <span>Vi er allerede kunde hos ArbeidMatch</span>
            </label>
            <div className={styles.honey} aria-hidden="true">
              <label htmlFor="pa-website">Nettsted</label>
              <input
                id="pa-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
              />
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
            {formError ? (
              <p className={styles.formError} id="pa-form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className={styles.formFoot}>
              <span className={styles.small}>
                Vi bruker opplysningene bare til å gi dere tilgang og sende varslene dere velger.{" "}
                <Link href="/privacy">Personvern</Link>
              </span>
              <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={busy}>
                {busy ? "Sender ..." : "Be om tilgang"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
