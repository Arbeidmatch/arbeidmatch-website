"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  DEFAULT_CITIZENSHIP_RULE,
  GATE_CONSENT_TEXT_LEAD,
  GATE_CONSENT_TEXT_VERSION,
  citizenshipAccepted,
  gateSourceFrom,
  isAdult,
  parseCitizenshipRule,
  type GateCitizenship,
  type GateCitizenshipRule,
} from "@/lib/candidateGate";
import { HANDOVER_ACTION, TEXTS, errorText, langFrom, safeNext, signInStartHref, type LoginLang } from "./candidateLoginRules";
import styles from "./CandidateLogin.module.css";

/**
 * THE CANDIDATE'S SIGN-IN ON THE SITE (ORDER 426, 20 November 2026). His words:
 * "si cum avem noi la admini la logare trebuie sa aiba si candidatii". One
 * screen, drawn like RecOS's staff /login, with three faces:
 *
 *   - sign in: Google and the fingerprint (both started on RecOS, where they
 *     belong), or the e-mail code. The code is asked for and checked through
 *     this site's server (/api/candidate-sign-in), and a proven person's
 *     one-time handover token is posted to RecOS as a top-level form, so the
 *     session opens there and the portal follows: no second screen.
 *   - finish: the gate's letter opens this page with its token; the same code,
 *     then the name, and the profile is made.
 *   - create: the one entry gate (ORDER 396), citizenship under his rule B,
 *     date of birth, e-mail and the one consent, posted to
 *     /api/candidate-join-network; the letter's link comes back here.
 */

type View = "signin" | "create";
type Step = "email" | "code" | "profile";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_MS = 2 * 60 * 1000;
const PENDING_KEY = "arbeidmatch.candidateSignIn.pending";
const PENDING_MS = 10 * 60 * 1000;
const GATE_COOLDOWN_KEY = "arbeidmatch-candidate-request-cooldown";
const GATE_COOLDOWN_MS = 60_000;

function readPending(): { email: string; at: number } | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? "null") as { email?: unknown; at?: unknown } | null;
    if (v && typeof v.email === "string" && typeof v.at === "number" && Date.now() - v.at < PENDING_MS) return { email: v.email, at: v.at };
  } catch {
    /* storage blocked: the page still works from the address */
  }
  return null;
}

function writePending(email: string | null, at = Date.now()) {
  try {
    if (email) window.localStorage.setItem(PENDING_KEY, JSON.stringify({ email, at }));
    else window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Posts the handover token to RecOS as a top-level form: the session opens there, never in this site. */
function handOver(token: string, next: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = HANDOVER_ACTION;
  for (const [name, value] of [
    ["token", token],
    ["next", next],
  ]) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

async function ask(body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch("/api/candidate-sign-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!res) return { status: 0, data: {} };
  return { status: res.status, data: ((await res.json().catch(() => ({}))) as Record<string, unknown>) ?? {} };
}

function HexLattice() {
  return (
    <div className={styles.hex} aria-hidden>
      <svg viewBox="0 0 600 600" fill="none">
        <g stroke="currentColor" strokeWidth="0.9">
          <polygon points="300,48 447,133 447,303 300,388 153,303 153,133" />
          <polygon points="300,108 402,167 402,285 300,344 198,285 198,167" />
          <polygon points="300,168 357,201 357,267 300,300 243,267 243,201" />
          <polygon points="80,200 147,239 147,313 80,352 13,313 13,239" />
          <polygon points="520,200 587,239 587,313 520,352 453,313 453,239" />
          <polygon points="300,420 367,459 367,533 300,572 233,533 233,459" />
          <polygon points="120,380 187,419 187,493 120,532 53,493 53,419" opacity="0.65" />
          <polygon points="480,380 547,419 547,493 480,532 413,493 413,419" opacity="0.65" />
        </g>
      </svg>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function CandidateLoginScreen({ initialView }: { initialView: View }) {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [lang, setLang] = useState<LoginLang>("en");
  const [view, setView] = useState<View>(initialView);
  const t = TEXTS[lang];

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams(p);
    setLang(langFrom(p.get("lang")));
  }, []);

  const get = (k: string) => params?.get(k) ?? "";
  const gate = get("gate");
  const nextPath = safeNext(get("next"));
  const notice = errorText(get("error"), lang);

  return (
    <div className={styles.page}>
      <div className={styles.stars} aria-hidden />
      <HexLattice />
      <section className={styles.section}>
        <aside className={styles.aside}>
          <div>
            <span className={`${styles.mark} ${styles.markLarge}`} aria-hidden>
              A
            </span>
            <p className={styles.brand}>ArbeidMatch</p>
            <p className={styles.tagline}>{t.tagline}</p>
          </div>
        </aside>
        <div className={styles.formSide}>
          <div className={styles.shell}>
            <div className={styles.inner}>
              {view === "create" ? (
                <CreateProfile lang={lang} params={params} onSignIn={() => setView("signin")} />
              ) : (
                <SignIn lang={lang} params={params} gate={gate} nextPath={nextPath} notice={notice} onCreate={() => setView("create")} />
              )}
              <div className={styles.langs} role="group" aria-label="Language">
                {(
                  [
                    ["en", "English"],
                    ["no", "Norsk"],
                  ] as const
                ).map(([code, label]) => (
                  <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)} className={`${styles.lang} ${lang === code ? styles.langOn : ""}`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className={styles.powered}>
                {t.powered} <a href="/">ArbeidMatch</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={styles.mobileHead}>
      <span className={`${styles.mark} ${styles.markSmall}`} aria-hidden>
        A
      </span>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.sub}>{sub}</p>
      </div>
    </div>
  );
}

function SignIn(props: { lang: LoginLang; params: URLSearchParams | null; gate: string; nextPath: string; notice: string | null; onCreate: () => void }) {
  const { lang, params, gate, nextPath, notice, onCreate } = props;
  const t = TEXTS[lang];
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [askedAt, setAskedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ticket, setTicket] = useState("");
  const [needs, setNeeds] = useState({ name: false, consent: false, birth: false });
  const [fullName, setFullName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [birth, setBirth] = useState("");

  const carried = useMemo(() => ({ get: (k: string) => params?.get(k) ?? null }), [params]);
  const consentFromPopup = params?.get("consent") === "1";
  const consentSource = params?.get("source") ?? "";
  const invite = params?.get("invite") ?? "";

  useEffect(() => {
    // Back from the mail app: the address and the time the code was asked for are kept for its ten minutes.
    const pending = readPending();
    if (pending) {
      setEmail(pending.email);
      setAskedAt(pending.at);
      setStep("code");
    }
  }, []);

  const resendIn = askedAt ? askedAt + RESEND_MS - now : 0;
  useEffect(() => {
    if (step !== "code" || resendIn <= 0) return;
    const id = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(id);
  }, [step, resendIn, now]);

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    if (!EMAIL.test(email.trim())) return setMsg(t.badEmail);
    setMsg(null);
    setBusy(true);
    const { status, data } = await ask({ action: "code", email: email.trim(), next: nextPath });
    setBusy(false);
    if (status !== 200) {
      setMsg(typeof data.error === "string" ? data.error : t.tryAgain);
      const wait = Number(data.retry_after_sec) || 0;
      // A code already on its way: wait where it is typed.
      if (status === 429 && wait > 0 && wait <= RESEND_MS / 1000) {
        setAskedAt(Date.now() - (RESEND_MS - wait * 1000));
        setNow(Date.now());
        setStep("code");
      }
      return;
    }
    const at = Date.now();
    setAskedAt(at);
    setNow(at);
    setCode("");
    setStep("code");
    writePending(email.trim(), at);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const onProfile = step === "profile";
    if (onProfile) {
      if (needs.name && fullName.trim().length < 2) return setMsg(t.needName);
      if (needs.birth && !isAdult(birth)) return setMsg(birth ? t.underAge : t.needBirth);
      if (needs.consent && !accepted) return setMsg(t.needConsent);
    }
    setMsg(null);
    setBusy(true);
    const consentNow = consentFromPopup || (onProfile && needs.consent && accepted);
    const { status, data } = await ask({
      action: "verify",
      email: email.trim(),
      ...(onProfile ? { ticket, full_name: fullName.trim() } : { code: code.trim() }),
      next: nextPath,
      invite,
      ...(gate ? { gate } : {}),
      ...(consentNow ? { consent: true, consent_source: consentSource || "registration" } : {}),
      ...(onProfile && needs.birth ? { birth_date: birth } : {}),
    });
    if (data.gate_needed && typeof data.gate_url === "string" && data.gate_url.startsWith("https://www.arbeidmatch.no/")) {
      writePending(null);
      window.location.assign(data.gate_url);
      return;
    }
    if (status === 200 && typeof data.handover === "string") {
      writePending(null);
      handOver(data.handover, safeNext(typeof data.redirect === "string" ? data.redirect : "") || nextPath);
      return;
    }
    setBusy(false);
    if (status === 200 && data.profile_needed && typeof data.ticket === "string") {
      writePending(null);
      setTicket(data.ticket);
      setNeeds({ name: Boolean(data.needs_name), consent: Boolean(data.needs_consent), birth: Boolean(data.needs_birth_date) });
      if (onProfile) setMsg(data.needs_name ? t.needName : data.needs_birth_date ? t.needBirth : t.needConsent);
      setStep("profile");
      return;
    }
    setMsg(typeof data.error === "string" ? data.error : t.tryAgain);
    if (data.under_age || (onProfile && status === 401)) {
      writePending(null);
      setTicket("");
      setStep("email");
    }
  }

  function otherEmail() {
    writePending(null);
    setStep("email");
    setCode("");
    setMsg(null);
  }

  const shown = msg ?? (step === "email" ? notice : null);

  return (
    <>
      <Head title={gate ? t.finishTitle : t.welcome} sub={gate ? t.finishSub : t.welcomeSub} />

      {step === "email" && !gate ? (
        <>
          <a className={styles.oauth} href={signInStartHref("passkey", carried)}>
            {t.passkey}
          </a>
          <a className={styles.oauth} href={signInStartHref("google", carried)}>
            <GoogleIcon />
            {t.google}
          </a>
          <div className={styles.divider}>
            <span />
            <span>{t.or}</span>
            <span />
          </div>
        </>
      ) : null}

      {shown ? (
        <div className={styles.error} role="alert">
          {shown}
        </div>
      ) : null}

      {step === "email" ? (
        <form className={styles.form} onSubmit={requestCode} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cl-email">
              {t.email}
            </label>
            <input id="cl-email" className={styles.input} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className={styles.primary} disabled={busy}>
            {busy ? t.sending : t.sendCode}
          </button>
        </form>
      ) : null}

      {step === "code" ? (
        <form className={styles.form} onSubmit={verify} noValidate>
          <p className={styles.notice} role="status">
            {t.codeSent(email.trim())}
          </p>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cl-code">
              {t.codeLabel}
            </label>
            <input
              id="cl-code"
              className={`${styles.input} ${styles.code}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </div>
          <button type="submit" className={styles.primary} disabled={busy || code.length !== 6}>
            {busy ? t.signingIn : t.signIn}
          </button>
          <div className={styles.row}>
            <button type="button" className={styles.link} onClick={otherEmail}>
              {t.otherEmail}
            </button>
            <button type="button" className={styles.link} disabled={busy || resendIn > 0} onClick={() => void requestCode()}>
              {resendIn > 0 ? t.newCodeIn(clock(resendIn)) : t.newCode}
            </button>
          </div>
        </form>
      ) : null}

      {step === "profile" ? (
        <form className={styles.form} onSubmit={verify} noValidate>
          {needs.name ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cl-name">
                {t.fullName}
              </label>
              <input id="cl-name" className={styles.input} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          ) : null}
          {needs.birth ? (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cl-birth">
                {t.birth}
              </label>
              <input id="cl-birth" className={styles.input} type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={birth} onChange={(e) => setBirth(e.target.value)} required />
            </div>
          ) : null}
          {needs.consent ? (
            <label className={styles.consent}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>
                {t.consent}{" "}
                <a href="/privacy" target="_blank" rel="noopener">
                  {t.privacy}
                </a>{" "}
                {t.and}{" "}
                <a href="/terms" target="_blank" rel="noopener">
                  {t.terms}
                </a>
                .
              </span>
            </label>
          ) : null}
          <button type="submit" className={styles.primary} disabled={busy}>
            {busy ? t.signingIn : t.continue}
          </button>
        </form>
      ) : null}

      {step === "email" && !gate ? (
        <div className={styles.row}>
          <span className={styles.hint}>{t.newHere}</span>
          <button type="button" className={styles.link} onClick={onCreate}>
            {t.createProfile}
          </button>
        </div>
      ) : null}
    </>
  );
}

function CreateProfile({ lang, params, onSignIn }: { lang: LoginLang; params: URLSearchParams | null; onSignIn: () => void }) {
  const t = TEXTS[lang];
  const [rule, setRule] = useState<GateCitizenshipRule>(DEFAULT_CITIZENSHIP_RULE);
  const [citizenship, setCitizenship] = useState<GateCitizenship>("eu_eea");
  const [birth, setBirth] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    // Which citizenship answers RecOS takes today; his rule B until it says otherwise.
    void fetch("/api/candidate-join-network")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { citizenship_rule?: unknown } | null) => setRule(parseCitizenshipRule(j?.citizenship_rule)))
      .catch(() => undefined);
    const refresh = () => {
      const until = Number(window.localStorage.getItem(GATE_COOLDOWN_KEY) || 0);
      setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    };
    refresh();
    const timer = window.setInterval(refresh, 500);
    return () => window.clearInterval(timer);
  }, []);

  const refused = !citizenshipAccepted(citizenship, rule);
  const options: readonly { value: GateCitizenship; label: string }[] =
    rule === "eu_eea_or_work_permit"
      ? [
          { value: "eu_eea", label: t.euEea },
          { value: "work_permit", label: t.workPermit },
          { value: "other", label: t.neither },
        ]
      : [
          { value: "eu_eea", label: t.euEea },
          { value: "other", label: t.neither },
        ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (remaining > 0 || refused) return;
    if (!birth) return setError(t.needBirth);
    if (!isAdult(birth)) return setError(t.underAge);
    if (!EMAIL.test(email.trim())) return setError(t.badEmail);
    if (!consent) return setError(t.needConsent);
    setBusy(true);
    setError("");
    const res = await fetch("/api/candidate-join-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        citizenship,
        date_of_birth: birth,
        consent: true,
        consent_text_version: GATE_CONSENT_TEXT_VERSION,
        source: gateSourceFrom(params ?? new URLSearchParams()),
        website,
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res || !res.ok) return setError(data?.error || t.tryAgain);
    window.localStorage.setItem(GATE_COOLDOWN_KEY, String(Date.now() + GATE_COOLDOWN_MS));
    setRemaining(60);
    setSent(true);
  }

  return (
    <>
      <Head title={t.createTitle} sub={t.createSub} />
      <form className={styles.form} onSubmit={submit} noValidate>
        <fieldset className={styles.field} style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className={styles.label} style={{ marginBottom: "0.5rem" }}>
            {t.citizenshipQ}
          </legend>
          <div className={styles.choices}>
            {options.map((o) => (
              <label key={o.value} className={`${styles.choice} ${citizenship === o.value ? styles.choiceOn : ""}`}>
                <input type="radio" name="cl-citizenship" value={o.value} checked={citizenship === o.value} onChange={() => setCitizenship(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
        {refused ? (
          <p className={styles.notice} role="status">
            {t.refused}
          </p>
        ) : (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cl-gate-birth">
                {t.birth}
              </label>
              <input id="cl-gate-birth" className={styles.input} type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={birth} onChange={(e) => setBirth(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cl-gate-email">
                {t.email}
              </label>
              <input id="cl-gate-email" className={styles.input} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-label={t.gateConsentLabel} />
              {/* The consent RecOS records is this English text, by its version; it is shown as recorded in either language. */}
              <span>
                {GATE_CONSENT_TEXT_LEAD}{" "}
                <a href="/privacy" target="_blank" rel="noopener">
                  privacy notice
                </a>
                .
              </span>
            </label>
            <p className={styles.hint}>{t.adult}</p>
            <div className={styles.hp} aria-hidden="true">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            {sent ? (
              <p className={styles.notice} role="status">
                {t.checkMail}
              </p>
            ) : null}
            {error ? (
              <div className={styles.error} role="alert">
                {error}
              </div>
            ) : null}
            <button type="submit" className={styles.primary} disabled={busy || remaining > 0}>
              {busy ? t.sending : remaining > 0 ? t.again(remaining) : t.createButton}
            </button>
          </>
        )}
      </form>
      <div className={styles.row}>
        <span className={styles.hint}>{t.haveProfile}</span>
        <button type="button" className={styles.link} onClick={onSignIn}>
          {t.signIn}
        </button>
      </div>
    </>
  );
}
