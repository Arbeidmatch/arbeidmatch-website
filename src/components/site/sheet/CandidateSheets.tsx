"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { SITE_PATHS } from "@/components/site/siteNav";
import { candidateJoinPayload } from "@/lib/candidateJoinConsent";
import { TRADES } from "@/lib/trades";

import { AreaRow, ConsentSwitch, Done, Group, Hint, InputRow, NavRow, OptionRow, PrivacySwitch, Segmented } from "./rows";
import type { SheetProps } from "./SheetHost";
import { SheetFrame } from "./SheetFrame";

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
 * "Create your profile": the live request of /candidate-register. The EU/EEA
 * question, the e-mail, the consent and the citizenship confirmation, the
 * final citizenship confirmation as a sub-panel, the one-minute pause between
 * requests (the same key as the page) and the honeypot, posted to
 * /api/candidate-join-network. The link it sends continues in the profile.
 */
export function RegisterSheet({ open, close }: SheetProps) {
  const [eligible, setEligible] = useState<"yes" | "no">("yes");
  const [email, setEmail] = useState("");
  const [gdpr, setGdpr] = useState(false);
  const [citizen, setCitizen] = useState(false);
  const [website, setWebsite] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const until = Number(window.localStorage.getItem(COOLDOWN_KEY) || 0);
      setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    };
    refresh();
    const timer = window.setInterval(refresh, 500);
    return () => window.clearInterval(timer);
  }, []);

  function ask() {
    if (sent && remaining <= 0) setSent(false);
    if (remaining > 0) return;
    if (eligible === "no") return;
    if (!EMAIL.test(email.trim())) return setError("Enter a valid e-mail address.");
    if (!gdpr || !citizen) return setError("Please complete both confirmations.");
    setError("");
    setConfirming(true);
  }

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/candidate-join-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...candidateJoinPayload({ email, consent: gdpr, euEeaCitizen: citizen }), website }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    setConfirming(false);
    if (!res || !res.ok) return setError(data?.error || "Please try again.");
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
    setRemaining(60);
    setSent(true);
  }

  const counter = `You can send another request in ${remaining}s.`;
  const label = busy ? "Sending..." : remaining > 0 ? counter : sent ? "Send another request" : "Create profile";

  return (
    <SheetFrame
      open={open}
      lang="en"
      title="Create your profile"
      sub={
        confirming
          ? {
              title: "Citizenship",
              content: (
                <>
                  <Hint>
                    Only EU/EEA citizens can be accepted, shown by a valid passport or national ID card. If this cannot be confirmed, the profile will not be accepted in our recruitment system.
                  </Hint>
                  <button type="button" className="btn gold" style={{ width: "100%" }} onClick={() => void submit()} disabled={busy}>
                    {busy ? "Sending..." : "I confirm"}
                  </button>
                  <button type="button" className="btn ghost" style={{ width: "100%" }} onClick={() => setConfirming(false)}>
                    Go back
                  </button>
                </>
              ),
            }
          : null
      }
      onBack={() => setConfirming(false)}
      onClose={close}
      footer={
        eligible === "no" ? (
          <Foot error="" label="Close" onClick={close} />
        ) : (
          <Foot error={error} busy={busy || remaining > 0} onClick={ask} label={label} note="Creating a profile does not apply you for a job. We e-mail you a link to continue." />
        )
      }
    >
      <Group label="Are you an EU/EEA citizen?">
        <div className="row">
          <Segmented
            label="Are you an EU/EEA citizen?"
            options={[
              { value: "yes", label: "Yes, I am" },
              { value: "no", label: "No, I am not" },
            ]}
            value={eligible}
            onChange={setEligible}
          />
        </div>
      </Group>
      {eligible === "no" ? (
        <Hint>At this time, ArbeidMatch accepts candidate profiles only from EU/EEA citizens (passport or national ID card).</Hint>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          noValidate
          style={{ display: "contents" }}
        >
          {sent ? (
            <p className="hint" role="status">
              Check your e-mail for the profile link. {remaining > 0 ? counter : "You may send another request if you entered the wrong e-mail."}
            </p>
          ) : null}
          <Group>
            <InputRow id="am-register-email" icon="mail" label="E-mail" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Group>
          <Group>
            <ConsentSwitch label="I consent to ArbeidMatch processing this request and my e-mail address" checked={gdpr} onChange={setGdpr}>
              I consent to ArbeidMatch processing this request and my e-mail address, so that ArbeidMatch can create my candidate profile and contact me about opportunities. Read how we handle your data in our <a className="plink" href={SITE_PATHS.privacy} target="_blank" rel="noopener">privacy notice</a>.
            </ConsentSwitch>
            <ConsentSwitch label="I confirm that I am an EU/EEA citizen" checked={citizen} onChange={setCitizen}>
              I confirm that I am an EU/EEA citizen (passport or national ID card).
            </ConsentSwitch>
          </Group>
          <Hint>
            When you send, your e-mail address and these confirmations are recorded as your consent, so we can create your candidate profile and contact you about opportunities.
          </Hint>
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
          note={status === "done" ? undefined : "We reply within one working day."}
        />
      }
    >
      {status === "done" ? (
        <Done title="Thank you." text={`We have your message and reply within one working day.${reference ? ` Reference: ${reference}.` : ""}`} />
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
