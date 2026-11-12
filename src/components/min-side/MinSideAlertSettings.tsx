"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Check, ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { SupportButton } from "@/components/support/SupportRequest";
import {
  FREQUENCY_LABEL,
  WEEKDAY_NO,
  fagChangeable,
  letterWords,
  summaryLine,
  valueWords,
  type AlertSettings,
  type Choice,
  type SettingsField,
} from "@/lib/min-side/alert-settings";
import { dayNo } from "@/lib/min-side/profile";
import type { SettingsLevel } from "@/lib/min-side/project-list";
import { BODY, CARD, DANGER, GREY, GROUP, GROUP_HEAD, INPUT, LARGE_TITLE, NAVY, PILL, ROW, ROW_BUTTON, SEGMENTS, SMALL, segment } from "./ios";
import { ConfirmForm } from "./MinSideHiring";

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

/**
 * ORDER 273: Innstillinger for the project alerts, in the iOS Settings pattern
 * (his words of 12 November 2026: "mai dinamice ca in meniul unui mobil ios").
 * A live summary on top, then Hva, Hvor, Når og hvem; a row drills one level
 * down to a checklist, on a computer beside the list (iPad), on a phone as its
 * own screen. Every change saves at once and says "Lagret", or the ATS's own
 * sentence when it refuses (outside the plan, the 30-day rules, a private
 * address). Locked options show a lock and "Spør oss".
 *
 * One fag (his words: "sa poata avea un singur rol pe luna"): single choice,
 * the four finishing trades first, changeable once a month.
 */

export type SaveSettings = (part: Partial<Record<SettingsField, unknown>>) => Promise<{ ok: true } | { ok: false; message: string }>;

const LEVEL_TITLE: Record<SettingsLevel, string> = { fag: "Fag", faser: "Faser", fylker: "Fylker", byer: "Byer", brev: "Brev", mottakere: "Mottakere" };

function AskUs() {
  return (
    <SupportButton lang="nb" showIcon={false} className={`inline-flex min-h-[3rem] items-center whitespace-nowrap font-semibold underline underline-offset-4 md:min-h-[2rem] ${SMALL} ${NAVY}`}>
      Spør oss
    </SupportButton>
  );
}

function Switch({ on, label, disabled, onChange }: { on: boolean; label: string; disabled?: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-[2rem] w-[3.25rem] shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-[#1B2B44]" : "bg-[#D1D1D6]"}`}
    >
      <span className={`absolute h-[1.75rem] w-[1.75rem] rounded-full bg-white shadow transition-transform ${on ? "translate-x-[1.375rem]" : "translate-x-[0.125rem]"}`} />
    </button>
  );
}

function DrillRow({ label, value, note, open, onOpen }: { label: string; value: string; note?: string | null; open: boolean; onOpen: () => void }) {
  return (
    <button type="button" className={`${ROW_BUTTON} ${open ? "bg-[#EAF0F8]" : ""}`} aria-current={open ? "true" : undefined} onClick={onOpen}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`${BODY} ${NAVY}`}>{label}</span>
        {note ? <span className={`${SMALL} ${GREY}`}>{note}</span> : null}
      </span>
      <span className={`min-w-0 max-w-[55%] truncate text-right ${BODY} ${GREY}`}>{value}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#C7C7CC]" aria-hidden />
    </button>
  );
}

function CheckRow({ label, on, locked, disabled, onPick, note }: { label: string; on: boolean; locked: boolean; disabled: boolean; onPick: () => void; note?: string }) {
  if (locked)
    return (
      <div className={ROW}>
        <Lock className="h-4 w-4 shrink-0 text-[#6D6D72]" aria-hidden />
        <span className={`min-w-0 flex-1 ${BODY} ${GREY}`}>{label}</span>
        <AskUs />
      </div>
    );
  return (
    <button type="button" role="menuitemcheckbox" aria-checked={on} className={ROW_BUTTON} disabled={disabled} onClick={onPick}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`${BODY} ${NAVY}`}>{label}</span>
        {note ? <span className={`${SMALL} ${GREY}`}>{note}</span> : null}
      </span>
      {on ? <Check className="h-5 w-5 shrink-0 text-[#1B2B44]" aria-label="Valgt" /> : <span className="h-5 w-5 shrink-0" />}
    </button>
  );
}

function Group({ head, foot, children }: { head?: string; foot?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      {head ? <p className={GROUP_HEAD}>{head}</p> : null}
      <div className={GROUP}>{children}</div>
      {foot ? <div className={`px-4 pt-1.5 ${SMALL} ${GREY}`}>{foot}</div> : null}
    </div>
  );
}

const toggled = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function MinSideAlertSettings({
  settings,
  level,
  onLevel,
  save,
  onStopped,
  stop,
}: {
  settings: AlertSettings;
  level: SettingsLevel | null;
  onLevel: (level: SettingsLevel | null) => void;
  save: SaveSettings;
  stop: () => Promise<{ ok: true } | { ok: false; message: string; field: string | null }>;
  onStopped: () => void;
}) {
  const [said, setSaid] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [askStop, setAskStop] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [now] = useState(() => Date.now());
  const s = settings;
  const a = s.allowed;

  const put = async (part: Partial<Record<SettingsField, unknown>>) => {
    setBusy(true);
    setSaid(null);
    const r = await save(part);
    setBusy(false);
    setSaid(r.ok ? { ok: true, text: "Lagret" } : { ok: false, text: r.message });
    return r.ok;
  };

  const labelsOf = (choices: Choice[], values: string[]) => values.map((v) => choices.find((c) => c.value === v)?.label ?? v);
  const fagOpen = fagChangeable(s, now);
  const cityLocked = Boolean(s.next_city_change && Date.parse(s.next_city_change) > now);

  const list = (
    <div className="flex min-w-0 flex-col gap-6">
      <Group head="Hva">
        <DrillRow label="Fag" value={s.fag_label || "Ikke valgt"} open={level === "fag"} onOpen={() => onLevel("fag")} />
        <DrillRow label="Faser" value={s.stages.length ? valueWords(labelsOf(a.stages, s.stages), "Alle") : "Alle"} open={level === "faser"} onOpen={() => onLevel("faser")} />
        <div className={ROW}>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={`${BODY} ${NAVY}`}>Store prosjekter</span>
            <span className={`${SMALL} ${GREY}`}>Vis også disse</span>
          </span>
          <Switch on={s.include_general} label="Store prosjekter: vis også disse" disabled={busy} onChange={(v) => void put({ include_general: v })} />
        </div>
      </Group>
      <Group head="Hvor">
        <DrillRow label="Fylker" value={valueWords(labelsOf(a.regions, s.regions), "Ingen")} open={level === "fylker"} onOpen={() => onLevel("fylker")} />
        <DrillRow
          label="Byer"
          value={valueWords(s.cities, "Hele fylket")}
          note={cityLocked && s.next_city_change ? `Kan endres igjen fra ${dayNo(s.next_city_change)}` : null}
          open={level === "byer"}
          onOpen={() => onLevel("byer")}
        />
        <div className={ROW}>
          <span className={`min-w-0 flex-1 ${BODY} ${NAVY}`}>Uten oppgitt sted</span>
          <Switch on={s.include_unplaced} label="Uten oppgitt sted" disabled={busy} onChange={(v) => void put({ include_unplaced: v })} />
        </div>
      </Group>
      <Group head="Når og hvem">
        <DrillRow label="Brev" value={letterWords(s)} open={level === "brev"} onOpen={() => onLevel("brev")} />
        <DrillRow label="Mottakere" value={s.recipients.length === 1 ? s.recipients[0] : `${s.recipients.length} mottakere`} open={level === "mottakere"} onOpen={() => onLevel("mottakere")} />
      </Group>
      <div className={GROUP}>
        <button type="button" className={`${ROW_BUTTON} justify-center font-semibold ${BODY} ${DANGER}`} onClick={() => setAskStop(true)}>
          Stopp varslene
        </button>
      </div>
    </div>
  );

  const levelView = (() => {
    if (!level) return null;
    if (level === "fag") {
      if (s.several)
        return (
          <Group foot="Abonnementet har flere fag i dag. Skriv til oss hvis dere vil endre dem.">
            <div className={ROW}>
              <span className={`min-w-0 flex-1 ${BODY} ${NAVY}`}>{s.fag_label}</span>
              <AskUs />
            </div>
          </Group>
        );
      const foot = `Ett fag i abonnementet. Det kan byttes én gang i måneden${s.next_fag_change && !fagOpen ? `, neste gang fra ${dayNo(s.next_fag_change)}` : ""}.`;
      const finishing = a.fag.filter((f) => f.group === "finishing");
      const other = a.fag.filter((f) => f.group !== "finishing");
      const row = (f: (typeof a.fag)[number]) => (
        <CheckRow key={f.value} label={f.label} on={s.fag === f.value} locked={f.locked} disabled={busy || !fagOpen || s.fag === f.value} onPick={() => void put({ fag: f.value })} />
      );
      return (
        <div className="flex flex-col gap-6">
          {finishing.length ? <Group head="Tømrer, gulv og maling">{finishing.map(row)}</Group> : null}
          {other.length ? <Group head="Andre fag" foot={foot}>{other.map(row)}</Group> : <p className={`px-4 ${SMALL} ${GREY}`}>{foot}</p>}
        </div>
      );
    }
    if (level === "faser") {
      const all = a.stages.filter((c) => !c.locked).map((c) => c.value);
      const pick = (v: string) => {
        const base = s.stages.length ? s.stages : all;
        const next = toggled(base, v);
        if (!next.length) return;
        void put({ stages: next.length === all.length ? [] : next });
      };
      return (
        <Group foot="Ingen valgt betyr alle faser.">
          {a.stages.map((c) => (
            <CheckRow key={c.value} label={c.label} on={!s.stages.length || s.stages.includes(c.value)} locked={c.locked} disabled={busy} onPick={() => pick(c.value)} />
          ))}
        </Group>
      );
    }
    if (level === "fylker")
      return (
        <Group>
          {a.regions.map((c) => (
            <CheckRow
              key={c.value}
              label={c.label}
              on={s.regions.includes(c.value)}
              locked={c.locked}
              disabled={busy || (s.regions.length === 1 && s.regions[0] === c.value)}
              onPick={() => void put({ regions: toggled(s.regions, c.value) })}
            />
          ))}
        </Group>
      );
    if (level === "byer")
      return (
        <Group foot={cityLocked && s.next_city_change ? `Kan endres igjen fra ${dayNo(s.next_city_change)}.` : "Ingen valgt betyr hele fylket."}>
          {a.city_options.length ? (
            a.city_options.map((o) => (
              <CheckRow
                key={o.name}
                label={o.name}
                note={o.count === 1 ? "1 prosjekt" : `${o.count} prosjekter`}
                on={s.cities.some((c) => c.toLocaleLowerCase("nb") === o.name.toLocaleLowerCase("nb"))}
                locked={false}
                disabled={busy || cityLocked}
                onPick={() => void put({ cities: s.cities.some((c) => c.toLocaleLowerCase("nb") === o.name.toLocaleLowerCase("nb")) ? s.cities.filter((c) => c.toLocaleLowerCase("nb") !== o.name.toLocaleLowerCase("nb")) : [...s.cities, o.name] })}
              />
            ))
          ) : (
            <div className={`${ROW} ${BODY} ${GREY}`}>Ingen byer å velge mellom ennå.</div>
          )}
        </Group>
      );
    if (level === "brev")
      return (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={GROUP_HEAD}>Hvor ofte</p>
            <div className={`${SEGMENTS} mx-0`} role="radiogroup" aria-label="Hvor ofte">
              {a.frequencies.map((f) =>
                f.locked ? (
                  <span key={f.value} className={`${segment(false)} cursor-not-allowed gap-1 opacity-60`} title="Ikke i abonnementet">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    {f.label}
                  </span>
                ) : (
                  <button key={f.value} type="button" role="radio" aria-checked={s.frequency === f.value} disabled={busy} className={segment(s.frequency === f.value)} onClick={() => void put({ frequency: f.value })}>
                    {f.label || FREQUENCY_LABEL[f.value as keyof typeof FREQUENCY_LABEL]}
                  </button>
                ),
              )}
            </div>
            {a.frequencies.some((f) => f.locked) ? (
              <div className="px-1">
                <AskUs />
              </div>
            ) : null}
          </div>
          {s.frequency !== "daily" && a.weekdays.length ? (
            <Group head="Dag">
              {a.weekdays.map((d) => (
                <CheckRow key={d} label={WEEKDAY_NO[d - 1][0].toLocaleUpperCase("nb") + WEEKDAY_NO[d - 1].slice(1)} on={s.send_weekday === d} locked={false} disabled={busy} onPick={() => void put({ send_weekday: d })} />
              ))}
            </Group>
          ) : null}
          {a.hours.length ? (
            <Group head="Klokkeslett">
              <label className={ROW}>
                <span className={`min-w-0 flex-1 ${BODY} ${NAVY}`}>Kl.</span>
                <select className={`${INPUT} w-auto`} value={s.send_hour ?? ""} disabled={busy} onChange={(e) => void put({ send_hour: Number(e.target.value) })}>
                  {s.send_hour === null ? <option value="">Velg</option> : null}
                  {a.hours.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </label>
            </Group>
          ) : null}
        </div>
      );
    // mottakere
    const full = s.recipients.length >= a.max_recipients;
    const add = async () => {
      const email = newRecipient.trim();
      if (!email) return;
      if (await put({ recipients: [...s.recipients, email] })) setNewRecipient("");
    };
    return (
      <div className="flex flex-col gap-6">
        <Group foot={full ? `Abonnementet har plass til ${a.max_recipients} ${a.max_recipients === 1 ? "mottaker" : "mottakere"}.` : "Bruk e-postadresser i firmaet."}>
          {s.recipients.map((e) => (
            <div key={e} className={ROW}>
              <span className={`min-w-0 flex-1 truncate ${BODY} ${NAVY}`}>{e}</span>
              <button type="button" className={`${PILL} md:min-h-[2rem]`} disabled={busy || s.recipients.length <= 1} onClick={() => void put({ recipients: s.recipients.filter((x) => x !== e) })} aria-label={`Fjern ${e}`}>
                Fjern
              </button>
            </div>
          ))}
        </Group>
        {full ? (
          <AskUs />
        ) : (
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <label htmlFor="ms-new-recipient" className="sr-only">
              Ny mottaker
            </label>
            <input id="ms-new-recipient" type="email" autoComplete="email" className={INPUT} placeholder="navn@firma.no" maxLength={254} value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} />
            <button type="submit" className={PILL} disabled={busy || !newRecipient.trim()}>
              + Legg til
            </button>
          </form>
        )}
      </div>
    );
  })();

  return (
    <div className="flex min-w-0 flex-col gap-5" data-alert-settings="">
      <div className={`${CARD} p-4`} aria-live="polite">
        <p className={`${BODY} font-semibold ${NAVY}`} data-settings-summary="">
          {summaryLine(s.summary)}
        </p>
        {said ? (
          <p role={said.ok ? "status" : "alert"} className={`${SMALL} ${said.ok ? "text-[#146C43]" : "text-[#C4231A]"}`}>
            {said.text}
          </p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* Phone: the list, or the level as its own screen. Computer: both, side by side. */}
        <div className={level ? "hidden lg:block" : ""}>{list}</div>
        {level ? (
          <div className="flex min-w-0 flex-col gap-4">
            <button type="button" onClick={() => onLevel(null)} className={`inline-flex min-h-[3.25rem] items-center gap-1 self-start font-semibold lg:hidden ${BODY} ${NAVY}`}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
              Innstillinger
            </button>
            <h3 className={`${LARGE_TITLE} ${NAVY} lg:text-[1.375rem]`}>{LEVEL_TITLE[level]}</h3>
            {levelView}
          </div>
        ) : null}
      </div>

      {askStop ? (
        <PortalModal title="Stopp varslene" size="narrow" onClose={() => setAskStop(false)}>
          <ConfirmForm
            text="Dere får ikke flere prosjektvarsler fra oss."
            label="Stopp"
            onCancel={() => setAskStop(false)}
            onConfirm={async () => {
              const r = await stop();
              if (r.ok) {
                setAskStop(false);
                onStopped();
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}
    </div>
  );
}
