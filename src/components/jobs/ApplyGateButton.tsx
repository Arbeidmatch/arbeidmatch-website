"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * The Apply button on an advert (17 September 2026).
 *
 * His instruction: pressing Apply opens a window that says a profile is needed
 * to apply, with the consent box first and then the choice between signing in
 * and creating a profile. Both doors are in the candidate portal; the tick
 * travels with them (consent=1) and is saved on the profile when the person
 * signs in.
 *
 * Legal review, 25 September 2026: the consent is only the consent to process
 * the person's data for recruitment. Reading the privacy notice is a separate
 * acknowledgement, never an acceptance, and an applicant is not asked to accept
 * our Terms: a job applicant is not a party to them.
 *
 * HIS WORDS, 4 October 2026: "aici in loc de 2 casute sa fie numai una care sa
 * le includa pe amandoua". One box now, with both facts in its sentence. They
 * stay two facts behind it - the consent that travels to the ATS and the
 * acknowledgement of the notice - and the exact sentence he ticked is what is
 * recorded, so nothing downstream loses a flag and the record still says what
 * the person actually agreed to.
 *
 * THE SHORTER APPLY (ORDER 41, point 6, 5 October 2026):
 * - The advert's language arrives as ?lang= on the link under the post. This
 *   page is Norwegian and English only (his rule of 4 October, "are texte in
 *   romana desi am stabilit reguli clare"), so the window speaks Norwegian to
 *   ?lang=no and English to everybody else; the language is carried on to the
 *   portal, where the steps are the candidate's own and are asked in it.
 * - It fits a 390 x 844 phone with nothing hidden: its own height limit and its
 *   own scroll.
 * - Both doors turn gold the moment the box is ticked.
 * - Pressing Apply and ticking the box are counted, first party, per job, with
 *   a random id for this visit and nothing about the person.
 */

type Lang = "no" | "en";

const WORDS: Record<
  Lang,
  { title: string; intro: string; readThe: string; notice: string; consent: string; login: string; register: string; hint: string; close: string }
> = {
  en: {
    title: "Sign in to apply",
    intro:
      "To apply for this job, sign in to your candidate profile or create one. It takes a few minutes, and you apply to the next job with one press.",
    readThe: "I have read the",
    notice: "privacy notice",
    consent: "and consent to ArbeidMatch processing my personal data to handle my application and find work for me.",
    login: "I have a profile",
    register: "Create my profile",
    hint: "Tick the box to continue.",
    close: "Close",
  },
  no: {
    title: "Logg inn for å søke",
    intro:
      "For å søke på denne stillingen logger du inn på kandidatprofilen din eller oppretter en. Det tar noen minutter, og neste gang søker du med ett trykk.",
    readThe: "Jeg har lest",
    notice: "personvernerklæringen",
    consent: "og samtykker til at ArbeidMatch behandler personopplysningene mine for å behandle søknaden min og finne arbeid til meg.",
    login: "Jeg har en profil",
    register: "Opprett profil",
    hint: "Kryss av i boksen for å gå videre.",
    close: "Lukk",
  },
};

/** The funnel steps this page owns; the rest are counted in the portal. */
type PageStep = "apply_pressed" | "ticked";

function countStep(slug: string | undefined, step: PageStep, fid: string) {
  if (!slug || !fid) return;
  try {
    const body = JSON.stringify({ slug, step, fid });
    const sent =
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/public/apply-funnel", new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch("/api/public/apply-funnel", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(
        () => undefined,
      );
    }
  } catch {
    /* a count that did not go is never a reason the apply does not */
  }
}

/**
 * The door's address with the advert's language and this visit's id carried
 * on, both to the sign-in screen and to where it sends the person afterwards.
 */
export function withLanguageAndVisit(href: string, lang: string | null, fid: string): string {
  try {
    const url = new URL(href);
    const next = url.searchParams.get("next");
    if (next) {
      const [path, query = ""] = next.split("?");
      const nextParams = new URLSearchParams(query);
      if (lang) nextParams.set("lang", lang);
      if (fid) nextParams.set("fid", fid);
      const tail = nextParams.toString();
      url.searchParams.set("next", tail ? `${path}?${tail}` : path);
    }
    if (lang) url.searchParams.set("lang", lang);
    return url.toString();
  } catch {
    return href;
  }
}

const ADVERT_LANGUAGES = ["ro", "no", "en", "pl"];

export function ApplyGateButton(props: {
  className: string;
  loginHref: string;
  registerHref: string;
  label?: string;
  /** The job's slug, so the funnel is counted per job. */
  slug?: string;
}) {
  const { className, loginHref, registerHref, label = "Apply for this job", slug } = props;
  const [open, setOpen] = useState(false);
  // One tick, two facts. `accepted` is both of them, because there is no
  // longer a state in which a person has done one and not the other.
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<string | null>(null);
  const [fid, setFid] = useState("");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Read in the browser, so the page itself stays the same static page for
  // every language and every crawler.
  useEffect(() => {
    try {
      const asked = new URLSearchParams(window.location.search).get("lang")?.trim().toLowerCase() ?? "";
      if (ADVERT_LANGUAGES.includes(asked)) setLang(asked);
    } catch {
      /* no language is English */
    }
    setFid(
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const w = WORDS[lang === "no" ? "no" : "en"];
  const door =
    "inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
  // Grey and inert until the tick, gold the moment it is there.
  const doorState = accepted
    ? "bg-gold text-navy hover:bg-gold-hover"
    : "pointer-events-none border-2 border-border bg-surface text-text-secondary";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          countStep(slug, "apply_pressed", fid);
        }}
        className={className}
      >
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/60 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            lang={lang === "no" ? "no" : "en"}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-2xl md:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-xl font-bold text-navy">
                {w.title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={w.close}
                className="-mr-2 -mt-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-text-secondary hover:bg-surface"
              >
                ×
              </button>
            </div>
            <p className="mt-2 leading-relaxed text-text-secondary">{w.intro}</p>

            <label className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4 text-sm leading-relaxed text-navy">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (e.target.checked) countStep(slug, "ticked", fid);
                }}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#C9A84C]"
              />
              <span>
                {w.readThe}{" "}
                <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold underline decoration-gold decoration-2 underline-offset-4">
                  {w.notice}
                </a>{" "}
                {w.consent}
              </span>
            </label>

            <div className="mt-5 flex flex-col gap-3">
              <a href={withLanguageAndVisit(loginHref, lang, fid)} aria-disabled={!accepted} tabIndex={accepted ? undefined : -1} className={`${door} ${doorState}`}>
                {w.login}
              </a>
              <a
                href={withLanguageAndVisit(registerHref, lang, fid)}
                aria-disabled={!accepted}
                tabIndex={accepted ? undefined : -1}
                className={`${door} ${doorState}`}
              >
                {w.register}
              </a>
            </div>
            {!accepted ? <p className="mt-3 text-center text-[13px] text-text-secondary">{w.hint}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
