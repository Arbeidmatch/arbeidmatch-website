"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/site/Icon";
import { marketJobPath, PASS_REASONS, REPORT_REASONS, type MarketEventInput } from "@/lib/market-jobs/pure";
import type { FitAnswer, FitQuestion } from "@/lib/market-jobs/types";
import { workingDays } from "@/lib/numbers";

/**
 * How soon a report is checked, as the approved board promises it. The RecOS
 * numbers registry (ORDER 302) has no key for this promise yet; until it has,
 * this is the one place it is set, and it should move there.
 */
const REPORT_CHECK_DAYS = 1;

/** The address a shared job carries: the public site, the same on the server and in the browser. */
const SITE = "https://www.arbeidmatch.no";

/**
 * The parts of a market job page that a visitor presses (ORDER 514, boards 3
 * and 4). Every press goes to this site's own route, which adds the anonymous
 * visitor id and the secret and posts it on to RecOS; nothing here talks to
 * RecOS directly.
 */

function postEvent(id: string, event: MarketEventInput): Promise<boolean> {
  return fetch(`/api/market-jobs/${encodeURIComponent(id)}/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    // A press that leaves the page (Recommend me, Check source) still arrives.
    keepalive: true,
  })
    .then((res) => res.ok)
    .catch(() => false);
}

/** One view per page load. */
export function MarketViewBeacon({ id }: { id: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void postEvent(id, { kind: "view" });
  }, [id]);
  return null;
}

/**
 * A modal dialog on the native element: Escape closes it, focus moves in when
 * it opens and back to the button that opened it when it closes.
 */
function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      opener.current = document.activeElement;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="mj-dlg"
      aria-labelledby={titleId}
      onClose={() => {
        onClose();
        if (opener.current instanceof HTMLElement) opener.current.focus();
      }}
      onClick={(e) => {
        // A press on the backdrop (the dialog element itself, outside its panel) closes it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mj-dlg-p">
        <h2 id={titleId} className="mj-dlg-t">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

/** Check source: the only place the source of the advert is named. */
export function CheckSourceButton({ id, url }: { id: string; url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
        Check source
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Check source">
        <p>
          The advert opens on arbeidsplassen.nav.no, where the employer posted it. We checked the employer in the Norwegian business register before
          the job appeared here.
        </p>
        <p>
          Applying directly: your application goes straight to the employer, and the process is between you and them. ArbeidMatch follows up only
          the candidates it recommends. To be recommended, press Back and choose Register free.
        </p>
        <div className="mj-dlg-a">
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
            Back
          </button>
          <button
            type="button"
            className="btn navy"
            onClick={() => {
              void postEvent(id, { kind: "check_source" });
              window.open(url, "_blank", "noopener,noreferrer");
              setOpen(false);
            }}
          >
            Continue
          </button>
        </div>
      </Dialog>
    </>
  );
}

const REGISTER = (id: string) => `/candidate-register?job=${encodeURIComponent(id)}`;

type FitState = "idle" | "busy" | "failed" | FitAnswer;

/**
 * Check if I fit (ORDER 514, rules 13, 14 and 20; board 3): a yes or no for each
 * requirement of the job. RecOS answers the button: all met, Recommend me (the
 * visitor registers with the job named); missing only what can be added on the
 * spot, register and add it; anything else, Jobs that fit me and no
 * recommendation for this job.
 */
function FitDialog({ id, questions, open, onClose }: { id: string; questions: FitQuestion[]; open: boolean; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<FitState>("idle");
  const left = questions.filter((q) => answers[q.id] === undefined).length;

  async function check(next: Record<string, boolean>) {
    if (questions.some((q) => next[q.id] === undefined)) {
      setState("idle");
      return;
    }
    setState("busy");
    try {
      const res = await fetch(`/api/market-jobs/${encodeURIComponent(id)}/fit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState((await res.json()) as FitAnswer);
    } catch {
      setState("failed");
    }
  }

  function answer(qid: string, yes: boolean) {
    const next = { ...answers, [qid]: yes };
    setAnswers(next);
    void check(next);
  }

  const verdict = typeof state === "object" ? state.verdict : null;
  const total = questions.length;
  const result =
    state === "failed"
      ? "We could not check right now. Try again in a moment."
      : state === "busy"
        ? "Checking..."
        : left > 0
          ? `Answer the ${left} question${left === 1 ? "" : "s"} left to see your result.`
          : verdict?.state === "fits"
            ? `You meet all ${total} requirements. Press Recommend me.`
            : verdict?.state === "add"
              ? `You meet ${verdict.met} of ${total}. What is missing can be added to your profile: register free, add it, and we check again.`
              : verdict
                ? `You meet ${verdict.met} of ${total}. We recommend candidates who meet all the requirements of this job. See the jobs that fit what you have.`
                : "";

  return (
    <Dialog open={open} onClose={onClose} title="Check if I fit">
      <ol className="mj-fit">
        {questions.map((q) => (
          <li key={q.id}>
            <p>{q.text}</p>
            <div className="mj-fit-a" role="group" aria-label={q.text}>
              <button type="button" className={`btn ${answers[q.id] === true ? "navy" : "ghost"}`} aria-pressed={answers[q.id] === true} onClick={() => answer(q.id, true)}>
                Yes
              </button>
              <button type="button" className={`btn ${answers[q.id] === false ? "navy" : "ghost"}`} aria-pressed={answers[q.id] === false} onClick={() => answer(q.id, false)}>
                No
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p className={`mj-fit-r${verdict?.state === "fits" ? " ok" : ""}`} role="status" aria-live="polite">
        {result}
      </p>
      {verdict?.state === "jobs_that_fit" && typeof state === "object" && state.jobsThatFit.length ? (
        <ul className="mj-fit-jobs">
          {state.jobsThatFit.map((j) => (
            <li key={j.id}>
              <a href={marketJobPath(j.id)}>
                {j.title}
                {j.place ? `, ${j.place}` : ""}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mj-dlg-a">
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
        {verdict?.state === "fits" ? (
          <a className="btn gold" href={REGISTER(id)} onClick={() => void postEvent(id, { kind: "recommend" })}>
            Recommend me
          </a>
        ) : verdict?.state === "add" ? (
          <a className="btn gold" href={REGISTER(id)}>
            Register free
          </a>
        ) : verdict?.state === "jobs_that_fit" ? (
          <a className="btn navy" href="/jobs">
            Jobs that fit me
          </a>
        ) : null}
      </div>
    </Dialog>
  );
}

/** Recommend me opens Check if I fit first (rule 13); a job without stated requirements goes straight to registration. */
export function RecommendButton({ id, fit = [], className = "btn gold", label = "Recommend me" }: { id: string; fit?: FitQuestion[]; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!fit.length) {
    return (
      <a className={className} href={REGISTER(id)} onClick={() => void postEvent(id, { kind: "recommend" })}>
        {label}
      </a>
    );
  }
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? <FitDialog id={id} questions={fit} open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ReasonForm({
  reasons,
  name,
  noteLabel,
  noteRequiredFor,
  onCancel,
  onSend,
}: {
  reasons: Array<{ key: string; label: string }>;
  name: string;
  noteLabel: (needed: boolean) => string;
  noteRequiredFor: string;
  onCancel: () => void;
  onSend: (reason: string, note: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const noteId = useId();
  const needsNote = reason === noteRequiredFor;
  const valid = Boolean(reason) && (!needsNote || note.trim().length > 0);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || busy) return;
        setBusy(true);
        await onSend(reason, note.trim());
        setBusy(false);
      }}
    >
      <fieldset className="mj-reasons">
        <legend className="sr-only">Reason</legend>
        {reasons.map((r) => (
          <label key={r.key} className="mj-reason">
            <input type="radio" name={name} value={r.key} checked={reason === r.key} onChange={() => setReason(r.key)} required />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="mj-note" htmlFor={noteId}>
        {noteLabel(needsNote)}
      </label>
      <textarea id={noteId} className="mj-ta" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} required={needsNote} />
      <div className="mj-dlg-a">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn navy" disabled={!valid || busy} aria-disabled={!valid || busy}>
          Send
        </button>
      </div>
    </form>
  );
}

/** Report this advert, at the foot of the page. */
export function ReportAdvert({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button type="button" className="mj-report" onClick={() => setOpen(true)}>
        <Icon name="flag" />
        Report this advert
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setDone(false);
          setFailed(false);
        }}
        title="Report this advert"
      >
        {done ? (
          <>
            <p role="status">Thank you. We check it within {workingDays(REPORT_CHECK_DAYS, "en")}.</p>
            <div className="mj-dlg-a">
              <button type="button" className="btn navy" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Choose a reason. It goes to our team.</p>
            {failed ? <p role="alert" className="mj-err">The report could not be sent just now. Please try again.</p> : null}
            <ReasonForm
              reasons={REPORT_REASONS}
              name="report-reason"
              noteRequiredFor="other"
              noteLabel={(needed) => (needed ? "What is wrong (required)" : "Anything else (optional)")}
              onCancel={() => setOpen(false)}
              onSend={async (reason, note) => {
                const ok = await postEvent(id, { kind: "report", reason, ...(note ? { note } : {}) });
                setFailed(!ok);
                setDone(ok);
              }}
            />
          </>
        )}
      </Dialog>
    </>
  );
}

function ShareLinks({ id, title, onShare }: { id: string; title: string; onShare: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE}${marketJobPath(id)}`;
  const text = `${title}: ${url}`;
  return (
    <div className="mj-share">
      <button
        type="button"
        className="btn ghost"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setCopied(false);
          }
          onShare();
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" onClick={onShare}>
        WhatsApp
      </a>
      <a className="btn ghost" href={`fb-messenger://share/?link=${encodeURIComponent(url)}`} onClick={onShare}>
        Messenger
      </a>
      <a className="btn ghost" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`} onClick={onShare}>
        E-mail
      </a>
      <span className="sr-only" role="status">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

/**
 * Keep, Interested, Pass and Send, with Hide and Actions. Open on a computer,
 * hidden on a phone until Actions is pressed (CSS decides until the visitor does).
 */
export function MarketActionRail({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState<boolean | null>(null);
  const [kept, setKept] = useState(false);
  const [interested, setInterested] = useState(false);
  const [passed, setPassed] = useState(false);
  const [dialog, setDialog] = useState<"pass" | "send" | null>(null);
  const shared = useRef(false);
  const state = open === null ? "auto" : open ? "open" : "closed";
  return (
    <div className="mj-rail" data-open={state}>
      <div className="mj-rail-b" id={`mj-actions-${id}`}>
        <button
          type="button"
          className="mj-act"
          aria-pressed={kept}
          onClick={() => {
            if (!kept) void postEvent(id, { kind: "keep" });
            setKept(true);
          }}
        >
          <Icon name="badge" />
          {kept ? "Kept" : "Keep"}
        </button>
        <button
          type="button"
          className="mj-act"
          aria-pressed={interested}
          onClick={() => {
            if (!interested) void postEvent(id, { kind: "interested" });
            setInterested(true);
          }}
        >
          <Icon name="check" />
          Interested
        </button>
        <button type="button" className="mj-act" aria-pressed={passed} onClick={() => setDialog("pass")}>
          <Icon name="x" />
          {passed ? "Passed" : "Pass"}
        </button>
        <button type="button" className="mj-act" onClick={() => setDialog("send")}>
          <Icon name="arrow" />
          Send
        </button>
      </div>
      <button
        type="button"
        className="mj-rail-t"
        aria-controls={`mj-actions-${id}`}
        aria-expanded={state === "open" ? true : state === "closed" ? false : undefined}
        onClick={() => {
          const shownNow = open ?? window.matchMedia("(min-width: 761px)").matches;
          setOpen(!shownNow);
        }}
      >
        <span className="mj-hide">Hide</span>
        <span className="mj-show">Actions</span>
      </button>

      <Dialog open={dialog === "pass"} onClose={() => setDialog(null)} title="Why pass?">
        <p>Choose a reason. It goes to our team and helps us show better jobs.</p>
        <ReasonForm
          reasons={PASS_REASONS}
          name="pass-reason"
          noteRequiredFor="other"
          noteLabel={(needed) => (needed ? "Tell us why (required)" : "Anything else (optional)")}
          onCancel={() => setDialog(null)}
          onSend={async (reason, note) => {
            await postEvent(id, { kind: "pass", reason, ...(note ? { note } : {}) });
            setPassed(true);
            setDialog(null);
          }}
        />
      </Dialog>

      <Dialog open={dialog === "send"} onClose={() => setDialog(null)} title="Send to a friend">
        <p>Know someone with this trade? Send them the job.</p>
        <ShareLinks
          id={id}
          title={title}
          onShare={() => {
            if (shared.current) return;
            shared.current = true;
            void postEvent(id, { kind: "send" });
          }}
        />
        <div className="mj-dlg-a">
          <button type="button" className="btn ghost" onClick={() => setDialog(null)}>
            Close
          </button>
        </div>
      </Dialog>
    </div>
  );
}
