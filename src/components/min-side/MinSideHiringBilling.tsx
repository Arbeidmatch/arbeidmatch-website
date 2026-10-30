"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { hasEhfAddress, hiringBillingReady, hiringBillingValues, orgNumberNo, type HiringBilling, type HiringBillingValues } from "@/lib/min-side/profile";
import type { Saved } from "./MinSideHiring";
import { BTN_OUTLINE, CARD_L, ERROR_L, FIELD_L, INK, MUTED_L, SOFT } from "./ui";

/**
 * ORDER 171 built these fields on "Bekreft og start"; ORDER 181 moved them
 * here, to the one screen "Fakturering" a client sees only when a paid plan
 * starts: the billing address (the firm's own or another) and the invoice by
 * E-post or EHF. The invoice e-mail on file is shown read-only when locked.
 */

export type Failed = { message: string; field: string | null } | null;

/** The fields the ATS can name in a billing refusal; anything else is shown above the button. */
export const BILLING_FIELDS = new Set(["delivery", "invoice_email", "billing_postal_code", "billing"]);

export const CHECK = "h-5 w-5 shrink-0 accent-[#1B2B44]";
export const READ_ONLY = `${FIELD_L} cursor-default bg-[#F4F6F9]`;
export const CHOICE = `flex min-h-[44px] items-center gap-3 text-[15px] ${INK}`;

export function FieldError({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className={`text-sm font-semibold ${ERROR_L}`}>
      {message}
    </p>
  ) : null;
}

export function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
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
export function TextField({ id, label, error, children }: { id: string; label: string; error?: string | null; children: ReactNode }) {
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

export function ReadOnlyLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className={`text-xs font-semibold ${MUTED_L}`}>{label}</span>
      <span className={`min-w-0 break-words text-[15px] ${INK}`}>{children}</span>
    </div>
  );
}

export type BillingFieldsProps = {
  billing: HiringBilling;
  value: HiringBillingValues;
  onChange: (part: Partial<HiringBillingValues>) => void;
  errorFor: (field: string) => string | null;
};

/** The billing block: firm and org. number read-only, the address, and E-post or EHF. */
export function BillingFields({ billing: c, value: v, onChange, errorFor }: BillingFieldsProps) {
  const ehfOk = hasEhfAddress(c);
  const firmAddress = [c.address, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return (
    <Block id="billing" title="Fakturering">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <ReadOnlyLine label="Firma">{c.name || "Ikke oppgitt"}</ReadOnlyLine>
        <ReadOnlyLine label="Org.nr">
          <span className="tabular-nums">{c.org_number ? orgNumberNo(c.org_number) : "Ikke oppgitt"}</span>
        </ReadOnlyLine>
      </div>

      <fieldset data-control="" className="flex min-w-0 flex-col">
        <legend className={`mb-1 text-sm font-semibold ${INK}`}>Fakturaadresse</legend>
        <label className={CHOICE}>
          <input type="radio" name="ms-bl-billing" className={CHECK} checked={v.billing_same_as_address} onChange={() => onChange({ billing_same_as_address: true })} />
          Samme som firmaadressen
        </label>
        {v.billing_same_as_address ? <p className={`break-words pb-1 pl-8 text-sm ${SOFT}`}>{firmAddress || "Ikke oppgitt"}</p> : null}
        <label className={CHOICE}>
          <input type="radio" name="ms-bl-billing" className={CHECK} checked={!v.billing_same_as_address} onChange={() => onChange({ billing_same_as_address: false })} />
          En annen adresse
        </label>
      </fieldset>
      {!v.billing_same_as_address ? (
        <>
          <TextField id="ms-bl-address" label="Adresse">
            <input id="ms-bl-address" className={FIELD_L} value={v.billing_address} maxLength={200} autoComplete="street-address" onChange={(e) => onChange({ billing_address: e.target.value })} />
          </TextField>
          <div className="grid min-w-0 gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <TextField id="ms-bl-postal" label="Postnummer" error={errorFor("billing_postal_code")}>
              <input id="ms-bl-postal" className={FIELD_L} value={v.billing_postal_code} maxLength={12} inputMode="numeric" autoComplete="postal-code" onChange={(e) => onChange({ billing_postal_code: e.target.value })} />
            </TextField>
            <TextField id="ms-bl-city" label="Sted">
              <input id="ms-bl-city" className={FIELD_L} value={v.billing_city} maxLength={80} autoComplete="address-level2" onChange={(e) => onChange({ billing_city: e.target.value })} />
            </TextField>
          </div>
        </>
      ) : null}

      <fieldset data-control="" className="flex min-w-0 flex-col">
        <legend className={`mb-1 text-sm font-semibold ${INK}`}>Faktura sendes som</legend>
        <label className={CHOICE}>
          <input type="radio" name="ms-bl-delivery" value="email" className={CHECK} checked={v.delivery === "email"} onChange={() => onChange({ delivery: "email" })} />
          E-post
        </label>
        <label className={`${CHOICE} ${ehfOk ? "" : "cursor-not-allowed opacity-60"}`}>
          <input type="radio" name="ms-bl-delivery" value="ehf" className={CHECK} checked={v.delivery === "ehf"} disabled={!ehfOk} onChange={() => onChange({ delivery: "ehf" })} />
          EHF
        </label>
        {ehfOk ? (
          v.delivery === "ehf" ? <p className={`pb-1 pl-8 text-sm ${SOFT}`}>EHF-adresse: org.nr {orgNumberNo(c.org_number ?? "")}</p> : null
        ) : (
          <p className={`pl-8 text-sm ${MUTED_L}`}>EHF krever et gyldig org.nr.</p>
        )}
        <FieldError message={errorFor("delivery") ?? errorFor("billing")} />
      </fieldset>
      {v.delivery === "email" ? (
        <TextField id="ms-bl-inv-email" label="Faktura-e-post" error={errorFor("invoice_email")}>
          {c.invoice_email_locked ? (
            <input id="ms-bl-inv-email" className={READ_ONLY} type="email" value={v.invoice_email} readOnly aria-readonly="true" />
          ) : (
            <input id="ms-bl-inv-email" className={FIELD_L} type="email" value={v.invoice_email} maxLength={254} autoComplete="email" inputMode="email" onChange={(e) => onChange({ invoice_email: e.target.value })} />
          )}
        </TextField>
      ) : null}
    </Block>
  );
}

/**
 * "Fakturering": the billing block and one button, opened when a paid plan is
 * chosen and the firm has no invoicing on file. `submit` sends hiring_premium
 * with the billing; a refusal lands at its field.
 */
export function HiringBillingScreen({ billing, submit, onCancel }: { billing: HiringBilling; submit: (v: HiringBillingValues) => Promise<Saved>; onCancel: () => void }) {
  const [value, setValue] = useState<HiringBillingValues>(() => hiringBillingValues(billing));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Failed>(null);
  const ready = hiringBillingReady(value, billing);
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);
  const general = failed && !BILLING_FIELDS.has(failed.field ?? "") ? failed.message : null;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setFailed(null);
    const r = await submit(value);
    setBusy(false);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
  };

  return (
    <form onSubmit={send} noValidate data-billing-screen="" className="flex min-w-0 flex-col gap-4">
      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
        <legend className="sr-only">Fakturering</legend>
        <BillingFields
          billing={billing}
          value={value}
          errorFor={errorFor}
          onChange={(part) => {
            setValue((v) => ({ ...v, ...part }));
            if (failed?.field && (Object.keys(part).includes(failed.field) || failed.field === "billing")) setFailed(null);
          }}
        />
        <FieldError message={general} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={`${BTN_OUTLINE} w-full sm:w-auto`} disabled={busy || !ready}>
            {busy ? "Lagrer ..." : "Bekreft"}
          </button>
          <button type="button" className={`${BTN_OUTLINE} w-full sm:w-auto`} disabled={busy} onClick={onCancel}>
            Avbryt
          </button>
        </div>
      </fieldset>
    </form>
  );
}
