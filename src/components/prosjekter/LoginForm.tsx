"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "@/components/prosjekter/portal.module.css";
import { checkLoginEmail } from "@/lib/prosjekter/access";

/**
 * Login without a password: one address, and a link by e-mail if it has
 * access. The answer is the same whether it has or not.
 */
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [honey, setHoney] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const checked = checkLoginEmail(email);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/prosjekter/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: checked.email, website: honey }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || payload.ok !== true) {
        setError(payload.error ?? "Innloggingen er ikke tilgjengelig akkurat nå. Prøv igjen om litt.");
        return;
      }
      setSent(true);
    } catch {
      setError("Innloggingen er ikke tilgjengelig akkurat nå. Prøv igjen om litt.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.card} style={{ marginTop: 28 }}>
        <div className={styles.done} role="status">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="10" fill="none" stroke="#3fa87b" strokeWidth="1.5" />
            <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke="#3fa87b" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div>
            <h3>Sjekk e-posten din</h3>
            <p>Hvis adressen har tilgang, har vi sendt deg en lenke. Den virker i 30 minutter.</p>
          </div>
        </div>
        <p className={styles.small}>
          Har dere ikke tilgang ennå?{" "}
          <Link href="/prosjekter#tilgang" className={styles.linkGold}>
            Be om tilgang
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.card} style={{ marginTop: 28 }} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label className={styles.lab} htmlFor="pl-email">
          E-post
        </label>
        <input
          id="pl-email"
          className={styles.input}
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "pl-error" : undefined}
          required
        />
        {error ? (
          <span className={styles.err} id="pl-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
      <div className={styles.honey} aria-hidden="true">
        <label htmlFor="pl-website">Nettsted</label>
        <input id="pl-website" type="text" tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
      </div>
      <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={busy}>
        {busy ? "Sender ..." : "Send meg en innloggingslenke"}
      </button>
      <p className={styles.small}>
        Har dere ikke tilgang ennå?{" "}
        <Link href="/prosjekter#tilgang" className={styles.linkGold}>
          Be om tilgang
        </Link>
      </p>
    </form>
  );
}
