"use client";

import { useRef, useState } from "react";

/**
 * The application form, on our own site.
 *
 * HIS INSTRUCTION, 3 September 2026: "omul aplica pe website si procesata
 * aplicatia in ats si tot procesul."
 *
 * THREE THOUGHTS, NOT TEN QUESTIONS. Who you are, what you do, what you agree
 * to, in that order, with consent last because that is where it belongs: a
 * person should know what they are agreeing to before they agree. It is one
 * page rather than a card stack, because a form met after reading the whole
 * advert is already a decision made, and stepping it would add places to stop.
 *
 * NOTHING IS DECIDED HERE. The ATS accepts or refuses the application, and its
 * sentence is what the person reads. This validates only what the browser can
 * check without a round trip, so nobody is sent away for a typo they can see.
 *
 * THE TWO INVISIBLE CHECKS are the same ones every public form on this site
 * uses: a field no person can see, and how long the form was open before it was
 * sent. See the ATS's human-check. Nothing visible fires by default, because an
 * irritating check costs more than the spam it stops.
 */

type Props = { token: string; jobTitle: string };

const HONEYPOT = "company_website";
const RENDERED_AT = "form_rendered_at";

/**
 * The passports we can take, and it is a list rather than a text box.
 *
 * MEASURED 3 September 2026, applying to a live advert with this field as free
 * text: "Romanian" was refused with "Nationality must be EU / EEA". The ATS
 * matches against country names, so the true answer to "nationality" was read
 * as somebody from outside Europe. A menu removes the mismatch entirely, and it
 * also tells the person the rule before they type rather than after.
 *
 * Sorted, EU and EEA, kept in step with the ATS's own list by hand because it
 * is the EEA and it changes about once a decade.
 */
/** The five the ATS accepts, in its own words. Kept in step by hand. */
const AVAILABILITY: Array<[string, string]> = [
  ["asap", "Right away"],
  ["in_1_week", "In a week"],
  ["in_2_weeks", "In two weeks"],
  ["in_1_month", "In a month"],
  ["notice_period", "After my notice period"],
];

const EU_EEA_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia",
  "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy",
  "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Norway",
  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
];

export function ApplyForm({ token, jobTitle }: Props) {
  const renderedAt = useRef(String(Date.now()));
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    setError(null);

    const entered = new FormData(event.currentTarget);
    const text = (name: string) => String(entered.get(name) ?? "").trim();
    const ticked = (name: string) => entered.get(name) === "on";

    /**
     * The shape the ATS reads, which is not the shape a form posts.
     *
     * Its multipart branch wants one `payload` field holding the whole answer
     * as JSON, and the file beside it. Posting the fields flat returns "Missing
     * payload field", which is how this was found: by sending a real
     * application rather than by reading the route.
     */
    const payload = {
      full_name: text("full_name"),
      email: text("email"),
      phone: text("phone"),
      nationality: text("nationality"),
      current_job_title: text("current_job_title") || null,
      // One field to fill in, a list on the way out.
      skills: text("skills_text")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      availability_type: text("availability_type"),
      privacy_policy_accepted: ticked("privacy_policy_accepted"),
      recruitment_contact_consent: ticked("recruitment_contact_consent"),
      // What they actually ticked. It decides whether we may come back to them
      // about other work, and it is not the same as agreeing to be contacted
      // about this position.
      gdpr_consent: ticked("gdpr_consent"),
      gdpr_processing_consent: true,
      marketing_consent: false,
      // The two invisible checks, passed straight through.
      [HONEYPOT]: text(HONEYPOT),
      [RENDERED_AT]: renderedAt.current,
    };

    const form = new FormData();
    form.set("payload", JSON.stringify(payload));
    const cv = entered.get("cv_file");
    if (cv instanceof File && cv.size > 0) form.set("cv_file", cv);

    setState("sending");
    try {
      const response = await fetch(`/api/apply/${encodeURIComponent(token)}`, { method: "POST", body: form });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "We could not accept that application. Please try again.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("We could not reach us just now. Please try again shortly.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-border p-8">
        <h2 className="text-xl font-bold text-navy">We have your application.</h2>
        <p className="mt-3 max-w-prose text-text-secondary">
          A recruiter reads it and comes back to you by email. If it fits {jobTitle.toLowerCase()}, the next
          step is a conversation, not another form.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      {/* Invisible to a person, and named like something a form would have.
          A bot fills it; a human never sees it. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={HONEYPOT}>Company website</label>
        <input id={HONEYPOT} name={HONEYPOT} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="border-0 p-0">
        <legend className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">Who you are</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field name="full_name" label="Full name" required autoComplete="name" />
          <Field name="email" label="Email" type="email" required autoComplete="email" />
          <Field name="phone" label="Phone" type="tel" required autoComplete="tel" />
          <label className="block">
            <span className="text-sm font-semibold text-navy">
              Country on your passport<span className="text-gold"> *</span>
            </span>
            <select
              name="nationality"
              required
              defaultValue=""
              className="mt-1.5 block min-h-12 w-full rounded-lg border border-border bg-white px-3 text-navy outline-none focus:border-gold"
            >
              <option value="" disabled>
                Choose
              </option>
              {EU_EEA_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-text-secondary">
              EU or EEA only. We do not sponsor visas, so a passport from outside cannot be accepted.
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-10 border-0 p-0">
        <legend className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">What you do</legend>
        <div className="mt-4 grid gap-4">
          <Field name="current_job_title" label="Your trade" placeholder="Carpenter, electrician, car mechanic" />
          {/* Required by the ATS, and the third such field found by sending a
              real application on 3 September 2026: without it every applicant
              was refused with "Add at least one skill." Comma separated,
              because a tag box on a phone is a fight and this is a list of
              words. */}
          <label className="block">
            <span className="text-sm font-semibold text-navy">
              What you can do<span className="text-gold"> *</span>
            </span>
            <input
              name="skills_text"
              required
              placeholder="Formwork, rebar, concrete finishing"
              className="mt-1.5 block min-h-12 w-full rounded-lg border border-border px-3 text-navy outline-none focus:border-gold"
            />
            <span className="mt-1 block text-xs text-text-secondary">
              A few words, separated by commas. This is what a recruiter reads first.
            </span>
          </label>
          {/* Required by the ATS, and found missing on 3 September 2026 by
              sending a real application: without it every applicant would have
              been refused with "Please select availability." It is also the
              first thing a recruiter asks, so it belongs on the form anyway. */}
          <label className="block">
            <span className="text-sm font-semibold text-navy">
              When can you start<span className="text-gold"> *</span>
            </span>
            <select
              name="availability_type"
              required
              defaultValue=""
              className="mt-1.5 block min-h-12 w-full rounded-lg border border-border bg-white px-3 text-navy outline-none focus:border-gold"
            >
              <option value="" disabled>
                Choose
              </option>
              {AVAILABILITY.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-navy">Your CV</span>
            <input
              type="file"
              name="cv_file"
              accept=".pdf,.doc,.docx"
              className="mt-1.5 block w-full rounded-lg border border-border px-3 py-2.5 text-sm text-navy file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
            <span className="mt-1 block text-xs text-text-secondary">
              PDF or Word. Not required, but it is the fastest way for us to see what you have done.
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-10 border-0 p-0">
        <legend className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
          What you agree to
        </legend>
        <div className="mt-4 space-y-3">
          <Consent name="privacy_policy_accepted" required>
            I have read the <a href="/privacy" className="font-semibold text-gold hover:underline">privacy notice</a>{" "}
            and accept it.
          </Consent>
          <Consent name="recruitment_contact_consent" required>
            You may contact me about this position and keep my details while you do.
          </Consent>
          <Consent name="gdpr_consent">
            You may keep my details on file and tell me about other work that fits my trade.
          </Consent>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-6 rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-navy">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-7 font-semibold text-navy transition hover:brightness-95 disabled:opacity-60"
      >
        {state === "sending" ? "Sending" : "Send application"}
      </button>
      <p className="mt-3 text-sm text-text-secondary">
        EU or EEA passport. No visa sponsorship, and we do not cover travel.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">
        {label}
        {required ? <span className="text-gold"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 block min-h-12 w-full rounded-lg border border-border px-3 text-navy outline-none focus:border-gold"
      />
    </label>
  );
}

function Consent({
  name,
  required = false,
  children,
}: {
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex gap-3 text-sm text-navy">
      <input
        type="checkbox"
        name={name}
        required={required}
        className="mt-1 h-4 w-4 shrink-0 accent-gold"
      />
      <span>
        {children}
        {required ? <span className="text-gold"> *</span> : null}
      </span>
    </label>
  );
}
