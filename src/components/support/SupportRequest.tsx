"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LifeBuoy } from "lucide-react";

import { ContactPopup } from "@/components/contact/ContactPopup";

/**
 * "Contact support" instead of an e-mail address (W1, his report of 6 October
 * 2026: "iar in loc de epost sa fie treaba cu support").
 *
 * The button opens a short request on the page itself. It goes through the
 * site's /api/support-report proxy to the ATS's own support door, with its
 * human check and its limits, so it lands in RecOS support and no mailbox is
 * shown or revealed anywhere. The only addresses left on the site are the ones
 * the law asks for (the imprint in the footer, the privacy contacts).
 */

export type SupportLang = "nb" | "en";

export const SUPPORT_COPY = {
  nb: {
    heading: "Kundestøtte",
    button: "Kontakt support",
    title: "Kontakt support",
    email: "E-post",
    emailPlaceholder: "navn@firma.no",
    subject: "Emne",
    subjectPlaceholder: "Kort om saken",
    detail: "Hva gjelder det?",
    detailPlaceholder: "Beskriv saken med noen ord.",
    send: "Send",
    sending: "Sender…",
    sent: "Takk, vi har mottatt henvendelsen.",
    reference: "Referanse",
    required: "Fyll inn e-post, et kort emne og noen ord om saken.",
    tooMany: "Du har sendt flere henvendelser i dag. Vi svarer på dem først.",
    failed: "Vi kunne ikke sende henvendelsen. Prøv igjen.",
  },
  en: {
    heading: "Support",
    button: "Contact support",
    title: "Contact support",
    email: "Email",
    emailPlaceholder: "name@example.com",
    subject: "Subject",
    subjectPlaceholder: "In a few words",
    detail: "What is it about?",
    detailPlaceholder: "Describe the matter in a few words.",
    send: "Send",
    sending: "Sending…",
    sent: "Thank you, we have received your request.",
    reference: "Reference",
    required: "Please fill in your email, a short subject and a few words about the matter.",
    tooMany: "You have already sent several requests today. We will answer those first.",
    failed: "We could not send your request. Please try again.",
  },
} as const satisfies Record<SupportLang, Record<string, string>>;

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[15px] text-white placeholder:text-white/45 focus:border-[#C9A84C] focus:outline-none";

/** The button that opens a support request. Styled by the caller, so it fits a footer, a banner or a card. */
export function SupportButton({
  lang,
  className,
  children,
  autoOpen = false,
  showIcon = true,
}: {
  lang: SupportLang;
  className?: string;
  /** The button's words, when the place needs other than "Contact support". */
  children?: ReactNode;
  /** Opens on arrival, for links like /contact?support=1. */
  autoOpen?: boolean;
  showIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const shown = open || (autoOpen && !dismissed);
  const close = () => {
    setOpen(false);
    setDismissed(true);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} data-support-button="">
        {showIcon ? <LifeBuoy className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden /> : null}
        {children ?? SUPPORT_COPY[lang].button}
      </button>
      {/* In a portal: the button may sit inside another form, and forms do not nest. */}
      {shown ? createPortal(<SupportRequestPopup lang={lang} onClose={close} />, document.body) : null}
    </>
  );
}

function SupportRequestPopup({ lang, onClose }: { lang: SupportLang; onClose: () => void }) {
  const t = SUPPORT_COPY[lang];
  // When the form was drawn, for the support door's human check.
  const renderedAt = useRef("");
  useEffect(() => {
    renderedAt.current = String(Date.now());
  }, []);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@") || subject.trim().length < 3 || detail.trim().length < 10) {
      setState("error");
      setError(t.required);
      return;
    }
    setState("sending");
    setError("");
    const page = typeof window === "undefined" ? "" : window.location.pathname;
    const res = await fetch("/api/support-report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "question",
        service: "platform",
        email: email.trim(),
        title: subject.trim().slice(0, 200),
        detail: `${detail.trim()}\n\nSent from arbeidmatch.no${page} (${lang}).`.slice(0, 4000),
        company_website: trap,
        form_rendered_at: renderedAt.current,
      }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { ok?: boolean; ref?: string } | undefined;
    if (res && res.ok && data?.ok !== false) {
      setReference(typeof data?.ref === "string" ? data.ref : "");
      setState("sent");
      return;
    }
    setState("error");
    setError(res?.status === 429 ? t.tooMany : t.failed);
  }

  return (
    <ContactPopup title={t.title} onClose={onClose} lang={lang}>
      {state === "sent" ? (
        <p role="status">
          {t.sent}
          {reference ? ` ${t.reference}: ${reference}.` : null}
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="space-y-3" noValidate>
          <input
            type="text"
            name="company_website"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <label className="block text-[13px] font-medium text-white/70">
            {t.email} <span className="text-[#C9A84C]">*</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className={fieldClass} />
          </label>
          <label className="block text-[13px] font-medium text-white/70">
            {t.subject} <span className="text-[#C9A84C]">*</span>
            <input type="text" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t.subjectPlaceholder} className={fieldClass} />
          </label>
          <label className="block text-[13px] font-medium text-white/70">
            {t.detail} <span className="text-[#C9A84C]">*</span>
            <textarea
              rows={4}
              maxLength={3800}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={t.detailPlaceholder}
              className={`${fieldClass} resize-y`}
            />
          </label>
          {state === "error" ? (
            <p className="text-[13px] text-[#f0a8a8]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={state === "sending"}
            className="min-h-11 w-full rounded-lg bg-[#C9A84C] px-4 text-[15px] font-semibold text-[#0D1B2A] hover:bg-[#b8953f] disabled:opacity-60"
          >
            {state === "sending" ? t.sending : t.send}
          </button>
        </form>
      )}
    </ContactPopup>
  );
}
