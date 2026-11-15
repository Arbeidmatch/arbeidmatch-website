"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/site/Icon";
import { ConsentSwitch, Group } from "@/components/site/sheet/rows";
import { SheetFrame } from "@/components/site/sheet/SheetFrame";

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
 *
 * The window is rendered on document.body (31 October 2026). Rendered where the
 * button is, it sat inside the sticky side card, and a sticky element is a
 * stacking context of its own: the window's z-index stopped at the card, so the
 * advert's text, scrolled into view, was painted over the consent box.
 */

type Lang = "no" | "en";

const WORDS: Record<
  Lang,
  { title: string; intro: string; readThe: string; notice: string; consent: string; continueWith: string; login: string; register: string; adults: string; hint: string; close: string }
> = {
  en: {
    title: "Apply",
    intro:
      "To apply for this job, sign in to your candidate profile or create one. It takes a few minutes, and you apply to the next job with one press.",
    readThe: "I have read the",
    notice: "privacy notice",
    consent: "and consent to ArbeidMatch processing my personal data to handle my application and find work for me.",
    continueWith: "Continue with your profile",
    login: "I have a profile",
    register: "Create my profile",
    adults: "18+ only: you must be 18 or older to register.",
    hint: "Tick the box to continue.",
    close: "Close",
  },
  no: {
    title: "Søk",
    intro:
      "For å søke på denne stillingen logger du inn på kandidatprofilen din eller oppretter en. Det tar noen minutter, og neste gang søker du med ett trykk.",
    readThe: "Jeg har lest",
    notice: "personvernerklæringen",
    consent: "og samtykker til at ArbeidMatch behandler personopplysningene mine for å behandle søknaden min og finne arbeid til meg.",
    continueWith: "Fortsett med profilen din",
    login: "Jeg har en profil",
    register: "Opprett profil",
    adults: "Kun 18+: du må være 18 år eller eldre for å registrere deg.",
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
  /** The job's title, for the sheet's title bar. */
  jobTitle?: string;
}) {
  const { className, loginHref, registerHref, label = "Apply for this job", slug, jobTitle } = props;
  const [open, setOpen] = useState(false);
  // True only in the browser, so the sheet is portalled to <body> after hydration and never on the server.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  // One tick, two facts. `accepted` is both of them, because there is no
  // longer a state in which a person has done one and not the other.
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<string | null>(null);
  const [fid, setFid] = useState("");

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

  const sheetLang = lang === "no" ? "no" : "en";
  const w = WORDS[lang === "no" ? "no" : "en"];

  // ORDER 295, stage 3: the window is the site's sheet now (the approved
  // mockup of 15 November 2026). What it asks and where its two doors lead
  // are unchanged: the tick first, then signing in or creating a profile in
  // the candidate portal, with the same query and the same counts.
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
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <SheetFrame
              open={open}
              lang={sheetLang}
              title={jobTitle ? `${w.title}: ${jobTitle}` : w.title}
              sub={null}
              onBack={() => {}}
              onClose={() => setOpen(false)}
              footer={
                <>
                  <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                    {w.close}
                  </button>
                  {/* Only people aged 18 or older can register (ORDER 189); the profile screen asks the date of birth. */}
                  <p>
                    <b>{w.adults}</b> {accepted ? "" : w.hint}
                  </p>
                </>
              }
            >
              <div className="sh-text">
                <p>{w.intro}</p>
              </div>
              <Group>
                <ConsentSwitch
                  label={`${w.readThe} ${w.notice} ${w.consent}`}
                  checked={accepted}
                  onChange={(next) => {
                    setAccepted(next);
                    if (next) countStep(slug, "ticked", fid);
                  }}
                >
                  {w.readThe}{" "}
                  <a className="plink" href="/privacy" target="_blank" rel="noreferrer">
                    {w.notice}
                  </a>{" "}
                  {w.consent}
                </ConsentSwitch>
              </Group>
              <Group label={w.continueWith}>
                <a className="row" href={withLanguageAndVisit(loginHref, lang, fid)} aria-disabled={!accepted} tabIndex={accepted ? undefined : -1} data-apply-door="login">
                  <span className="ri">
                    <Icon name="lock" />
                  </span>
                  <span className="rl">{w.login}</span>
                  <span className="rv" />
                  <Icon name="chev" />
                </a>
                <a className="row" href={withLanguageAndVisit(registerHref, lang, fid)} aria-disabled={!accepted} tabIndex={accepted ? undefined : -1} data-apply-door="register">
                  <span className="ri">
                    <Icon name="user" />
                  </span>
                  <span className="rl">{w.register}</span>
                  <span className="rv" />
                  <Icon name="chev" />
                </a>
              </Group>
            </SheetFrame>,
            document.body,
          )
        : null}
    </>
  );
}
