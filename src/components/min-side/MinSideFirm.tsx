"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronRight, Lock } from "lucide-react";

import { addressLine, orgNumberNo, dayNo, type Company, type Contact } from "@/lib/min-side/profile";
import { companyReportFrom, type CompanyReport } from "@/lib/min-side/project-detail";
import { BODY, GREY, GROUP, GROUP_HEAD, INPUT, NAVY, PILL, ROW, ROW_BUTTON, SMALL } from "./ios";
import type { Fetched, Saved } from "./MinSideHiring";

/**
 * ORDER 273: Firma, Faktura and Kontaktpersoner as iOS rows: the label on the
 * left, the value on the right, a tap opens the field in place and it is saved
 * at once (no Endre button, no dialog). The register's name and number carry a
 * lock. "Sjekk firma" shows what the free public registers hold about the
 * firm, only after it is pressed (his words: "doar daca apasa pe check
 * company"); never risk, credit or classification.
 */

type Details = Record<string, string | boolean>;
type Send = (body: Record<string, unknown>) => Promise<Saved>;

function LockMark() {
  return <Lock className="h-4 w-4 shrink-0 text-[#6D6D72]" aria-label="Fra registeret" />;
}

/** One row: the label, the value, and the place where it is edited. */
function ValueRow({ label, value, locked = false, nowrap = false }: { label: string; value: ReactNode; locked?: boolean; nowrap?: boolean }) {
  return (
    <div className={ROW}>
      <span className={`shrink-0 ${BODY} ${NAVY}`}>{label}</span>
      <span className={`flex min-w-0 flex-1 items-center justify-end gap-2 text-right ${BODY} ${GREY}`}>
        <span className={nowrap ? "whitespace-nowrap" : "min-w-0 break-words"}>{value}</span>
        {locked ? <LockMark /> : null}
      </span>
    </div>
  );
}

type Field = { key: string; label: string; value: string; type?: string; inputMode?: "numeric" | "tel" | "url"; max: number };

/** A row that opens into its fields on a tap and saves them together. */
function EditRow({ label, shown, fields, onSave }: { label: string; shown: string; fields: Field[]; onSave: (part: Record<string, string>) => Promise<Saved> }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const start = () => {
    setV(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    setError(null);
    setSaved(false);
    setOpen(true);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await onSave(v);
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      setSaved(true);
    } else setError(r.message);
  };

  if (!open)
    return (
      <button type="button" className={ROW_BUTTON} onClick={start}>
        <span className={`shrink-0 ${BODY} ${NAVY}`}>{label}</span>
        <span className={`min-w-0 flex-1 break-words text-right ${BODY} ${GREY}`}>
          {shown || "Ikke oppgitt"}
          {saved ? <span className="ml-2 text-[#146C43]">Lagret</span> : null}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#C7C7CC]" aria-hidden />
      </button>
    );
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 px-4 py-3" noValidate>
      <p className={`${BODY} font-semibold ${NAVY}`}>{label}</p>
      {fields.map((f, i) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className={`${SMALL} ${GREY}`}>{f.label}</span>
          <input
            className={INPUT}
            type={f.type ?? "text"}
            inputMode={f.inputMode}
            maxLength={f.max}
            autoFocus={i === 0}
            value={v[f.key] ?? ""}
            onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
          />
        </label>
      ))}
      {error ? (
        <p role="alert" className={`${SMALL} text-[#C4231A]`}>
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={PILL} disabled={busy}>
          {busy ? "Lagrer ..." : "Lagre"}
        </button>
        <button type="button" className={PILL} disabled={busy} onClick={() => setOpen(false)}>
          Avbryt
        </button>
      </div>
    </form>
  );
}

function SwitchRow({ label, on, onChange }: { label: string; on: boolean; onChange: (next: boolean) => Promise<Saved> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flip = async () => {
    setBusy(true);
    setError(null);
    const r = await onChange(!on);
    setBusy(false);
    if (!r.ok) setError(r.message);
  };
  return (
    <div className={`${ROW} flex-wrap`}>
      <span className={`min-w-0 flex-1 ${BODY} ${NAVY}`}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={busy}
        onClick={() => void flip()}
        className={`relative inline-flex h-[2rem] w-[3.25rem] shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-[#1B2B44]" : "bg-[#D1D1D6]"}`}
      >
        <span className={`absolute h-[1.75rem] w-[1.75rem] rounded-full bg-white shadow transition-transform ${on ? "translate-x-[1.375rem]" : "translate-x-[0.125rem]"}`} />
      </button>
      {error ? (
        <p role="alert" className={`w-full ${SMALL} text-[#C4231A]`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Everything about the firm that can be saved, as it stands now: a row sends its own part over this. */
export function detailsOf(c: Company): Details {
  const all: Details = { ...c };
  // The name and the number are the register's: they are shown and never sent.
  delete all.name;
  delete all.org_number;
  return all;
}

export function FirmaRows({ company: c, send, sendData }: { company: Company; send: Send; sendData: (body: Record<string, unknown>) => Promise<Fetched> }) {
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const save = (part: Record<string, string>) => send({ action: "company", details: { ...detailsOf(c), ...part } });

  const check = async () => {
    setChecking(true);
    setReportError(null);
    const r = await sendData({ action: "company_report" });
    setChecking(false);
    const parsed = r.ok ? companyReportFrom(r.data) : null;
    if (parsed) setReport(parsed);
    else setReportError("Kunne ikke hente registeropplysningene nå.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={GROUP}>
        <ValueRow label="Navn" value={c.name} locked nowrap />
        <ValueRow label="Org.nr" value={<span className="tabular-nums">{orgNumberNo(c.org_number) || "Ikke registrert"}</span>} locked nowrap />
        <EditRow
          label="Adresse"
          shown={addressLine(c.address, c.postal_code, c.city)}
          fields={[
            { key: "address", label: "Gate", value: c.address, max: 200 },
            { key: "postal_code", label: "Postnummer", value: c.postal_code, inputMode: "numeric", max: 12 },
            { key: "city", label: "Sted", value: c.city, max: 80 },
          ]}
          onSave={save}
        />
        <EditRow label="Telefon" shown={c.phone} fields={[{ key: "phone", label: "Telefon", value: c.phone, type: "tel", inputMode: "tel", max: 24 }]} onSave={save} />
        <EditRow label="Nettside" shown={c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} fields={[{ key: "website", label: "Nettside", value: c.website, type: "url", inputMode: "url", max: 200 }]} onSave={save} />
      </div>

      <div className={GROUP}>
        <button type="button" className={ROW_BUTTON} disabled={checking} onClick={() => void check()} data-check-company="">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={`${BODY} font-semibold ${NAVY}`}>{checking ? "Henter ..." : "Sjekk firma"}</span>
            <span className={`${SMALL} ${GREY}`}>Alt de offentlige registrene viser om firmaet</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#C7C7CC]" aria-hidden />
        </button>
      </div>
      {reportError ? (
        <p role="alert" className={`px-4 ${SMALL} text-[#C4231A]`}>
          {reportError}
        </p>
      ) : null}
      {report ? (
        <div className="flex flex-col gap-6" data-company-report="">
          {report.groups.map((g) => (
            <div key={g.title} className="flex flex-col">
              <p className={GROUP_HEAD}>{g.title}</p>
              <div className={GROUP}>
                {g.rows.map((r, i) => (
                  <ValueRow key={`${r.label}-${i}`} label={r.label} value={r.value} locked />
                ))}
              </div>
              {g.footer ? <p className={`px-4 pt-1.5 ${SMALL} ${GREY}`}>{g.footer}</p> : null}
            </div>
          ))}
          <p className={`px-4 ${SMALL} ${GREY}`}>Fra offentlige registre{report.updated_at && dayNo(report.updated_at) ? ` · oppdatert ${dayNo(report.updated_at)}` : ""}</p>
        </div>
      ) : null}
    </div>
  );
}

export function FakturaRows({ company: c, send }: { company: Company; send: Send }) {
  const save = (part: Details) => send({ action: "company", details: { ...detailsOf(c), ...part } });
  return (
    <div className={GROUP}>
      <ValueRow label="Faktura-e-post" value={c.invoice_email || "Ikke oppgitt"} locked />
      <SwitchRow label="Vi tar imot EHF" on={c.invoice_ehf} onChange={(v) => save({ invoice_ehf: v })} />
      <SwitchRow label="Fakturaadressen er firmaets adresse" on={c.billing_same_as_address} onChange={(v) => save({ billing_same_as_address: v })} />
      {!c.billing_same_as_address ? (
        <EditRow
          label="Fakturaadresse"
          shown={addressLine(c.billing_address, c.billing_postal_code, c.billing_city)}
          fields={[
            { key: "billing_address", label: "Gate", value: c.billing_address, max: 200 },
            { key: "billing_postal_code", label: "Postnummer", value: c.billing_postal_code, inputMode: "numeric", max: 12 },
            { key: "billing_city", label: "Sted", value: c.billing_city, max: 80 },
          ]}
          onSave={save}
        />
      ) : null}
      <EditRow label="Deres referanse" shown={c.invoice_reference} fields={[{ key: "invoice_reference", label: "Deres referanse", value: c.invoice_reference, max: 120 }]} onSave={save} />
    </div>
  );
}

export function KontaktRows({ contacts, send, onRemove }: { contacts: Contact[]; send: Send; onRemove: (k: Contact) => void }) {
  if (!contacts.length) return <p className={`px-4 ${BODY} ${GREY}`}>Vi har ingen kontaktpersoner registrert.</p>;
  return (
    <div className="flex flex-col gap-6">
      {contacts.map((k) =>
        k.mine ? (
          <div key={k.id} className="flex flex-col">
            <p className={GROUP_HEAD}>Deg</p>
            <div className={GROUP}>
              {(["full_name", "role", "phone"] as const).map((field) => (
                <EditRow
                  key={field}
                  label={field === "full_name" ? "Navn" : field === "role" ? "Rolle" : "Telefon"}
                  shown={k[field]}
                  fields={[{ key: field, label: field === "full_name" ? "Navn" : field === "role" ? "Rolle" : "Telefon", value: k[field], type: field === "phone" ? "tel" : "text", max: field === "full_name" ? 120 : field === "role" ? 80 : 24 }]}
                  onSave={(part) => send({ action: "contact", id: k.id, details: { full_name: k.full_name, role: k.role, phone: k.phone, ...part } })}
                />
              ))}
              <ValueRow label="E-post" value={k.email} locked />
            </div>
          </div>
        ) : null,
      )}
      {contacts.some((k) => !k.mine) ? (
        <div className="flex flex-col">
          <p className={GROUP_HEAD}>Kolleger</p>
          <div className={GROUP}>
            {contacts
              .filter((k) => !k.mine)
              .map((k) => (
                <div key={k.id} className={`${ROW} flex-wrap`}>
                  <span className={`shrink-0 whitespace-nowrap ${BODY} ${NAVY}`}>{k.full_name}</span>
                  <span className={`min-w-0 flex-1 truncate text-right ${SMALL} ${GREY}`}>{[k.role, k.phone].filter(Boolean).join(" · ")}</span>
                  <button type="button" className={`${PILL} md:min-h-[2rem]`} aria-haspopup="dialog" onClick={() => onRemove(k)}>
                    Be om fjerning
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
