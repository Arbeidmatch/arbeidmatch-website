"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Flag, X } from "lucide-react";

/**
 * The contact form's popups (ORDER 44, 5 October 2026): every refusal and
 * redirection is said here, on the page, and never by mail.
 *
 * Where an error is possible (Brreg found nothing, VIES did not answer, the
 * form could not be sent) a small flag in the corner opens on hover or tap:
 * feedback, or a fault report, sent to our support door with its limits.
 * Policy refusals carry no flag: they are not errors.
 */
export function ContactPopup({
  title,
  children,
  onClose,
  flagContext,
  replyEmail,
  lang = "nb",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Set only where something may have gone wrong; names what the visitor saw. */
  flagContext?: string;
  replyEmail?: string;
  /** The language of the door the visitor is at; the flag's words follow it. */
  lang?: "nb" | "en";
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 px-4 pb-4 sm:items-center sm:pb-0" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-[rgba(201,168,76,0.3)] bg-[#0D1B2A] p-6 text-white shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {flagContext ? <SupportFlag context={flagContext} replyEmail={replyEmail} lang={lang} /> : null}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={lang === "en" ? "Close" : "Lukk"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <h2 className="pr-24 text-lg font-semibold">{title}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/80">{children}</div>
      </div>
    </div>
  );
}

/** The flag's words, in the language of the door (W1: a foreign company reads English throughout). */
const FLAG_COPY = {
  nb: {
    open: "Gi tilbakemelding eller kontakt support",
    feedback: "Gi tilbakemelding",
    support: "Kontakt support (feil)",
    choices: {
      feedback: ["Søket fant ikke firmaet vårt", "Skjemaet var vanskelig å bruke", "Annet"],
      support: ["Firmaet finnes, men søket finner det ikke", "MVA-nummeret er gyldig, men ble ikke godkjent", "Skjemaet kan ikke sendes", "Annet"],
    },
    note: "Kort kommentar (valgfritt)",
    email: "E-post",
    sent: "Takk, vi har mottatt det.",
    failed: "Kunne ikke sende. Prøv igjen.",
    sending: "Sender…",
    send: "Send",
  },
  en: {
    open: "Give feedback or contact support",
    feedback: "Give feedback",
    support: "Contact support (fault)",
    choices: {
      feedback: ["The form was hard to use", "Something on the page is unclear", "Other"],
      support: ["The VAT number is valid but was not accepted", "The form cannot be sent", "Other"],
    },
    note: "Short comment (optional)",
    email: "Email",
    sent: "Thank you, we have received it.",
    failed: "Could not send. Please try again.",
    sending: "Sending…",
    send: "Send",
  },
} as const;

function SupportFlag({ context, replyEmail, lang }: { context: string; replyEmail?: string; lang: "nb" | "en" }) {
  const t = FLAG_COPY[lang];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"feedback" | "support" | null>(null);
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState(replyEmail ?? "");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const renderedAt = useRef("");
  useEffect(() => {
    renderedAt.current = String(Date.now());
  }, []);

  async function send() {
    if (!mode || !choice || !email.includes("@")) return;
    setState("sending");
    setError("");
    const res = await fetch("/api/support-report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: mode === "feedback" ? "question" : "problem",
        service: "platform",
        email,
        title: `arbeidmatch.no/contact: ${choice}`.slice(0, 200),
        detail: `${context}\n\n${note.trim() || "(no comment)"}`.slice(0, 4000),
        company_website: "",
        form_rendered_at: renderedAt.current,
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined;
    if (res && res.ok && data?.ok !== false) setState("sent");
    else {
      setState("error");
      setError(lang === "en" ? data?.error ?? t.failed : t.failed);
    }
  }

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t.open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/60 hover:text-[#C9A84C]"
      >
        <Flag className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-10 w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-[rgba(201,168,76,0.3)] bg-[#0f2133] p-3 text-[14px] shadow-xl">
          {state === "sent" ? (
            <p role="status">{t.sent}</p>
          ) : !mode ? (
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => setMode("feedback")} className="min-h-11 rounded-lg px-3 text-left hover:bg-white/5">
                {t.feedback}
              </button>
              <button type="button" onClick={() => setMode("support")} className="min-h-11 rounded-lg px-3 text-left hover:bg-white/5">
                {t.support}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {t.choices[mode].map((c) => (
                <label key={c} className="flex min-h-11 items-center gap-2">
                  <input type="radio" name="flag-choice" checked={choice === c} onChange={() => setChoice(c)} />
                  {c}
                </label>
              ))}
              <input
                type="text"
                value={note}
                maxLength={300}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.note}
                className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-3"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email}
                className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-3"
              />
              {state === "error" ? <p className="text-[13px] text-[#f0a8a8]">{error}</p> : null}
              <button
                type="button"
                disabled={!choice || !email.includes("@") || state === "sending"}
                onClick={() => void send()}
                className="min-h-11 rounded-lg bg-[#C9A84C] px-3 font-semibold text-[#0D1B2A] disabled:opacity-50"
              >
                {state === "sending" ? t.sending : t.send}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
