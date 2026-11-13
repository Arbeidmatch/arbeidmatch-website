"use client";

import { useState, type FormEvent } from "react";

import styles from "@/components/prosjekter/portal.module.css";
import { isFreeMail } from "@/lib/foreignCompany";
import { LANDING_NO, RECOMMEND_NO } from "@/lib/min-side/recommend";

/**
 * ORDER 274: the two forms behind a recommendation mail's buttons. "Se
 * prosjektene" asks for a free trial, which only the owner's Give starts;
 * "Ikke send meg anbefalinger" stops recommendations to that one address. Both
 * post to /api/prosjektvarsler/anbefalt/<token>; the ATS decides the answer.
 */

type Field = "name" | "email" | "phone" | "org_number" | "company_name";

async function post(token: string, body: Record<string, string>): Promise<{ ok: true; message: string | null } | { ok: false; message: string; field: string | null }> {
  try {
    const res = await fetch(`/api/prosjektvarsler/anbefalt/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string; field?: string | null; data?: { message?: unknown } };
    if (!res.ok) return { ok: false, message: payload.error ?? "Noe gikk galt. Prøv igjen.", field: payload.field ?? null };
    const message = payload.data?.message;
    return { ok: true, message: typeof message === "string" && message.trim() ? message.trim() : null };
  } catch {
    return { ok: false, message: "Noe gikk galt. Prøv igjen.", field: null };
  }
}

const LABELS: Record<Field, string> = {
  name: "Navn",
  email: "E-post i firmaet",
  phone: "Telefon",
  org_number: "Organisasjonsnummer",
  company_name: "Firmanavn",
};

export function TrialRequestForm({ token }: { token: string }) {
  const [v, setV] = useState<Record<Field, string>>({ name: "", email: "", phone: "", org_number: "", company_name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; field: string | null } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (v.email.trim() && isFreeMail(v.email)) {
      setError({ message: RECOMMEND_NO.companyOnly, field: "email" });
      return;
    }
    setBusy(true);
    setError(null);
    const r = await post(token, { action: "trial_request", ...v });
    setBusy(false);
    if (r.ok) setDone(r.message ?? LANDING_NO.pending);
    else setError({ message: r.message, field: r.field });
  };

  if (done)
    return (
      <div className={styles.done} role="status" style={{ marginTop: 28 }}>
        <span aria-hidden>✓</span>
        <div>
          <h3>Takk</h3>
          <p>{done}</p>
        </div>
      </div>
    );

  const input = (f: Field, type: string, autoComplete: string, optional = false) => (
    <div className={styles.field}>
      <label className={styles.lab} htmlFor={`rt-${f}`}>
        {LABELS[f]} {optional ? <span className={styles.optional}>(valgfritt)</span> : null}
      </label>
      <input
        id={`rt-${f}`}
        className={styles.input}
        type={type}
        autoComplete={autoComplete}
        required={!optional}
        value={v[f]}
        maxLength={f === "email" ? 254 : 160}
        aria-invalid={error?.field === f ? true : undefined}
        aria-describedby={error?.field === f ? `rt-e-${f}` : undefined}
        onChange={(e) => {
          const value = e.target.value;
          setV((x) => ({ ...x, [f]: value }));
          if (error?.field === f) setError(null);
        }}
      />
      {error?.field === f ? (
        <span className={styles.err} id={`rt-e-${f}`}>
          {error.message}
        </span>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={(e) => void submit(e)} style={{ marginTop: 28, display: "grid", gap: 16, maxWidth: 480 }} noValidate>
      {input("name", "text", "name")}
      {input("email", "email", "email")}
      {input("phone", "tel", "tel")}
      {input("org_number", "text", "off")}
      {input("company_name", "text", "organization", true)}
      {error && !error.field ? (
        <p className={styles.formError} role="alert">
          {error.message}
        </p>
      ) : null}
      <div>
        <button type="submit" className={`${styles.btn} ${styles.btnGold}`} disabled={busy}>
          Be om prøveperiode
        </button>
      </div>
      <p className={styles.small}>Prøveperioden starter når den er godkjent. Bruk e-postadressen i firmaet som fikk anbefalingen.</p>
    </form>
  );
}

export function OptOutForm({ token, already }: { token: string; already: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(already ? LANDING_NO.stopped : null);

  if (done)
    return (
      <div className={styles.done} role="status" style={{ marginTop: 28 }}>
        <span aria-hidden>✓</span>
        <div>
          <p>{done}</p>
        </div>
      </div>
    );

  return (
    <div style={{ marginTop: 28, display: "grid", gap: 12, justifyItems: "start" }}>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnGold}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await post(token, { action: "optout" });
          setBusy(false);
          if (r.ok) setDone(r.message ?? LANDING_NO.stopped);
          else setError(r.message);
        }}
      >
        {LANDING_NO.stopTitle}
      </button>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
