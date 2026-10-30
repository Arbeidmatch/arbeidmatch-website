"use client";

import { useId, useMemo, useState, type FocusEvent, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import dynamic from "next/dynamic";

import { PLANS_CLOSED_LINE, dayNo, hiringLetterFrom, type HiringFrequency, type HiringLetter, type HiringPrefs, type HiringSignal } from "@/lib/min-side/profile";
import type { Fetched, Saved } from "./MinSideHiring";
import { BTN_OUTLINE, CARD_L, DIVIDE_L, ERROR_L, FIELD_L, GOLD_CARD, GREEN_TEXT, INK, MUTED_L, RULE, SOFT, chip } from "./ui";

/**
 * ORDER 170: the client sets on Min side what the hiring alerts bring him,
 * when and to whom, and keeps his own firms (followed, hidden, and the letters
 * already sent). It sits above the list, closed behind one button so the list
 * stays first; above the tabs one line says how many firms match right now.
 *
 * There is no Save button: every control saves on change (a text or number
 * field on blur or Enter), the page reloads after each save, and a short
 * "Lagret" or the ATS's own sentence shows under the panel. At most seven
 * controls per tab. The ATS checks every value again; on a Basis client
 * choosing more counties than allowed it answers 402 with field "premium",
 * shown here as its sentence and the Premium button.
 */

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

type Send = (body: Record<string, unknown>) => Promise<Saved>;
type SendData = (body: Record<string, unknown>) => Promise<Fetched>;

export type TabKey = "receive" | "when" | "firms";
export const SETTINGS_TABS: { key: TabKey; label: string }[] = [
  { key: "receive", label: "Hva jeg får" },
  { key: "when", label: "Når og til hvem" },
  { key: "firms", label: "Mine bedrifter" },
];

/** What a panel needs to save: whether a save is in flight, the save itself, and the error for one field. */
export type Saver = { busy: boolean; save: (body: Record<string, unknown>) => Promise<Saved>; fieldError: (field: string) => string | null };
/** ORDER 181: `open` is false until a paid plan can be chosen (1 January 2027); then no Premium button shows. */
export type PremiumOffer = { ask: () => void; busy: boolean; sent: boolean; error: string | null; open: boolean };
/** No plan to offer: what the settings use when the section gives them none. */
export const NO_PREMIUM: PremiumOffer = { ask: () => {}, busy: false, sent: false, error: null, open: false };

/** The fields whose error is shown beside their own control rather than under the panel. */
const OWN_PLACE = new Set(["premium", "radius_km"]);

const SIGNALS: { key: HiringSignal; label: string }[] = [
  { key: "adverts", label: "Annonser" },
  { key: "won", label: "Vant offentlig kontrakt" },
  { key: "both", label: "Begge" },
];
export const FREQUENCIES: { key: HiringFrequency; label: string }[] = [
  { key: "daily", label: "Daglig" },
  { key: "weekly", label: "Ukentlig" },
  { key: "monthly", label: "Månedlig" },
];
const WEEKDAYS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
const LETTER_KIND = { weekly: "Oversikt", watch: "Bedrifter du følger" } as const;

const CHECK_L = "h-5 w-5 shrink-0 accent-[#1B2B44]";
const SMALL_BTN = `${BTN_OUTLINE} min-h-[36px] px-3 text-sm`;

const pad = (n: number) => String(n).padStart(2, "0");
/** A local day as YYYY-MM-DD. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const toggled = (list: string[], value: string) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
export const firmsWord = (n: number) => (n === 1 ? "1 bedrift" : `${n} bedrifter`);

/** One control of a panel: a fieldset with its name, so each tab can be counted (data-control). */
export function Control({ legend, note, children }: { legend: string; note?: ReactNode; children: ReactNode }) {
  return (
    <fieldset data-control="" className="flex min-w-0 flex-col gap-2">
      <legend className={`mb-2 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold ${INK}`}>
        {legend}
        {note ? <span className={`text-xs font-normal ${MUTED_L}`}>{note}</span> : null}
      </legend>
      {children}
    </fieldset>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-wrap gap-2">{children}</div>;
}

function FieldError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className={`text-sm font-semibold ${ERROR_L}`}>
      {message}
    </p>
  ) : null;
}

// ---------------------------------------------------------------------------
// Hva jeg får
// ---------------------------------------------------------------------------

/** The towns chosen, a search, and the towns that match it; the list is the ATS's own. */
function TownPicker({ chosen, towns, onChange }: { chosen: string[]; towns: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const id = useId();
  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("nb");
    const free = towns.filter((t) => !chosen.includes(t));
    return (q ? free.filter((t) => t.toLocaleLowerCase("nb").includes(q)) : free).slice(0, 12);
  }, [query, towns, chosen]);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {chosen.length ? (
        <Chips>
          {chosen.map((t) => (
            <button key={t} type="button" aria-pressed="true" aria-label={`${t}, fjern`} className={chip(true)} onClick={() => onChange(chosen.filter((x) => x !== t))}>
              {t} ×
            </button>
          ))}
        </Chips>
      ) : (
        <p className={`text-xs ${MUTED_L}`}>Alle steder i fylkene.</p>
      )}
      {towns.length ? (
        <>
          <label htmlFor={id} className="sr-only">
            Søk etter sted
          </label>
          <input id={id} type="search" className={FIELD_L} placeholder="Søk etter sted" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Chips>
            {matches.map((t) => (
              <button key={t} type="button" aria-pressed="false" className={chip(false)} disabled={chosen.length >= 20} onClick={() => onChange([...chosen, t])}>
                {t}
              </button>
            ))}
          </Chips>
        </>
      ) : null}
    </div>
  );
}

/** "Ansatte fra / til": two small number fields that save on blur or Enter. */
function EmployeesFields({ min, max, onSave }: { min: number | null; max: number | null; onSave: (min: number | null, max: number | null) => void }) {
  const [from, setFrom] = useState(min === null ? "" : String(min));
  const [to, setTo] = useState(max === null ? "" : String(max));
  const parse = (v: string) => (v.trim() === "" ? null : /^\d{1,7}$/.test(v.trim()) ? Number(v.trim()) : undefined);
  const commit = () => {
    const a = parse(from);
    const b = parse(to);
    if (a === undefined || b === undefined) {
      setFrom(min === null ? "" : String(min));
      setTo(max === null ? "" : String(max));
      return;
    }
    if (a !== min || b !== max) onSave(a, b);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };
  const id = useId();
  // Saved when focus leaves the pair, not when it moves from "fra" to "til" (a save disables the fields).
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit();
  };
  return (
    <div className="flex flex-wrap items-end gap-3" onBlur={onBlur}>
      <label htmlFor={`${id}-from`} className="flex w-[120px] flex-col gap-1">
        <span className={`text-xs font-semibold ${MUTED_L}`}>Ansatte fra</span>
        <input id={`${id}-from`} type="number" inputMode="numeric" min={0} className={FIELD_L} value={from} onChange={(e) => setFrom(e.target.value)} onKeyDown={onKey} />
      </label>
      <label htmlFor={`${id}-to`} className="flex w-[120px] flex-col gap-1">
        <span className={`text-xs font-semibold ${MUTED_L}`}>til</span>
        <input id={`${id}-to`} type="number" inputMode="numeric" min={0} className={FIELD_L} value={to} onChange={(e) => setTo(e.target.value)} onKeyDown={onKey} />
      </label>
    </div>
  );
}

function PremiumBox({ message, premium }: { message: string; premium: PremiumOffer }) {
  if (!premium.open) {
    // ORDER 181: no plan before 1 January; the refusal and one quiet line, no button.
    return (
      <div className={`${CARD_L} flex min-w-0 flex-col gap-1 p-3`}>
        <p className={`text-sm ${INK}`}>{message}</p>
        <p className={`text-sm ${MUTED_L}`}>{PLANS_CLOSED_LINE}</p>
      </div>
    );
  }
  return (
    <div className={`${GOLD_CARD} flex flex-wrap items-center justify-between gap-3 p-3`}>
      <p className={`min-w-0 flex-1 basis-[200px] text-sm ${INK}`}>{premium.sent ? "Vi har fått beskjed og sender dere et tilbud." : message}</p>
      {premium.sent ? null : (
        <button type="button" className={BTN_OUTLINE} disabled={premium.busy} onClick={premium.ask}>
          {premium.busy ? "Sender ..." : "Premium"}
        </button>
      )}
      <FieldError message={premium.error} />
    </div>
  );
}

export function ReceivePanel({ prefs, saver, premium }: { prefs: HiringPrefs; saver: Saver; premium: PremiumOffer }) {
  const { receive: r, options: o } = prefs;
  const save = (fields: Record<string, unknown>) => void saver.save({ action: "hiring_prefs_receive", ...fields });
  const limit = o.county_limit;
  const premiumMessage = saver.fieldError("premium");
  const radiusSelectId = useId();
  return (
    <fieldset disabled={saver.busy} className="flex min-w-0 flex-col gap-5">
      <Control legend="Fag" note={r.trades.length ? undefined : "Alle"}>
        <Chips>
          {o.trades.map((t) => {
            const on = r.trades.includes(t.key);
            return (
              <button key={t.key} type="button" aria-pressed={on} className={chip(on)} disabled={!on && r.trades.length >= 20} onClick={() => save({ trades: toggled(r.trades, t.key) })}>
                {t.name}
              </button>
            );
          })}
        </Chips>
      </Control>

      <Control legend="Fylker" note={limit ? (limit === 1 ? "Basis: ett fylke" : `Basis: ${limit} fylker`) : r.counties.length ? undefined : "Alle"}>
        <Chips>
          {o.counties.map((c) => {
            const on = r.counties.includes(c.code);
            return (
              <button key={c.code} type="button" aria-pressed={on} className={chip(on)} disabled={!on && r.counties.length >= 20} onClick={() => save({ counties: toggled(r.counties, c.code) })}>
                {c.name}
              </button>
            );
          })}
        </Chips>
        {premiumMessage ? <PremiumBox message={premiumMessage} premium={premium} /> : null}
      </Control>

      <Control legend="Steder">
        {o.radius_km.length ? (
          <>
            <label htmlFor={radiusSelectId} className="sr-only">
              Steder eller avstand
            </label>
            <select
              id={radiusSelectId}
              className={`${FIELD_L} sm:max-w-[320px]`}
              value={r.radius_km === null ? "" : String(r.radius_km)}
              onChange={(e) => save({ radius_km: e.target.value === "" ? null : Number(e.target.value) })}
            >
              <option value="">Velg steder</option>
              {o.radius_km.map((km) => (
                <option key={km} value={km}>
                  Innenfor {km} km fra oss
                </option>
              ))}
            </select>
          </>
        ) : null}
        <FieldError message={saver.fieldError("radius_km")} />
        {r.radius_km === null ? <TownPicker chosen={r.towns} towns={o.towns} onChange={(towns) => save({ towns })} /> : null}
      </Control>

      <Control legend="Bedriftsstørrelse">
        <EmployeesFields key={`${r.min_employees}-${r.max_employees}`} min={r.min_employees} max={r.max_employees} onSave={(min, max) => save({ min_employees: min, max_employees: max })} />
      </Control>

      <Control legend="Type signal">
        <Chips>
          {SIGNALS.map((s) => (
            <button key={s.key} type="button" aria-pressed={r.signal === s.key} className={chip(r.signal === s.key, true)} onClick={() => r.signal !== s.key && save({ signal: s.key })}>
              {s.label}
            </button>
          ))}
        </Chips>
      </Control>

      <Control legend="Nye stillinger">
        <label className={`flex min-h-[44px] items-center gap-3 text-[15px] ${SOFT}`}>
          <input type="checkbox" className={CHECK_L} checked={r.only_new} onChange={(e) => save({ only_new: e.target.checked })} />
          Bare nye stillinger siden sist
        </label>
      </Control>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Når og til hvem
// ---------------------------------------------------------------------------

function Recipients({ prefs, saver }: { prefs: HiringPrefs; saver: Saver }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const id = useId();
  const all = prefs.when.recipients;
  const extras = all.filter((p) => !p.primary);
  const canAdd = extras.length < prefs.options.max_recipients;
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const r = await saver.save({ action: "hiring_prefs_when", add_recipient: { email: email.trim(), ...(name.trim() ? { name: name.trim() } : {}) } });
    if (r.ok) {
      setEmail("");
      setName("");
    }
  };
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ul className={`flex flex-col ${DIVIDE_L}`}>
        {all.map((p) => (
          <li key={p.id ?? `primary-${p.email}`} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
            <span className={`min-w-0 break-all text-[15px] ${INK}`}>
              {p.name ? `${p.name}, ` : ""}
              {p.email}
              {p.primary ? <span className={`ml-2 text-xs ${MUTED_L}`}>Hovedadresse</span> : null}
            </span>
            {p.primary || !p.id ? null : (
              <button type="button" className={SMALL_BTN} onClick={() => void saver.save({ action: "hiring_prefs_when", remove_recipient: p.id })}>
                Fjern
              </button>
            )}
          </li>
        ))}
      </ul>
      {canAdd ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <label htmlFor={`${id}-email`} className="flex min-w-0 flex-1 basis-[200px] flex-col gap-1">
            <span className={`text-xs font-semibold ${MUTED_L}`}>E-post</span>
            <input id={`${id}-email`} type="email" required maxLength={254} autoComplete="off" className={FIELD_L} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label htmlFor={`${id}-name`} className="flex min-w-0 flex-1 basis-[140px] flex-col gap-1">
            <span className={`text-xs font-semibold ${MUTED_L}`}>Navn (valgfritt)</span>
            <input id={`${id}-name`} type="text" maxLength={120} autoComplete="off" className={FIELD_L} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit" className={BTN_OUTLINE}>
            Legg til
          </button>
        </form>
      ) : (
        <p className={`text-xs ${MUTED_L}`}>Høyst {prefs.options.max_recipients} ekstra mottakere.</p>
      )}
    </div>
  );
}

/** The pause: a date from today to today + pause_max_days, saved as soon as it is a whole day in that range. */
function PauseField({ until, maxDays, onSave }: { until: string | null; maxDays: number; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(until ?? "");
  const today = new Date();
  const min = isoDay(today);
  const max = isoDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + maxDays));
  const id = useId();
  const valid = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= min && v <= max;
  const commit = (v: string) => {
    if (valid(v) && v !== (until ?? "")) onSave(v);
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label htmlFor={id} className="flex w-[190px] flex-col gap-1">
        <span className={`text-xs font-semibold ${MUTED_L}`}>Pause til</span>
        <input
          id={id}
          type="date"
          className={FIELD_L}
          min={min}
          max={max}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => commit(draft)}
        />
      </label>
      {until ? (
        <button type="button" className={BTN_OUTLINE} onClick={() => onSave("")}>
          Avslutt pause
        </button>
      ) : null}
    </div>
  );
}

export function WhenPanel({ prefs, saver }: { prefs: HiringPrefs; saver: Saver }) {
  const { when: w, options: o } = prefs;
  const save = (fields: Record<string, unknown>) => void saver.save({ action: "hiring_prefs_when", ...fields });
  const dayId = useId();
  const hourId = useId();
  const hours: number[] = [];
  for (let h = o.hours[0]; h <= o.hours[1]; h++) hours.push(h);
  return (
    <fieldset disabled={saver.busy} className="flex min-w-0 flex-col gap-5">
      <Control legend="Hvor ofte" note={w.paused_until ? `Pause til ${dayNo(w.paused_until)}` : undefined}>
        <Chips>
          {FREQUENCIES.map((f) => (
            <button key={f.key} type="button" aria-pressed={w.frequency === f.key} className={chip(w.frequency === f.key, true)} onClick={() => w.frequency !== f.key && save({ frequency: f.key })}>
              {f.label}
            </button>
          ))}
        </Chips>
      </Control>

      {w.frequency === "weekly" ? (
        <Control legend="Dag">
          <label htmlFor={dayId} className="sr-only">
            Dag
          </label>
          <select id={dayId} className={`${FIELD_L} sm:max-w-[240px]`} value={w.weekday} onChange={(e) => save({ weekday: Number(e.target.value) })}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i + 1}>
                {d}
              </option>
            ))}
          </select>
        </Control>
      ) : null}

      <Control legend="Klokkeslett">
        <label htmlFor={hourId} className="sr-only">
          Klokkeslett
        </label>
        <select id={hourId} className={`${FIELD_L} sm:max-w-[240px]`} value={w.hour} onChange={(e) => save({ hour: Number(e.target.value) })}>
          {hours.map((h) => (
            <option key={h} value={h}>
              {pad(h)}:00
            </option>
          ))}
        </select>
      </Control>

      <Control legend="Mottakere">
        <Recipients prefs={prefs} saver={saver} />
      </Control>

      <Control legend="Språk i e-posten">
        <Chips>
          {(
            [
              ["no", "Norsk"],
              ["en", "English"],
            ] as const
          ).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={w.language === key} className={chip(w.language === key, true)} onClick={() => w.language !== key && save({ language: key })}>
              {label}
            </button>
          ))}
        </Chips>
      </Control>

      <Control legend="Pause">
        <PauseField key={w.paused_until ?? ""} until={w.paused_until} maxDays={o.pause_max_days} onSave={(paused_until) => save({ paused_until })} />
      </Control>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Mine bedrifter
// ---------------------------------------------------------------------------

export function FirmsPanel({ prefs, saver, sendData }: { prefs: HiringPrefs; saver: Saver; sendData: SendData }) {
  const { watch, hidden, archive } = prefs.firms;
  const [letter, setLetter] = useState<HiringLetter | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const firm = (key: "unwatch" | "unhide", orgnr: string) => void saver.save({ action: "hiring_prefs_firms", [key]: orgnr });
  const open = async (id: string) => {
    setOpening(id);
    setFailed(null);
    const r = await sendData({ action: "hiring_prefs_firms", open_letter: id });
    setOpening(null);
    if (!r.ok) {
      setFailed(r.message);
      return;
    }
    const parsed = hiringLetterFrom((r.data as { letter?: unknown } | null)?.letter);
    if (parsed) setLetter(parsed);
    else setFailed("E-posten kunne ikke åpnes akkurat nå. Prøv igjen om litt.");
  };
  const empty = (text: string) => <p className={`text-sm ${MUTED_L}`}>{text}</p>;
  return (
    <>
      <fieldset disabled={saver.busy} className="flex min-w-0 flex-col gap-5">
        <Control legend="Bedrifter du følger">
          {watch.length ? (
            <ul className={`flex flex-col ${DIVIDE_L}`}>
              {watch.map((f) => (
                <li key={f.orgnr} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
                  <span className={`min-w-0 break-words text-[15px] ${INK}`}>{f.name}</span>
                  <button type="button" className={SMALL_BTN} onClick={() => firm("unwatch", f.orgnr)}>
                    Slutt å følge
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            empty("Du følger ingen bedrifter ennå.")
          )}
        </Control>
  
        <Control legend="Skjulte bedrifter">
          {hidden.length ? (
            <ul className={`flex flex-col ${DIVIDE_L}`}>
              {hidden.map((f) => (
                <li key={f.orgnr} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
                  <span className={`min-w-0 break-words text-[15px] ${INK}`}>{f.name}</span>
                  <button type="button" className={SMALL_BTN} onClick={() => firm("unhide", f.orgnr)}>
                    Angre
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            empty("Ingen skjulte bedrifter.")
          )}
        </Control>
  
        <Control legend="Sendte e-poster">
          {archive.length ? (
            <ul className={`flex flex-col ${DIVIDE_L}`}>
              {archive.map((a) => (
                <li key={a.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2">
                  <span className={`min-w-0 text-[15px] ${INK}`}>
                    {a.sent_at ? dayNo(a.sent_at) : ""}
                    <span className={`block text-xs ${MUTED_L}`}>
                      {firmsWord(a.firm_count)} · {LETTER_KIND[a.kind]}
                    </span>
                  </span>
                  <button type="button" className={SMALL_BTN} aria-haspopup="dialog" disabled={opening !== null} onClick={() => void open(a.id)}>
                    {opening === a.id ? "Åpner ..." : "Åpne"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            empty("Ingen e-poster sendt ennå.")
          )}
          <FieldError message={failed} />
        </Control>
      </fieldset>
      {letter ? (
        <PortalModal title={letter.subject ?? "E-post"} onClose={() => setLetter(null)}>
          <iframe sandbox="" srcDoc={letter.html} title={letter.subject ?? "E-post"} className="h-[70vh] w-full rounded-[10px] border-0 bg-white" />
        </PortalModal>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export type MinSideHiringSettingsProps = {
  prefs: HiringPrefs;
  send: Send;
  sendData: SendData;
  /** For a test or a link: open at once, on this tab. */
  initialOpen?: boolean;
  initialTab?: TabKey;
  /** ORDER 181: the section's one Premium path (closed before 1 January, "Fakturering" when billing is needed). */
  premium?: PremiumOffer;
};

export default function MinSideHiringSettings({ prefs, send, sendData, initialOpen = false, initialTab = "receive", premium = NO_PREMIUM }: MinSideHiringSettingsProps) {
  const [open, setOpen] = useState(initialOpen);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Saved | null>(null);
  const base = useId();

  const save = async (body: Record<string, unknown>): Promise<Saved> => {
    setBusy(true);
    setResult(null);
    const r = await send(body);
    setBusy(false);
    setResult(r);
    return r;
  };
  const saver: Saver = { busy, save, fieldError: (field) => (result && !result.ok && result.field === field ? result.message : null) };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = SETTINGS_TABS.findIndex((t) => t.key === tab);
    const next = SETTINGS_TABS[(i + (e.key === "ArrowRight" ? 1 : SETTINGS_TABS.length - 1)) % SETTINGS_TABS.length];
    setTab(next.key);
    document.getElementById(`${base}-tab-${next.key}`)?.focus();
  };

  const generalError = result && !result.ok && !OWN_PLACE.has(result.field ?? "") ? result.message : null;

  return (
    <div className={`${CARD_L} flex min-w-0 flex-col gap-4 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-[15px] font-bold ${INK}`} aria-live="polite">
          Treff nå: {firmsWord(prefs.matches)}
        </p>
        <button type="button" className={BTN_OUTLINE} aria-expanded={open} aria-controls={`${base}-panel`} onClick={() => setOpen((v) => !v)}>
          Innstillinger
        </button>
      </div>

      {open ? (
        <div id={`${base}-panel`} className={`flex min-w-0 flex-col gap-4 border-t ${RULE} pt-4`}>
          <div role="tablist" aria-label="Innstillinger" className="flex flex-wrap gap-2" onKeyDown={onTabKey}>
            {SETTINGS_TABS.map((t) => (
              <button
                key={t.key}
                id={`${base}-tab-${t.key}`}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`${base}-tabpanel`}
                tabIndex={tab === t.key ? 0 : -1}
                className={chip(tab === t.key, true)}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div id={`${base}-tabpanel`} role="tabpanel" aria-labelledby={`${base}-tab-${tab}`} className="min-w-0">
            {tab === "receive" ? <ReceivePanel prefs={prefs} saver={saver} premium={premium} /> : null}
            {tab === "when" ? <WhenPanel prefs={prefs} saver={saver} /> : null}
            {tab === "firms" ? <FirmsPanel prefs={prefs} saver={saver} sendData={sendData} /> : null}
          </div>
          <div className="min-h-[20px]" aria-live="polite">
            {busy ? (
              <p className={`text-sm ${MUTED_L}`}>Lagrer ...</p>
            ) : generalError ? (
              <p role="alert" className={`text-sm font-semibold ${ERROR_L}`}>
                {generalError}
              </p>
            ) : result?.ok ? (
              <p className={`text-sm font-semibold ${GREEN_TEXT}`}>Lagret</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
