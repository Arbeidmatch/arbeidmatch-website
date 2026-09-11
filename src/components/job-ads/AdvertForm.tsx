"use client";

import { FormEvent, KeyboardEvent, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import {
  ADVERT_LIMITS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  REMOTE_LABELS,
  WORK_LANGUAGE_OPTIONS,
  validateAdvert,
  type AdvertDraft,
  type EmploymentType,
  type PostingRules,
} from "@/lib/job-ads/types";
import { DRAFT_KEY, writeJson } from "./storage";
import {
  bigSpinnerClass,
  cardClass,
  cardHairline,
  choiceClass,
  fieldErrorTextClass,
  fieldNoteTextClass,
  hintTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  spinnerClass,
} from "./ui";

export type AdvertSubmitResult =
  | { ok: true }
  | { ok: false; error: string; fields?: Record<string, string>; rulesChanged?: boolean };

export type StoredDraft = { advert: AdvertDraft; step: number; startedAt: number; savedAt: number };

type Props = {
  mode: "create" | "edit";
  initial: AdvertDraft;
  initialStep?: number;
  /** Create: when the visitor first started, carried over from a stored draft. */
  initialStartedAt?: number;
  /** Edit: the rules version the order was accepted under. */
  acceptedRulesVersion?: string;
  /** Edit: the reviewer's notes by field, shown under the field. */
  notes?: Record<string, string>;
  onSubmit: (input: { advert: AdvertDraft; rulesVersion: string; startedAt: number; honeypot: string }) => Promise<AdvertSubmitResult>;
  onCancel?: () => void;
};

const STEPS = ["Firma og kontakt", "Stillingen", "Arbeidssted, lønn og frist", "Hvem ansetter", "Regler og send"] as const;
const LAST_STEP = STEPS.length - 1;

/** Which fields each step owns, so a step only moves on when its own fields are right. */
const STEP_FIELDS: string[][] = [
  ["employer.name", "employer.orgNumber", "employer.website", "employer.about", "contact.name", "contact.email", "contact.phone", "contact"],
  ["headline", "title", "description", "positions", "employmentType", "industry", "skills", "keywords"],
  ["location.city", "location.postcode", "salary.period", "salary.min", "salary.max", "deadline"],
  ["advertFor"],
  [],
];

function stepOfField(field: string): number {
  const i = STEP_FIELDS.findIndex((list) => list.includes(field));
  return i === -1 ? 0 : i;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function numText(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? String(n) : "";
}

function parseAmount(text: string): number {
  const t = text.replace(/\s/g, "").replace(",", ".");
  return t === "" ? Number.NaN : Number(t);
}

function TagInput({
  id,
  value,
  onChange,
  max,
  placeholder,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  placeholder: string;
  invalid: boolean;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (next.length < max && !next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 60));
    onChange(next);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div>
      {value.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] px-3 py-1 text-xs text-white"
            >
              {v}
              <button
                type="button"
                aria-label={`Fjern ${v}`}
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="ml-1 text-white/60 hover:text-white"
              >
                x
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          disabled={value.length >= max}
          placeholder={value.length >= max ? `Høyst ${max}` : placeholder}
          className={inputClass(invalid, "min-w-0 flex-1")}
        />
        <button type="button" onClick={add} disabled={value.length >= max || !text.trim()} className={secondaryButtonClass}>
          Legg til
        </button>
      </div>
      <p className={hintTextClass}>
        {value.length} av {max}. Trykk Enter eller komma mellom hvert.
      </p>
    </div>
  );
}

/** Errors and reviewer notes by field name, read by every Field without threading props through each one. */
const FieldStateContext = createContext<{ errors: Record<string, string>; notes?: Record<string, string> }>({ errors: {} });

function Field({ name, label, optional, hint, children }: { name: string; label: string; optional?: boolean; hint?: string; children: ReactNode }) {
  const { errors, notes } = useContext(FieldStateContext);
  const error = errors[name];
  const note = notes?.[name];
  return (
    <div>
      <label htmlFor={`f-${name}`} className={labelClass}>
        {label}
        {optional ? <span className="ml-1 font-normal normal-case tracking-normal text-white/45">(valgfritt)</span> : null}
      </label>
      {children}
      {hint && !error ? <p className={hintTextClass}>{hint}</p> : null}
      {error ? <p className={fieldErrorTextClass}>{error}</p> : null}
      {note ? <p className={fieldNoteTextClass}>Merknad fra kontrollen: {note}</p> : null}
    </div>
  );
}

export default function AdvertForm({
  mode,
  initial,
  initialStep = 0,
  initialStartedAt,
  acceptedRulesVersion,
  notes,
  onSubmit,
  onCancel,
}: Props) {
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), LAST_STEP));
  const [ad, setAd] = useState<AdvertDraft>(initial);
  const [positionsText, setPositionsText] = useState(String(initial.positions || 1));
  const [salaryMinText, setSalaryMinText] = useState(numText(initial.salary?.min));
  const [salaryMaxText, setSalaryMaxText] = useState(numText(initial.salary?.max));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<PostingRules | null>(null);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef<number>(initialStartedAt ?? Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const minDeadline = isoDate(today);
  const maxDeadline = isoDate(new Date(today.getTime() + 364 * 86_400_000));

  const build = useCallback((): AdvertDraft => {
    const maxText = salaryMaxText.trim();
    return {
      ...ad,
      positions: Number.parseInt(positionsText, 10),
      salary: {
        period: ad.salary.period,
        min: parseAmount(salaryMinText),
        max: maxText === "" ? null : parseAmount(maxText),
      },
    };
  }, [ad, positionsText, salaryMinText, salaryMaxText]);

  // Keep the draft in this browser while it is written (create only).
  useEffect(() => {
    if (mode !== "create") return;
    const t = window.setTimeout(() => {
      const draft: StoredDraft = { advert: build(), step, startedAt: startedAt.current, savedAt: Date.now() };
      writeJson(DRAFT_KEY, draft);
    }, 400);
    return () => window.clearTimeout(t);
  }, [mode, build, step]);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const res = await fetch("/api/job-ads", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; version?: string; rules?: PostingRules["rules"]; error?: string } | null;
      if (!res.ok || !json?.ok || !json.version) throw new Error(json?.error || "Vi fikk ikke hentet annonsereglene.");
      setRules({ version: json.version, rules: json.rules ?? [] });
    } catch (e) {
      setRulesError(e instanceof Error ? e.message : "Vi fikk ikke hentet annonsereglene.");
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === LAST_STEP && !rules && !rulesLoading && !rulesError) void loadRules();
  }, [step, rules, rulesLoading, rulesError, loadRules]);

  const set = <K extends keyof AdvertDraft>(key: K, value: AdvertDraft[K]) => setAd((prev) => ({ ...prev, [key]: value }));
  const setNested = <K extends "salary" | "location" | "employer" | "contact">(key: K, patch: Partial<AdvertDraft[K]>) =>
    setAd((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goTo = (next: number) => {
    setStep(next);
    setSubmitError(null);
    scrollTop();
  };

  const stepProblems = (index: number): Record<string, string> => {
    const all = validateAdvert(build());
    const own = STEP_FIELDS[index] ?? [];
    return Object.fromEntries(Object.entries(all).filter(([k]) => own.includes(k)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (step < LAST_STEP) {
      const problems = stepProblems(step);
      setErrors(problems);
      if (Object.keys(problems).length === 0) goTo(step + 1);
      return;
    }

    const advert = build();
    const all = validateAdvert(advert);
    if (Object.keys(all).length > 0) {
      setErrors(all);
      goTo(stepOfField(Object.keys(all)[0]!));
      return;
    }
    const rulesVersion = mode === "create" ? rules?.version : acceptedRulesVersion ?? rules?.version ?? "";
    if (mode === "create" && (!rules || !accepted)) {
      setSubmitError("Dere må lese og godta annonsereglene før annonsen sendes.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit({ advert, rulesVersion: String(rulesVersion ?? ""), startedAt: startedAt.current, honeypot });
    // On success the parent navigates or replaces this form; the waiting screen stays until then.
    if (result.ok) return;
    setSubmitting(false);
    if (result.rulesChanged) {
      setAccepted(false);
      setRules(null);
      setRulesError(null);
    }
    if (result.fields && Object.keys(result.fields).length > 0) {
      setErrors(result.fields);
      goTo(stepOfField(Object.keys(result.fields)[0]!));
    }
    setSubmitError(result.error);
  };

  const err = (name: string) => errors[name];

  const industryLabel = INDUSTRIES.find((i) => i.value === ad.industry)?.label;
  const descLength = ad.description.trim().length;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">
          Steg {step + 1} av {STEPS.length}
        </p>
        <div className="mt-2 h-1 w-full rounded-full bg-white/10" aria-hidden>
          <div className="h-1 rounded-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="mt-3 hidden gap-2 text-[12px] text-white/50 md:flex">
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? "font-semibold text-white" : i < step ? "text-white/70" : ""}>
              {i + 1}. {label}
              {i < STEPS.length - 1 ? <span className="ml-2 text-white/25">/</span> : null}
            </li>
          ))}
        </ol>
      </div>

      <FieldStateContext.Provider value={{ errors, notes }}>
      <form onSubmit={handleSubmit} noValidate className={cardClass}>
        <div className={cardHairline} />

        {mode === "create" ? (
          <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor="company_website">Nettsted</label>
            <input
              id="company_website"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
        ) : null}

        {step === 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold">Firma og kontakt</h2>
            <p className="text-sm text-white/60">Hvem er arbeidsgiver, og hvem kan søkerne kontakte?</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field name="employer.name" label="Firmanavn">
                <input
                  id="f-employer.name"
                  value={ad.employer.name}
                  onChange={(e) => setNested("employer", { name: e.target.value })}
                  autoComplete="organization"
                  className={inputClass(!!err("employer.name"))}
                />
              </Field>
              <Field
                name="employer.orgNumber"
                label="Organisasjonsnummer"
                hint={mode === "edit" ? "Kan ikke endres på en bestilling." : "Ni siffer, slik det står i Enhetsregisteret."}
              >
                <input
                  id="f-employer.orgNumber"
                  value={ad.employer.orgNumber}
                  onChange={(e) => setNested("employer", { orgNumber: e.target.value.replace(/[^\d\s]/g, "").slice(0, 11) })}
                  inputMode="numeric"
                  readOnly={mode === "edit"}
                  className={inputClass(!!err("employer.orgNumber"), mode === "edit" ? "opacity-60" : "")}
                />
              </Field>
            </div>
            <Field name="employer.website" label="Nettside" optional>
              <input
                id="f-employer.website"
                value={ad.employer.website ?? ""}
                onChange={(e) => setNested("employer", { website: e.target.value })}
                placeholder="www.firma.no"
                className={inputClass(!!err("employer.website"))}
              />
            </Field>
            <Field name="employer.about" label="Om arbeidsgiver" optional hint="Noen setninger om firmaet, som vises i annonsen.">
              <textarea
                id="f-employer.about"
                value={ad.employer.about ?? ""}
                onChange={(e) => setNested("employer", { about: e.target.value })}
                rows={3}
                maxLength={2000}
                className={inputClass(!!err("employer.about"))}
              />
            </Field>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-3 text-sm font-semibold text-white">Kontaktperson for søkerne</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field name="contact.name" label="Navn">
                  <input
                    id="f-contact.name"
                    value={ad.contact.name}
                    onChange={(e) => setNested("contact", { name: e.target.value })}
                    autoComplete="name"
                    className={inputClass(!!err("contact.name"))}
                  />
                </Field>
                <Field name="contact.role" label="Stilling" optional>
                  <input
                    id="f-contact.role"
                    value={ad.contact.role ?? ""}
                    onChange={(e) => setNested("contact", { role: e.target.value })}
                    placeholder="For eksempel daglig leder"
                    className={inputClass(false)}
                  />
                </Field>
                <Field name="contact.email" label="E-post">
                  <input
                    id="f-contact.email"
                    type="email"
                    value={ad.contact.email ?? ""}
                    onChange={(e) => setNested("contact", { email: e.target.value })}
                    autoComplete="email"
                    className={inputClass(!!err("contact.email") || !!err("contact"))}
                  />
                </Field>
                <Field name="contact.phone" label="Telefon">
                  <input
                    id="f-contact.phone"
                    type="tel"
                    value={ad.contact.phone ?? ""}
                    onChange={(e) => setNested("contact", { phone: e.target.value })}
                    autoComplete="tel"
                    placeholder="+47"
                    className={inputClass(!!err("contact.phone") || !!err("contact"))}
                  />
                </Field>
              </div>
              {err("contact") ? <p className={fieldErrorTextClass}>{err("contact")}</p> : null}
              {!err("contact") ? <p className={hintTextClass}>Oppgi e-post, telefon eller begge.</p> : null}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold">Stillingen</h2>
            <p className="text-sm text-white/60">Skriv annonsen slik søkerne skal lese den. Én stilling per annonse.</p>
            <Field name="headline" label="Overskrift" optional hint={`Kort linje over tittelen, høyst ${ADVERT_LIMITS.headlineMax} tegn.`}>
              <input
                id="f-headline"
                value={ad.headline ?? ""}
                onChange={(e) => set("headline", e.target.value.slice(0, ADVERT_LIMITS.headlineMax))}
                placeholder="For eksempel: Bli med på nye prosjekter i Oslo"
                className={inputClass(!!err("headline"))}
              />
            </Field>
            <Field name="title" label="Stillingstittel">
              <input
                id="f-title"
                value={ad.title}
                onChange={(e) => set("title", e.target.value.slice(0, ADVERT_LIMITS.titleMax))}
                placeholder="For eksempel: Tømrer"
                className={inputClass(!!err("title"))}
              />
            </Field>
            <Field name="industry" label="Bransje">
              <select
                id="f-industry"
                value={ad.industry}
                onChange={(e) => set("industry", e.target.value)}
                className={inputClass(!!err("industry"), "bg-[#0D1B2A]")}
              >
                <option value="">Velg bransje</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="description" label="Beskrivelse">
              <textarea
                id="f-description"
                value={ad.description}
                onChange={(e) => set("description", e.target.value.slice(0, ADVERT_LIMITS.descriptionMax + 500))}
                rows={12}
                placeholder={"Om arbeidet og arbeidsstedet.\n\nArbeidsoppgaver.\n\nHva dere ser etter.\n\nHva dere tilbyr."}
                className={inputClass(!!err("description"), "leading-relaxed")}
              />
              <p className={`mt-1 text-[12px] ${descLength > ADVERT_LIMITS.descriptionMax || (descLength > 0 && descLength < ADVERT_LIMITS.descriptionMin) ? "text-amber-300" : "text-white/50"}`}>
                {descLength} / {ADVERT_LIMITS.descriptionMax} tegn, minst {ADVERT_LIMITS.descriptionMin}. En tom linje gir nytt avsnitt.
              </p>
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field name="positions" label="Antall stillinger">
                <input
                  id="f-positions"
                  type="number"
                  min={ADVERT_LIMITS.positionsMin}
                  max={ADVERT_LIMITS.positionsMax}
                  value={positionsText}
                  onChange={(e) => setPositionsText(e.target.value)}
                  className={inputClass(!!err("positions"))}
                />
              </Field>
              <Field name="employmentType" label="Ansettelsesform">
                <select
                  id="f-employmentType"
                  value={ad.employmentType}
                  onChange={(e) => set("employmentType", e.target.value as EmploymentType)}
                  className={inputClass(!!err("employmentType"), "bg-[#0D1B2A]")}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EMPLOYMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <p className={labelClass}>Heltid eller deltid</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set("partTime", false)} className={choiceClass(!ad.partTime)}>
                  Heltid
                </button>
                <button type="button" onClick={() => set("partTime", true)} className={choiceClass(ad.partTime)}>
                  Deltid
                </button>
              </div>
            </div>
            <Field name="skills" label="Kompetanse" optional hint={undefined}>
              <TagInput
                id="f-skills"
                value={ad.skills ?? []}
                onChange={(v) => set("skills", v)}
                max={ADVERT_LIMITS.skillsMax}
                placeholder="For eksempel fagbrev, førerkort B"
                invalid={!!err("skills")}
              />
            </Field>
            <Field name="keywords" label="Nøkkelord" optional>
              <TagInput
                id="f-keywords"
                value={ad.keywords ?? []}
                onChange={(v) => set("keywords", v)}
                max={ADVERT_LIMITS.keywordsMax}
                placeholder="Ord søkerne leter etter"
                invalid={!!err("keywords")}
              />
            </Field>
            <div>
              <p className={labelClass}>
                Arbeidsspråk <span className="ml-1 font-normal normal-case tracking-normal text-white/45">(valgfritt)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {WORK_LANGUAGE_OPTIONS.map((lang) => {
                  const on = (ad.workLanguages ?? []).includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set("workLanguages", on ? (ad.workLanguages ?? []).filter((l) => l !== lang) : [...(ad.workLanguages ?? []), lang])
                      }
                      className={choiceClass(on, "px-3 py-2")}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold">Arbeidssted, lønn og frist</h2>
            <Field name="location.address" label="Adresse" optional>
              <input
                id="f-location.address"
                value={ad.location.address ?? ""}
                onChange={(e) => setNested("location", { address: e.target.value })}
                autoComplete="street-address"
                className={inputClass(false)}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
              <Field name="location.postcode" label="Postnr." optional>
                <input
                  id="f-location.postcode"
                  value={ad.location.postcode ?? ""}
                  onChange={(e) => setNested("location", { postcode: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputClass(!!err("location.postcode"))}
                />
              </Field>
              <Field name="location.city" label="By eller kommune">
                <input
                  id="f-location.city"
                  value={ad.location.city}
                  onChange={(e) => setNested("location", { city: e.target.value })}
                  autoComplete="address-level2"
                  className={inputClass(!!err("location.city"))}
                />
              </Field>
            </div>
            <div>
              <p className={labelClass}>Hjemmekontor</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.keys(REMOTE_LABELS) as Array<keyof typeof REMOTE_LABELS>).map((k) => (
                  <button key={k} type="button" onClick={() => set("remote", k)} className={choiceClass((ad.remote ?? "no") === k)}>
                    {REMOTE_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className={labelClass}>Lønn</p>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setNested("salary", { period: "hour" })} className={choiceClass(ad.salary.period === "hour")}>
                  Per time
                </button>
                <button type="button" onClick={() => setNested("salary", { period: "month" })} className={choiceClass(ad.salary.period === "month")}>
                  Per måned
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field name="salary.min" label="Fra (kr)">
                  <input
                    id="f-salary.min"
                    value={salaryMinText}
                    onChange={(e) => setSalaryMinText(e.target.value.replace(/[^\d\s,.]/g, ""))}
                    inputMode="decimal"
                    placeholder={ad.salary.period === "hour" ? "For eksempel 250" : "For eksempel 45000"}
                    className={inputClass(!!err("salary.min"))}
                  />
                </Field>
                <Field name="salary.max" label="Til (kr)" optional hint="La stå tom hvis lønnen er fast.">
                  <input
                    id="f-salary.max"
                    value={salaryMaxText}
                    onChange={(e) => setSalaryMaxText(e.target.value.replace(/[^\d\s,.]/g, ""))}
                    inputMode="decimal"
                    className={inputClass(!!err("salary.max"))}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
              <Field name="deadline" label="Søknadsfrist">
                <input
                  id="f-deadline"
                  type="date"
                  min={minDeadline}
                  max={maxDeadline}
                  value={ad.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  className={inputClass(!!err("deadline"), "[color-scheme:dark]")}
                />
              </Field>
              <Field name="startDate" label="Oppstart" optional>
                <input
                  id="f-startDate"
                  value={ad.startDate ?? ""}
                  onChange={(e) => set("startDate", e.target.value.slice(0, 80))}
                  placeholder="Snarest, eller en dato"
                  className={inputClass(false)}
                />
              </Field>
            </div>

            {/* No price on the public form (his decision, 11 September 2026: prices
                are asked for through a request). The order page shows the packages
                and their prices once the advert has been checked. */}
            <div className="rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.06)] px-4 py-3 text-sm">
              <p className="text-white/70">Pris og pakker ser dere når annonsen er kontrollert, før dere betaler.</p>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold">Hvem ansetter personen?</h2>
            <p className="text-sm text-white/60">Søkerne skal vite hvem som blir arbeidsgiveren deres.</p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => set("advertFor", "recruitment")}
                className={choiceClass(ad.advertFor === "recruitment", "px-5 py-4")}
                aria-pressed={ad.advertFor === "recruitment"}
              >
                <span className="block text-base font-semibold text-white">Vi ansetter selv</span>
                <span className="mt-1 block text-[13px] text-white/60">Personen blir ansatt hos oss.</span>
              </button>
              <button
                type="button"
                onClick={() => set("advertFor", "staffing")}
                className={choiceClass(ad.advertFor === "staffing", "px-5 py-4")}
                aria-pressed={ad.advertFor === "staffing"}
              >
                <span className="block text-base font-semibold text-white">Et bemanningsforetak leier ut personen</span>
                <span className="mt-1 block text-[13px] text-white/60">
                  Personen ansettes i et bemanningsforetak og leies inn til arbeidsstedet.
                </span>
              </button>
            </div>
            {err("advertFor") ? <p className={fieldErrorTextClass}>{err("advertFor")}</p> : null}
          </div>
        ) : null}

        {step === LAST_STEP ? (
          <div className="space-y-5">
            <h2 className="text-2xl font-extrabold">{mode === "create" ? "Regler og send" : "Se over og send på nytt"}</h2>

            <div className="rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/75">
              <p className="font-semibold text-white">{ad.title || "Stilling uten tittel"}</p>
              <p className="mt-1">
                {ad.employer.name}
                {ad.location.city ? `, ${ad.location.city}` : ""}
                {industryLabel ? `, ${industryLabel.toLowerCase()}` : ""}
              </p>
              <p className="mt-1">
                Søknadsfrist{" "}
                {ad.deadline
                  ? new Date(`${ad.deadline}T12:00:00Z`).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })
                  : "ikke valgt"}
                , {EMPLOYMENT_TYPE_LABELS[ad.employmentType].toLowerCase()}
                {ad.partTime ? ", deltid" : ", heltid"}
              </p>
            </div>

            {mode === "edit" ? (
              <p className="text-sm text-white/65">
                Annonsereglene dere godtok{acceptedRulesVersion ? ` (versjon ${acceptedRulesVersion})` : ""} gjelder fortsatt. Når dere sender, kontrollerer vi annonsen på nytt.
              </p>
            ) : null}

            {mode === "create" ? (
              <div>
                <p className="mb-2 text-sm text-white/65">
                  Les annonsereglene. Vi kontrollerer annonsen mot dem før dere betaler noe.
                </p>
                {rulesLoading ? (
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#C9A84C]" />
                    Henter annonsereglene...
                  </p>
                ) : null}
                {rulesError ? (
                  <div className="rounded-[10px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {rulesError}{" "}
                    <button type="button" onClick={() => void loadRules()} className="font-semibold text-[#C9A84C] underline">
                      Prøv igjen
                    </button>
                  </div>
                ) : null}
                {rules ? (
                  <>
                    <ol className="max-h-[420px] space-y-4 overflow-y-auto rounded-[12px] border border-white/10 bg-white/[0.02] p-4">
                      {rules.rules.map((r, i) => (
                        <li key={r.id}>
                          <p className="text-sm font-semibold text-white">
                            {i + 1}. {r.title}
                          </p>
                          <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-white/70">{r.text}</p>
                        </li>
                      ))}
                    </ol>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[12px] border border-[rgba(201,168,76,0.25)] px-4 py-3">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A84C]"
                      />
                      <span className="text-sm text-white">Vi har lest og godtar annonsereglene (versjon {rules.version})</span>
                    </label>
                  </>
                ) : null}
              </div>
            ) : null}

            <p className="text-[13px] text-white/50">
              Kontrollen tar vanligvis under ett minutt. Dere betaler ikke noe før annonsen er godkjent og dere har valgt pakke.
            </p>
          </div>
        ) : null}

        {submitError ? (
          <div role="alert" className="mt-6 rounded-[10px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {submitError}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          {step > 0 ? (
            <button type="button" onClick={() => goTo(step - 1)} disabled={submitting} className={secondaryButtonClass}>
              Tilbake
            </button>
          ) : onCancel ? (
            <button type="button" onClick={onCancel} disabled={submitting} className={secondaryButtonClass}>
              Avbryt
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting || (step === LAST_STEP && mode === "create" && (!rules || !accepted))}
            className={`${primaryButtonClass} ml-auto`}
          >
            {submitting ? (
              <>
                <span className={spinnerClass} />
                Sender...
              </>
            ) : step === LAST_STEP ? (
              mode === "create" ? "Send til kontroll" : "Send på nytt"
            ) : (
              "Fortsett"
            )}
          </button>
        </div>
      </form>
      </FieldStateContext.Provider>

      {submitting ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0a0f18]/90 px-6" role="status" aria-live="polite">
          <div className="max-w-sm text-center">
            <span className={bigSpinnerClass} />
            <p className="mt-6 text-lg font-bold text-white">Vi kontrollerer annonsen...</p>
            <p className="mt-2 text-sm text-white/60">Det tar vanligvis under ett minutt. Ikke lukk siden.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
