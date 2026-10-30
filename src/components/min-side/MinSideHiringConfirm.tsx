"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { hasEhfAddress, hiringConfirmBody, hiringConfirmReady, hiringConfirmValues, orgNumberNo, type HiringConfirm, type HiringConfirmValues, type TermsText } from "@/lib/min-side/profile";
import type { Saved } from "./MinSideHiring";
import { BTN_OUTLINE, CARD_L, ERROR_L, FIELD_L, INK, MUTED_L, SOFT } from "./ui";

/**
 * ORDER 171: "Bekreft og start", the one screen an invited client sees before
 * the hiring list. Three blocks of at most seven controls: who he is, how his
 * firm is invoiced, and the terms with the two boxes. "Godta og start" stays
 * disabled until every rule in hiringConfirmReady holds; on success the page
 * reloads and the section shows the list.
 */

type Send = (body: Record<string, unknown>) => Promise<Saved>;
type Failed = { message: string; field: string | null } | null;

/** The fields the ATS can name in a refusal; anything else is shown above the button. */
const OWN_PLACE = new Set(["full_name", "email", "delivery", "invoice_email", "billing_postal_code", "accept_terms", "accept_beta"]);

const CHECK = "h-5 w-5 shrink-0 accent-[#1B2B44]";
const READ_ONLY = `${FIELD_L} cursor-default bg-[#F4F6F9]`;
const CHOICE = `flex min-h-[44px] items-center gap-3 text-[15px] ${INK}`;

function FieldError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className={`text-sm font-semibold ${ERROR_L}`}>
      {message}
    </p>
  ) : null;
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section data-block={id} aria-labelledby={`ms-cf-h-${id}`} className={`${CARD_L} flex min-w-0 flex-col gap-4 p-4 sm:p-5`}>
      <h4 id={`ms-cf-h-${id}`} className={`text-[15px] font-bold ${INK}`}>
        {title}
      </h4>
      {children}
    </section>
  );
}

/** A labelled text field; data-control marks it so a block's controls can be counted. */
function TextField({ id, label, error, children }: { id: string; label: string; error?: string | null; children: ReactNode }) {
  return (
    <div data-control="" className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={`text-sm font-semibold ${INK}`}>
        {label}
      </label>
      {children}
      <FieldError message={error ?? null} />
    </div>
  );
}

function ReadOnlyLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className={`text-xs font-semibold ${MUTED_L}`}>{label}</span>
      <span className={`min-w-0 break-words text-[15px] ${INK}`}>{children}</span>
    </div>
  );
}

export type ConfirmFieldsProps = {
  confirm: HiringConfirm;
  terms: TermsText;
  value: HiringConfirmValues;
  onChange: (part: Partial<HiringConfirmValues>) => void;
  busy: boolean;
  failed: Failed;
};

/** The three blocks and the button, drawn from the values; the state lives in HiringConfirmScreen. */
export function ConfirmFields({ confirm, terms, value: v, onChange, busy, failed }: ConfirmFieldsProps) {
  const c = confirm.company;
  const ehfOk = hasEhfAddress(confirm);
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);
  const general = failed && !OWN_PLACE.has(failed.field ?? "") ? failed.message : null;
  const ready = hiringConfirmReady(v, confirm);
  const firmAddress = [c.address, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

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
      </Block>

      <Block id="company" title="Firma og fakturering">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <ReadOnlyLine label="Firma">{c.name || "Ikke oppgitt"}</ReadOnlyLine>
          <ReadOnlyLine label="Org.nr">
            <span className="tabular-nums">{c.org_number ? orgNumberNo(c.org_number) : "Ikke oppgitt"}</span>
          </ReadOnlyLine>
        </div>

        <fieldset data-control="" className="flex min-w-0 flex-col">
          <legend className={`mb-1 text-sm font-semibold ${INK}`}>Fakturaadresse</legend>
          <label className={CHOICE}>
            <input type="radio" name="ms-cf-billing" className={CHECK} checked={v.billing_same_as_address} onChange={() => onChange({ billing_same_as_address: true })} />
            Samme som firmaadressen
          </label>
          {v.billing_same_as_address ? <p className={`break-words pb-1 pl-8 text-sm ${SOFT}`}>{firmAddress || "Ikke oppgitt"}</p> : null}
          <label className={CHOICE}>
            <input type="radio" name="ms-cf-billing" className={CHECK} checked={!v.billing_same_as_address} onChange={() => onChange({ billing_same_as_address: false })} />
            En annen adresse
          </label>
        </fieldset>
        {!v.billing_same_as_address ? (
          <>
            <TextField id="ms-cf-b-address" label="Adresse">
              <input id="ms-cf-b-address" className={FIELD_L} value={v.billing_address} maxLength={200} autoComplete="street-address" onChange={(e) => onChange({ billing_address: e.target.value })} />
            </TextField>
            <div className="grid min-w-0 gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
              <TextField id="ms-cf-b-postal" label="Postnummer" error={errorFor("billing_postal_code")}>
                <input id="ms-cf-b-postal" className={FIELD_L} value={v.billing_postal_code} maxLength={12} inputMode="numeric" autoComplete="postal-code" onChange={(e) => onChange({ billing_postal_code: e.target.value })} />
              </TextField>
              <TextField id="ms-cf-b-city" label="Sted">
                <input id="ms-cf-b-city" className={FIELD_L} value={v.billing_city} maxLength={80} autoComplete="address-level2" onChange={(e) => onChange({ billing_city: e.target.value })} />
              </TextField>
            </div>
          </>
        ) : null}

        <fieldset data-control="" className="flex min-w-0 flex-col">
          <legend className={`mb-1 text-sm font-semibold ${INK}`}>Faktura sendes som</legend>
          <label className={CHOICE}>
            <input type="radio" name="ms-cf-delivery" value="email" className={CHECK} checked={v.delivery === "email"} onChange={() => onChange({ delivery: "email" })} />
            E-post
          </label>
          <label className={`${CHOICE} ${ehfOk ? "" : "cursor-not-allowed opacity-60"}`}>
            <input type="radio" name="ms-cf-delivery" value="ehf" className={CHECK} checked={v.delivery === "ehf"} disabled={!ehfOk} onChange={() => onChange({ delivery: "ehf" })} />
            EHF
          </label>
          {ehfOk ? (
            v.delivery === "ehf" ? <p className={`pb-1 pl-8 text-sm ${SOFT}`}>EHF-adresse: org.nr {orgNumberNo(c.org_number ?? "")}</p> : null
          ) : (
            <p className={`pl-8 text-sm ${MUTED_L}`}>EHF krever et gyldig org.nr.</p>
          )}
          <FieldError message={errorFor("delivery")} />
        </fieldset>
        {v.delivery === "email" ? (
          <TextField id="ms-cf-inv-email" label="Faktura-e-post" error={errorFor("invoice_email")}>
            {c.invoice_email_locked ? (
              <input id="ms-cf-inv-email" className={READ_ONLY} type="email" value={v.invoice_email} readOnly aria-readonly="true" />
            ) : (
              <input id="ms-cf-inv-email" className={FIELD_L} type="email" value={v.invoice_email} maxLength={254} autoComplete="email" inputMode="email" onChange={(e) => onChange({ invoice_email: e.target.value })} />
            )}
          </TextField>
        ) : null}
      </Block>

      <Block id="terms" title="Vilkår">
        <div className={`flex max-h-[45vh] min-w-0 flex-col gap-3 overflow-y-auto pr-1 text-[15px] leading-relaxed ${SOFT}`} tabIndex={0} aria-label={terms.title}>
          <p className={`font-semibold ${INK}`}>{terms.title}</p>
          {terms.paragraphs.map((p, i) => (
            <p key={i} className="break-words">
              {p}
            </p>
          ))}
          {terms.version ? <p className={`text-xs ${MUTED_L}`}>Versjon {terms.version}</p> : null}
        </div>
        <div data-control="" className="flex min-w-0 flex-col">
          <label htmlFor="ms-cf-terms" className={CHOICE}>
            <input id="ms-cf-terms" type="checkbox" className={CHECK} checked={v.accept_terms} onChange={(e) => onChange({ accept_terms: e.target.checked })} />
            Jeg godtar vilkårene
          </label>
          <FieldError message={errorFor("accept_terms")} />
        </div>
        <div data-control="" className="flex min-w-0 flex-col">
          <label htmlFor="ms-cf-beta" className={`${CHOICE} py-2`}>
            <input id="ms-cf-beta" type="checkbox" className={CHECK} checked={v.accept_beta} onChange={(e) => onChange({ accept_beta: e.target.checked })} />
            <span className="min-w-0 break-words">{confirm.beta}</span>
          </label>
          <FieldError message={errorFor("accept_beta")} />
        </div>
      </Block>

      <FieldError message={general} />
      <button type="submit" className={`${BTN_OUTLINE} w-full sm:w-auto sm:self-start`} disabled={busy || !ready}>
        {busy ? "Lagrer ..." : "Godta og start"}
      </button>
    </fieldset>
  );
}

/** The screen with its state; a success reloads the page through send, which then shows the list. */
export default function HiringConfirmScreen({ confirm, terms, send }: { confirm: HiringConfirm; terms: TermsText; send: Send }) {
  const [value, setValue] = useState<HiringConfirmValues>(() => hiringConfirmValues(confirm));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Failed>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !hiringConfirmReady(value, confirm)) return;
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
        onChange={(part) => {
          setValue((v) => ({ ...v, ...part }));
          if (failed?.field && Object.keys(part).includes(failed.field)) setFailed(null);
        }}
      />
    </form>
  );
}
