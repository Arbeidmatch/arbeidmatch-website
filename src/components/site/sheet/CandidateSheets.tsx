"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { SITE_PATHS } from "@/components/site/siteNav";
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
import { TRADES } from "@/lib/trades";

import { AreaRow, ConsentSwitch, Done, Group, Hint, InputRow, NavRow, OptionRow, PrivacySwitch, Segmented } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";
import { useSiteNumbers } from "@/components/NumbersProvider";
import { num, replySentence, workingDays } from "@/lib/numbers";

/**
 * The candidate sheets of the approved mockup (ORDER 295, stage 3), in English.
 * Each one is the live form it replaces, presented as a sheet: the same fields,
 * the same consents, the same checks, posted to the same route. Where the
 * mockup drew fewer or other fields than the live form has, the live form won.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Foot({ error, label, busy, onClick, note }: { error: string; label: string; busy?: boolean; onClick: () => void; note?: string }) {
  return (
    <>
      {error ? (
        <p className="sh-err" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" className="btn gold" onClick={onClick} disabled={busy}>
        {label}
      </button>
      {note ? <p>{note}</p> : null}
    </>
  );
}

/**
 * "Job alerts": the live newsletter signup of /newsletter#candidates. E-mail,
 * trade, the wish for the e-mails and the consent to store them, posted to
 * /api/newsletter with the same honeypot.
 */
export function AlertsSheet({ open, close }: SheetProps) {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [notifyConsent, setNotifyConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [inSub, setInSub] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (status === "done") return close();
    if (!EMAIL.test(email.trim())) return setError("Enter a valid e-mail address.");
    if (!trade) return setError("Choose your trade.");
    if (!notifyConsent || !dataConsent) return setError("Turn on both confirmations to start the alerts.");
    setError("");
    setStatus("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), trade, notifyConsent, dataConsent, website }),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json().catch(() => ({}))) as { success?: boolean };
      if (!response.ok || result.success !== true) throw new Error("signup_failed");
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("We could not confirm your signup. Please try again.");
    }
  }

  return (
    <SheetFrame
      open={open}
      lang="en"
      title="Job alerts"
      sub={
        inSub
          ? {
              title: "Trade",
              content: (
                <Group>
                  {TRADES.map((t) => (
                    <OptionRow
                      key={t.name}
                      label={t.name}
                      chosen={trade === t.name}
                      onPick={() => {
                        setTrade(t.name);
                        setInSub(false);
                      }}
                    />
                  ))}
                </Group>
              ),
            }
          : null
      }
      onBack={() => setInSub(false)}
      onClose={close}
      footer={
        <Foot
          error={error}
          busy={status === "sending"}
          onClick={() => void submit()}
          label={status === "done" ? "Close" : status === "sending" ? "Saving..." : "Start alerts"}
          note={status === "done" ? undefined : "Optional and free. No profile needed. This signup is not a job application."}
        />
      }
    >
      {status === "done" ? (
        <Done title="You are signed up for job alerts." text="We will e-mail you when we publish new jobs in your trade. You can unsubscribe with the link in each alert." />
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Group>
            <NavRow icon="wrench" label="Trade" value={trade || "Choose"} onClick={() => setInSub(true)} />
          </Group>
          <Group>
            <InputRow id="am-alerts-email" icon="mail" label="E-mail" type="email" inputMode="email" autoComplete="email" maxLength={200} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <ConsentSwitch label="E-mail me new jobs in my trade" checked={notifyConsent} onChange={setNotifyConsent}>
              E-mail me new jobs in my trade. I can unsubscribe at any time.
            </ConsentSwitch>
            <ConsentSwitch label="I agree that ArbeidMatch stores my e-mail and trade to provide these alerts" checked={dataConsent} onChange={setDataConsent}>
              I agree that ArbeidMatch stores my e-mail and trade to provide these alerts. Read the <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">privacy notice</a>.
            </ConsentSwitch>
          </Group>
          <div className="hp" aria-hidden="true">
            <label>
              Leave empty
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
        </form>
      )}
    </SheetFrame>
  );
}

const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = "arbeidmatch-candidate-request-cooldown";

/**
 * "Create your profile": the one entry gate for new candidates (ORDER 396).
 * In his order, as one sheet: citizenship, date of birth (18 or older),
 * e-mail, and one consent that says exactly what is accepted, with the privacy
 * link in it. The source it was opened with (a job, a recruiter's link, a
 * referral, the bot's click) travels with the answers. Posted to
 * /api/candidate-join-network, which asks RecOS for a single-use token; the
 * letter's button carries it to the profile. The one-minute pause between
 * requests and the honeypot stay.
 */
export function RegisterSheet({ open, close, preset }: SheetProps) {
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
  // Opened from a door that named itself, or from the address bar of the page it sits on (sheets open only in the browser).
  const [source] = useState(() => preset.source ?? (typeof window === "undefined" ? "site" : gateSourceFrom(new URLSearchParams(window.location.search))));

  useEffect(() => {
    const refresh = () => {
      const until = Number(window.localStorage.getItem(COOLDOWN_KEY) || 0);
      setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    };
    refresh();
    const timer = window.setInterval(refresh, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Which citizenship answers RecOS takes today; until it says, the EU/EEA rule this sheet always showed.
    void fetch("/api/candidate-join-network")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { citizenship_rule?: unknown } | null) => setRule(parseCitizenshipRule(j?.citizenship_rule)))
      .catch(() => undefined);
  }, []);

  const refused = !citizenshipAccepted(citizenship, rule);

  async function submit() {
    if (sent && remaining <= 0) setSent(false);
    if (remaining > 0 || refused) return;
    if (!birth) return setError("Give your date of birth.");
    if (!isAdult(birth)) return setError("You must be 18 or older to create a profile.");
    if (!EMAIL.test(email.trim())) return setError("Enter a valid e-mail address.");
    if (!consent) return setError("Turn on the consent to continue.");
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
        source,
        website,
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    if (!res || !res.ok) return setError(data?.error || "Please try again.");
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
    setRemaining(60);
    setSent(true);
  }

  const counter = `You can send another request in ${remaining}s.`;
  const label = busy ? "Sending..." : remaining > 0 ? counter : sent ? "Send another request" : "Create profile";
  const options: readonly { value: GateCitizenship; label: string }[] =
    rule === "eu_eea_or_work_permit"
      ? [
          { value: "eu_eea", label: "EU/EEA" },
          { value: "work_permit", label: "Work permit" },
          { value: "other", label: "Neither" },
        ]
      : [
          { value: "eu_eea", label: "Yes, I am" },
          { value: "other", label: "No, I am not" },
        ];

  return (
    <SheetFrame
      open={open}
      lang="en"
      title="Create your profile"
      sub={null}
      onBack={close}
      onClose={close}
      footer={
        refused ? (
          <Foot error="" label="Close" onClick={close} />
        ) : (
          <Foot error={error} busy={busy || remaining > 0} onClick={() => void submit()} label={label} note="Creating a profile does not apply you for a job. We e-mail you a link to continue." />
        )
      }
    >
      <Group label={rule === "eu_eea_or_work_permit" ? "Are you an EU/EEA citizen, or do you hold a Norwegian work permit?" : "Are you an EU/EEA citizen?"}>
        <div className="row">
          <Segmented label="Citizenship" options={options} value={citizenship} onChange={setCitizenship} />
        </div>
      </Group>
      {refused ? (
        <Hint>
          {rule === "eu_eea_or_work_permit"
            ? "At this time, ArbeidMatch accepts candidate profiles only from EU/EEA citizens and holders of a Norwegian work permit."
            : "At this time, ArbeidMatch accepts candidate profiles only from EU/EEA citizens (passport or national ID card)."}
        </Hint>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
          style={{ display: "contents" }}
        >
          {sent ? (
            <p className="hint" role="status">
              Check your e-mail for the profile link. {remaining > 0 ? counter : "You may send another request if you entered the wrong e-mail."}
            </p>
          ) : null}
          <Group label="Date of birth">
            <InputRow id="am-register-birth" label="Born" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} value={birth} onChange={(e) => setBirth(e.target.value)} required />
          </Group>
          <Group>
            <InputRow id="am-register-email" icon="mail" label="E-mail" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Group>
          <Group>
            <ConsentSwitch label="I agree to how ArbeidMatch handles my data" checked={consent} onChange={setConsent}>
              {GATE_CONSENT_TEXT_LEAD}{" "}
              <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">
                privacy notice
              </a>
              .
            </ConsentSwitch>
          </Group>
          <Hint>You must be 18 or older.</Hint>
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

const MESSAGE_SUBJECTS = ["A job I saw", "My application", "My profile or CV", "Norwegian courses", "Something else"] as const;

/**
 * "Send a message", from a candidate: the live support request
 * (SupportRequest, /api/support-report) with the subject chosen from a list,
 * so the message reaches the right person. Same minimums, same honeypot, same
 * human check by the time the form was drawn.
 */
export function MessageSheet({ open, close, preset }: SheetProps) {
  // ORDER 302: the reply promise is RecOS's; with no value the note goes and the thanks ends at its first sentence.
  const numbers = useSiteNumbers();
  const reply = replySentence(numbers, "en");
  const replyDays = workingDays(num(numbers, "reply_promise_contact"), "en");
  const initial = MESSAGE_SUBJECTS.find((s) => s === preset.about) ?? "";
  const [about, setAbout] = useState<string>(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [detail, setDetail] = useState("");
  const [readNotice, setReadNotice] = useState(false);
  const [trap, setTrap] = useState("");
  const [inSub, setInSub] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const renderedAt = useRef("");
  useEffect(() => {
    renderedAt.current = String(Date.now());
  }, []);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (status === "done") return close();
    if (!email.includes("@") || !about || detail.trim().length < 10) return setError("Fill in your e-mail, the subject and a message of at least 10 characters.");
    if (!readNotice) return setError("Confirm that you have read the privacy notice.");
    setError("");
    setStatus("sending");
    const page = typeof window === "undefined" ? "" : window.location.pathname;
    const who = name.trim() ? `Name: ${name.trim()}\n\n` : "";
    const res = await fetch("/api/support-report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "question",
        service: "platform",
        email: email.trim(),
        title: `Candidate: ${about}`.slice(0, 200),
        detail: `${who}${detail.trim()}\n\nSent from arbeidmatch.no${page} (en).`.slice(0, 4000),
        company_website: trap,
        form_rendered_at: renderedAt.current,
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { ok?: boolean; ref?: string } | undefined;
    if (res && res.ok && data?.ok !== false) {
      setReference(typeof data?.ref === "string" ? data.ref : "");
      setStatus("done");
      return;
    }
    setStatus("idle");
    setError(res?.status === 429 ? "Too many messages from here. Please try again later." : "The message could not be sent. Please try again.");
  }

  return (
    <SheetFrame
      open={open}
      lang="en"
      title="Send a message"
      sub={
        inSub
          ? {
              title: "About",
              content: (
                <Group>
                  {MESSAGE_SUBJECTS.map((s) => (
                    <OptionRow
                      key={s}
                      label={s}
                      chosen={about === s}
                      onPick={() => {
                        setAbout(s);
                        setInSub(false);
                      }}
                    />
                  ))}
                </Group>
              ),
            }
          : null
      }
      onBack={() => setInSub(false)}
      onClose={close}
      footer={
        <Foot
          error={error}
          busy={status === "sending"}
          onClick={() => void submit()}
          label={status === "done" ? "Close" : status === "sending" ? "Sending..." : "Send message"}
          note={status === "done" ? undefined : reply ?? undefined}
        />
      }
    >
      {status === "done" ? (
        <Done title="Thank you." text={`${replyDays ? `We have your message and reply within ${replyDays}.` : "We have your message."}${reference ? ` Reference: ${reference}.` : ""}`} />
      ) : (
        <form onSubmit={submit} noValidate style={{ display: "contents" }}>
          <Group>
            <InputRow id="am-msg-name" icon="user" label="Name" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <InputRow id="am-msg-email" icon="mail" label="E-mail" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <NavRow icon="help" label="About" value={about || "Choose"} onClick={() => setInSub(true)} />
          </Group>
          <Group>
            <AreaRow id="am-msg-detail" label="Message" rows={4} maxLength={3800} placeholder="Write your message here" value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Group>
          <Group>
            <PrivacySwitch lang="en" checked={readNotice} onChange={setReadNotice} />
          </Group>
          <div className="hp" aria-hidden="true">
            <label>
              Company website
              <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </label>
          </div>
        </form>
      )}
    </SheetFrame>
  );
}
