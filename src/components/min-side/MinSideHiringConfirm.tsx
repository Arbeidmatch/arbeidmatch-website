"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";

import {
  RECEIVE_MAX,
  confirmMatchesFrom,
  hiringConfirmBody,
  hiringConfirmCountBody,
  hiringConfirmMissing,
  hiringConfirmValues,
  orgNumberNo,
  type HiringConfirm,
  type HiringConfirmValues,
  type TermsText,
} from "@/lib/min-side/profile";
import type { Fetched, Saved } from "./MinSideHiring";
import { PRIMARY, SECONDARY } from "@/components/prosjekter/ui";
import { Block, CHECK, CHOICE, FieldError, ReadOnlyLine, TextField, type Failed } from "./MinSideHiringBilling";
import { Chips, Control, FREQUENCIES, OccupationChips, firmsWord, toggled } from "./MinSideHiringSettings";
import { BTN_GREEN, FIELD_L, INK, LINK_L, MUTED_L, SOFT, chip } from "./ui";

/**
 * ORDER 171: "Bekreft og start", the one screen an invited client sees before
 * the hiring list. ORDER 181: three blocks, each of at most seven controls:
 * who he is (with the firm read-only), what he wants to receive (trades,
 * counties, how often, only new; nothing else, his rule P4), and one box for
 * the terms, whose text opens in a dialog (25 November 2026: no scroll inside
 * the page, the terms not repeated on it). Billing is asked later, only when a paid plan starts.
 * "Godta og start" is the green action and is never greyed out: a press with
 * something missing names it under its field and scrolls there (5 November
 * 2026, after an invited client pressed a disabled button and saw nothing).
 * On success the page reloads and the section shows the list.
 */

type Send = (body: Record<string, unknown>) => Promise<Saved>;
type SendData = (body: Record<string, unknown>) => Promise<Fetched>;

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

/** The fields the ATS can name in a refusal; anything else is shown above the button. */
const OWN_PLACE = new Set(["full_name", "email", "trades", "counties", "frequency", "accept_terms", "accept_beta"]);

/** How long the live count waits after the last change before it asks. */
export const COUNT_DELAY_MS = 300;

/** The live count: a number, null while it is asked, false when it could not be had. */
export type Matches = number | null | false;

/** "Treff nå: N bedrifter", or what to do to see it. */
export function matchesLine(counties: string[], matches: Matches): string {
  if (counties.length === 0) return "Velg minst ett fylke for å se treff.";
  if (matches === false) return "Treff kan ikke vises akkurat nå.";
  return matches === null ? "Treff nå: ..." : `Treff nå: ${firmsWord(matches)}`;
}

export type ConfirmFieldsProps = {
  confirm: HiringConfirm;
  terms: TermsText;
  value: HiringConfirmValues;
  onChange: (part: Partial<HiringConfirmValues>) => void;
  busy: boolean;
  failed: Failed;
  /** The live count for the counties and trades on screen. */
  matches: Matches;
  /** Opens the terms in a dialog; the screen itself shows only the box. */
  onReadTerms?: () => void;
};

/** The three blocks and the button, drawn from the values; the state lives in HiringConfirmScreen. */
export function ConfirmFields({ confirm, value: v, onChange, busy, failed, matches, onReadTerms }: ConfirmFieldsProps) {
  const c = confirm.company;
  const o = confirm.options;
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);
  const general = failed && !OWN_PLACE.has(failed.field ?? "") ? failed.message : null;

  return (
    <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
      <legend className="sr-only">Bekreft og start</legend>

      <Block id="person" title="Dine opplysninger">
        <TextField id="ms-cf-name" label="Fullt navn" error={errorFor("full_name")}>
          <input id="ms-cf-name" className={FIELD_L} value={v.full_name} maxLength={120} autoComplete="name" onChange={(e) => onChange({ full_name: e.target.value })} />
        </TextField>
        <TextField id="ms-cf-role" label="Stilling">
          <input id="ms-cf-role" className={FIELD_L} value={v.role} maxLength={80} autoComplete="organization-title" onChange={(e) => onChange({ role: e.target.value })} />
        </TextField>
        <TextField id="ms-cf-email" label="E-post på jobb" error={errorFor("email")}>
          <input id="ms-cf-email" className={FIELD_L} type="email" value={v.email} maxLength={254} autoComplete="email" inputMode="email" onChange={(e) => onChange({ email: e.target.value })} />
        </TextField>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <ReadOnlyLine label="Firma">{c.name || "Ikke oppgitt"}</ReadOnlyLine>
          <ReadOnlyLine label="Org.nr">
            <span className="tabular-nums">{c.org_number ? orgNumberNo(c.org_number) : "Ikke oppgitt"}</span>
          </ReadOnlyLine>
        </div>
      </Block>

      <Block id="receive" title="Hva vil du motta">
        <Control legend="Yrker">
          <OccupationChips areas={o.areas} trades={o.trades} value={v.trades} max={RECEIVE_MAX} onChange={(trades) => onChange({ trades })} />
          <div id="ms-cf-trades"><FieldError message={errorFor("trades")} /></div>
        </Control>

        <Control legend="Fylker">
          <Chips>
            {o.counties.map((x) => {
              const on = v.counties.includes(x.code);
              return (
                <button key={x.code} type="button" aria-pressed={on} className={chip(on)} disabled={!on && v.counties.length >= RECEIVE_MAX} onClick={() => onChange({ counties: toggled(v.counties, x.code) })}>
                  {x.name}
                </button>
              );
            })}
          </Chips>
          <div id="ms-cf-counties"><FieldError message={errorFor("counties")} /></div>
        </Control>

        <Control legend="Hvor ofte">
          <Chips>
            {FREQUENCIES.map((f) => (
              <button key={f.key} type="button" aria-pressed={v.frequency === f.key} className={chip(v.frequency === f.key, true)} onClick={() => onChange({ frequency: f.key })}>
                {f.label}
              </button>
            ))}
          </Chips>
          <FieldError message={errorFor("frequency")} />
        </Control>

        <Control legend="Nye stillinger">
          <label htmlFor="ms-cf-only-new" className={`${CHOICE} ${SOFT}`}>
            <input id="ms-cf-only-new" type="checkbox" className={CHECK} checked={v.only_new} onChange={(e) => onChange({ only_new: e.target.checked })} />
            Bare nye stillinger siden sist
          </label>
        </Control>

        <p data-matches="" className={`text-[15px] font-bold ${v.counties.length ? INK : MUTED_L}`} aria-live="polite">
          {matchesLine(v.counties, matches)}
        </p>
      </Block>

      <div id="terms" data-terms="" className="flex min-w-0 flex-col">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3">
          <label htmlFor="ms-cf-terms" className={CHOICE}>
            <input id="ms-cf-terms" type="checkbox" className={CHECK} checked={v.accept_terms && v.accept_beta} onChange={(e) => onChange({ accept_terms: e.target.checked, accept_beta: e.target.checked })} />
            <span className="min-w-0 break-words">Jeg godtar vilkårene for betatesten</span>
          </label>
          <button type="button" className={LINK_L} aria-haspopup="dialog" onClick={onReadTerms}>
            Les vilkårene
          </button>
        </div>
        <FieldError message={errorFor("accept_terms") ?? errorFor("accept_beta")} />
      </div>

      <FieldError message={general} />
      <button type="submit" className={`${BTN_GREEN} w-full sm:w-auto sm:self-start`} disabled={busy}>
        {busy ? "Lagrer ..." : "Godta og start"}
      </button>
    </fieldset>
  );
}

/**
 * The live count: the prefill's number at first, then hiring_confirm_count
 * COUNT_DELAY_MS after the last change of the trades or counties. An answer
 * that arrives after a newer change is dropped. No county asks nothing.
 */
function useConfirmMatches(confirm: HiringConfirm, value: HiringConfirmValues, sendData: SendData): Matches {
  const [matches, setMatches] = useState<Matches>(confirm.matches);
  const asked = useRef(0);
  const { counties, trades } = value;
  // The choice the ATS already counted: back at it, its number is shown again without asking.
  const prefill = useRef(`${confirm.receive.counties.join(",")}|${confirm.receive.trades.join(",")}`);
  useEffect(() => {
    const id = ++asked.current;
    if (counties.length === 0) return;
    const t = window.setTimeout(() => {
      if (`${counties.join(",")}|${trades.join(",")}` === prefill.current) {
        setMatches(confirm.matches);
        return;
      }
      setMatches(null);
      void sendData(hiringConfirmCountBody({ counties, trades })).then((r) => {
        if (id !== asked.current) return;
        setMatches((r.ok ? confirmMatchesFrom(r.data) : null) ?? false);
      });
    }, COUNT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [counties, trades, sendData, confirm.matches]);
  return matches;
}

/** Where each missing thing is on the screen, for the scroll after a press. */
const CONFIRM_ANCHOR: Record<string, string> = { full_name: "ms-cf-name", email: "ms-cf-email", trades: "ms-cf-trades", counties: "ms-cf-counties", accept_terms: "ms-cf-terms", accept_beta: "ms-cf-terms" };

/**
 * The terms, read in a dialog as on other platforms (his rule, 25 November 2026):
 * the screen holds one box, the text opens on "Les vilkårene", and the dialog's
 * Godta ticks the box. The text is shown here only, never repeated on the page.
 */
export function TermsReader({ terms, onAccept, onClose }: { terms: TermsText; onAccept: () => void; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-white">
        {terms.paragraphs.map((p, i) => (
          <p key={i} className="break-words">
            {p}
          </p>
        ))}
        {terms.version ? <p className="text-xs text-white/60">Versjon {terms.version}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        <button type="button" data-autofocus className={PRIMARY} onClick={onAccept}>
          Godta
        </button>
        <button type="button" className={SECONDARY} onClick={onClose}>
          Lukk
        </button>
      </div>
    </div>
  );
}

/** The screen with its state; a success reloads the page through send, which then shows the list. */
export default function HiringConfirmScreen({ confirm, terms, send, sendData }: { confirm: HiringConfirm; terms: TermsText; send: Send; sendData: SendData }) {
  const [value, setValue] = useState<HiringConfirmValues>(() => hiringConfirmValues(confirm));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Failed>(null);
  const [reading, setReading] = useState(false);
  const matches = useConfirmMatches(confirm, value, sendData);

  const change = (part: Partial<HiringConfirmValues>) => {
    setValue((v) => ({ ...v, ...part }));
    if (failed?.field && Object.keys(part).some((k) => k === failed.field)) setFailed(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const missing = hiringConfirmMissing(value);
    if (missing) {
      setFailed(missing);
      window.setTimeout(() => document.getElementById(CONFIRM_ANCHOR[missing.field] ?? "")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setBusy(true);
    setFailed(null);
    const r = await send(hiringConfirmBody(value));
    setBusy(false);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-4">
      <h3 className={`text-lg font-bold ${INK}`}>Bekreft og start</h3>
      <ConfirmFields
        confirm={confirm}
        terms={terms}
        value={value}
        busy={busy}
        failed={failed}
        matches={matches}
        onReadTerms={() => setReading(true)}
        onChange={change}
      />
      {reading ? (
        <PortalModal title={terms.title} onClose={() => setReading(false)}>
          <TermsReader
            terms={terms}
            onClose={() => setReading(false)}
            onAccept={() => {
              change({ accept_terms: true, accept_beta: true });
              setReading(false);
            }}
          />
        </PortalModal>
      ) : null}
    </form>
  );
}
