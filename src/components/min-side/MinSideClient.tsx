"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import { CARD, EYEBROW, FIELD, MUTED, PRIMARY, SECONDARY } from "@/components/prosjekter/ui";
import { addressLine, alertsWords, dayNo, orgNumberNo, profileFrom, type Company, type Contact, type Profile } from "@/lib/min-side/profile";

/**
 * "Min side": a client's own page (the owner's decision of 30 September 2026,
 * a client has a profile like a candidate, with the details we hold).
 *
 * Five cards: the firm and its invoice details, the contact persons, the
 * project alerts, the offers that wait for an answer, the signed documents.
 * The firm's name and number are the register's and are not changed here; a
 * person changes their own entry among the contacts and asks us about a
 * colleague's. What is saved is saved with us at once.
 *
 * Every form opens in a dialog, never on the page (his decision of 29
 * September 2026). Every control is at least 44px tall.
 */

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

const LABEL = "text-xs font-semibold uppercase tracking-[0.12em] text-white/55";
const LINK = "inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap text-sm font-semibold text-gold underline-offset-4 hover:underline";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
      <dt className={LABEL}>{label}</dt>
      <dd className="min-w-0 break-words text-[15px] text-white">{children}</dd>
    </div>
  );
}

function Field({ id, label, children, error }: { id: string; label: string; children: ReactNode; error?: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      {children}
      {error ? (
        <span role="alert" className="text-sm text-[#FF9B9B]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

type Saved = { ok: true } | { ok: false; message: string; field: string | null };

export default function MinSideClient({ token }: { token: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState(false);
  const [editContact, setEditContact] = useState<Contact | "new" | null>(null);
  const [askRemove, setAskRemove] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/min-side/${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(res.status === 404 ? "Lenken er ikke gyldig lenger. Logg inn på nytt, så sender vi en ny." : (payload.error ?? "Siden kunne ikke hentes akkurat nå. Prøv igjen om litt."));
        return;
      }
      const parsed = profileFrom(payload);
      if (!parsed) {
        setError("Siden kunne ikke hentes akkurat nå. Prøv igjen om litt.");
        return;
      }
      setError(null);
      setProfile(parsed);
    } catch {
      setError("Siden kunne ikke hentes akkurat nå. Prøv igjen om litt.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async (body: Record<string, unknown>): Promise<Saved> => {
    try {
      const res = await fetch(`/api/min-side/${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; field?: string | null };
      if (!res.ok) return { ok: false, message: payload.error ?? "Noe gikk galt. Prøv igjen.", field: payload.field ?? null };
      await load();
      return { ok: true };
    } catch {
      return { ok: false, message: "Noe gikk galt. Prøv igjen.", field: null };
    }
  };

  const c = profile?.company ?? null;
  const words = alertsWords(profile?.alerts ?? null);
  const plan = profile?.alerts?.plan ?? null;
  const invoiceAddress = c ? (c.billing_same_as_address || !c.billing_address ? "Samme som firmaets adresse" : addressLine(c.billing_address, c.billing_postal_code, c.billing_city)) : "";

  return (
    <div className="bg-[#0D1B2A] text-white">
      <div className="container-site flex flex-col gap-8 pb-16 pt-10 md:pb-24 md:pt-14">
        <header className="flex flex-col gap-3">
          <p className={EYEBROW}>ArbeidMatch Norge AS</p>
          <h1 className="am-h2 font-display font-semibold text-white">Min side</h1>
          {profile ? (
            <p className={`text-sm ${MUTED}`}>
              For {profile.company.name} · innlogget som {profile.me.email}
            </p>
          ) : null}
        </header>

        {loading && !profile ? <p className={MUTED}>Henter siden ...</p> : null}
        {error ? (
          <div className={`${CARD} flex flex-col gap-4 p-6 text-sm`}>
            <p>{error}</p>
            <p>
              <Link href="#logg-inn" className={SECONDARY} aria-haspopup="dialog">
                Logg inn på nytt
              </Link>
            </p>
          </div>
        ) : null}
        {notice ? (
          <div className={`${CARD} border-gold/40 p-4 text-sm`} role="status">
            {notice}
          </div>
        ) : null}

        {profile && c ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${CARD} flex flex-col gap-5 p-6`} aria-labelledby="ms-firma">
              <div className="flex items-start justify-between gap-4">
                <h2 id="ms-firma" className="text-xl font-semibold text-white">
                  Firma
                </h2>
                <button type="button" className={SECONDARY} aria-haspopup="dialog" onClick={() => setEditCompany(true)}>
                  Endre
                </button>
              </div>
              <dl className="flex flex-col gap-3">
                <Row label="Navn">{c.name}</Row>
                <Row label="Org.nr.">
                  <span className="tabular-nums">{orgNumberNo(c.org_number) || "Ikke registrert"}</span>
                </Row>
                <Row label="Adresse">{addressLine(c.address, c.postal_code, c.city) || "Ikke oppgitt"}</Row>
                <Row label="Telefon">{c.phone || "Ikke oppgitt"}</Row>
                <Row label="E-post">{c.email || "Ikke oppgitt"}</Row>
              </dl>
              <h3 className="border-t border-white/10 pt-4 text-base font-semibold text-white">Faktura</h3>
              <dl className="flex flex-col gap-3">
                <Row label="Faktura-e-post">{c.invoice_email || "Ikke oppgitt"}</Row>
                <Row label="EHF">{c.invoice_ehf ? "Ja, vi tar imot EHF" : "Nei"}</Row>
                <Row label="Fakturaadresse">{invoiceAddress}</Row>
                <Row label="Deres referanse">{c.invoice_reference || "Ikke oppgitt"}</Row>
              </dl>
              <p className={`text-sm ${MUTED}`}>Navn og org.nr. følger Brønnøysundregistrene og endres ikke her.</p>
            </section>

            <section className={`${CARD} flex flex-col gap-5 p-6`} aria-labelledby="ms-kontakt">
              <div className="flex items-start justify-between gap-4">
                <h2 id="ms-kontakt" className="text-xl font-semibold text-white">
                  Kontaktpersoner
                </h2>
                <button type="button" className={SECONDARY} aria-haspopup="dialog" onClick={() => setEditContact("new")}>
                  Legg til
                </button>
              </div>
              {profile.contacts.length === 0 ? <p className={`text-sm ${MUTED}`}>Vi har ingen kontaktpersoner registrert.</p> : null}
              <ul className="flex flex-col divide-y divide-white/10">
                {profile.contacts.map((k) => (
                  <li key={k.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white">
                        {k.full_name}
                        {k.mine ? <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">Deg</span> : null}
                      </p>
                      <p className={`break-words text-sm ${MUTED}`}>{[k.role, k.email, k.phone].filter(Boolean).join(" · ")}</p>
                    </div>
                    {k.mine ? (
                      <button type="button" className={LINK} aria-haspopup="dialog" onClick={() => setEditContact(k)}>
                        Endre
                      </button>
                    ) : (
                      <button type="button" className={LINK} aria-haspopup="dialog" onClick={() => setAskRemove(k)}>
                        Be om fjerning
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${CARD} flex flex-col gap-4 p-6`} aria-labelledby="ms-varsler">
              <h2 id="ms-varsler" className="text-xl font-semibold text-white">
                Prosjektvarsler
              </h2>
              <div>
                <p className="text-[15px] font-semibold text-white">{words.title}</p>
                <p className={`mt-1 text-sm leading-relaxed ${MUTED}`}>{words.text}</p>
              </div>
              <p className="flex flex-wrap gap-3">
                {profile.alerts?.projects_url ? (
                  <a href={profile.alerts.projects_url} className={PRIMARY}>
                    Se prosjektene
                  </a>
                ) : (
                  <Link href="/prosjekter" className={SECONDARY}>
                    Se prosjektkartet
                  </Link>
                )}
                {plan?.offer_url ? (
                  <a href={plan.offer_url} className={SECONDARY}>
                    {plan.status === "ended" || plan.freeOnly ? "Se avtalen" : plan.cancelled ? "Angre oppsigelsen" : "Se eller si opp abonnementet"}
                  </a>
                ) : null}
              </p>
            </section>

            <section className={`${CARD} flex flex-col gap-4 p-6`} aria-labelledby="ms-tilbud">
              <h2 id="ms-tilbud" className="text-xl font-semibold text-white">
                Tilbud
              </h2>
              {profile.offers.length === 0 ? <p className={`text-sm ${MUTED}`}>Dere har ingen tilbud fra oss.</p> : null}
              <ul className="flex flex-col divide-y divide-white/10">
                {profile.offers.map((o) => (
                  <li key={o.number} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white">
                        {o.title} <span className="tabular-nums">{o.number}</span>
                      </p>
                      <p className={`text-sm ${MUTED}`}>
                        {o.state}
                        {o.sent_at ? ` · sendt ${dayNo(o.sent_at)}` : ""}
                      </p>
                    </div>
                    {o.url ? (
                      <a href={o.url} className={LINK}>
                        {o.open ? "Åpne og svar" : "Åpne"}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${CARD} flex flex-col gap-4 p-6 lg:col-span-2`} aria-labelledby="ms-dok">
              <h2 id="ms-dok" className="text-xl font-semibold text-white">
                Signerte dokumenter
              </h2>
              {profile.documents.length === 0 ? <p className={`text-sm ${MUTED}`}>Dere har ingen signerte dokumenter hos oss ennå.</p> : null}
              <ul className="flex flex-col divide-y divide-white/10">
                {profile.documents.map((d, i) => (
                  <li key={`${d.title}-${i}`} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="break-words text-[15px] font-semibold text-white">{d.title}</p>
                      <p className={`text-sm ${MUTED}`}>{d.signed_at ? `Signert ${dayNo(d.signed_at)}` : "Signert"}</p>
                    </div>
                    {d.pdf_url ? (
                      <a href={d.pdf_url} className={LINK}>
                        Last ned PDF
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      {editCompany && c ? (
        <PortalModal title="Endre firmaets opplysninger" onClose={() => setEditCompany(false)}>
          <CompanyForm
            company={c}
            onCancel={() => setEditCompany(false)}
            onSave={async (details) => {
              const r = await send({ action: "company", details });
              if (r.ok) {
                setEditCompany(false);
                setNotice("Opplysningene er lagret.");
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}

      {editContact ? (
        <PortalModal title={editContact === "new" ? "Legg til kontaktperson" : "Endre dine opplysninger"} size="narrow" onClose={() => setEditContact(null)}>
          <ContactForm
            contact={editContact === "new" ? null : editContact}
            onCancel={() => setEditContact(null)}
            onSave={async (details) => {
              const r = await send(editContact === "new" ? { action: "contact", details } : { action: "contact", id: editContact.id, details });
              if (r.ok) {
                setNotice(editContact === "new" ? "Kontaktpersonen er lagt til." : "Opplysningene er lagret.");
                setEditContact(null);
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}

      {askRemove ? (
        <PortalModal title="Be om fjerning" size="narrow" onClose={() => setAskRemove(null)}>
          <RemoveForm
            name={askRemove.full_name}
            onCancel={() => setAskRemove(null)}
            onConfirm={async () => {
              const r = await send({ action: "remove_contact", id: askRemove.id });
              if (r.ok) {
                setAskRemove(null);
                setNotice("Vi har fått beskjed og fjerner kontaktpersonen.");
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}
    </div>
  );
}

function Buttons({ busy, label, onCancel }: { busy: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      <button type="submit" className={PRIMARY} disabled={busy}>
        {busy ? "Lagrer ..." : label}
      </button>
      <button type="button" className={SECONDARY} disabled={busy} onClick={onCancel}>
        Avbryt
      </button>
    </div>
  );
}

function CompanyForm({ company, onSave, onCancel }: { company: Company; onSave: (details: Record<string, string | boolean>) => Promise<Saved>; onCancel: () => void }) {
  const [v, setV] = useState({ ...company });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<{ message: string; field: string | null } | null>(null);
  const set = (k: keyof Company, value: string | boolean) => setV((prev) => ({ ...prev, [k]: value }));
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    // The name and the number are the register's: they are shown and never sent.
    const details: Record<string, string | boolean> = { ...v };
    delete details.name;
    delete details.org_number;
    const r = await onSave(details);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="ms-address" label="Adresse">
        <input id="ms-address" data-autofocus className={FIELD} value={v.address} maxLength={200} autoComplete="street-address" onChange={(e) => set("address", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Field id="ms-postal" label="Postnummer" error={errorFor("postal_code")}>
          <input id="ms-postal" className={FIELD} value={v.postal_code} maxLength={12} inputMode="numeric" autoComplete="postal-code" onChange={(e) => set("postal_code", e.target.value)} />
        </Field>
        <Field id="ms-city" label="Sted">
          <input id="ms-city" className={FIELD} value={v.city} maxLength={80} autoComplete="address-level2" onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ms-phone" label="Telefon" error={errorFor("phone")}>
          <input id="ms-phone" className={FIELD} type="tel" value={v.phone} maxLength={24} autoComplete="tel" onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field id="ms-email" label="Firmaets e-post" error={errorFor("email")}>
          <input id="ms-email" className={FIELD} type="email" value={v.email} maxLength={254} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>

      <h3 className="border-t border-white/10 pt-4 text-base font-semibold text-white">Faktura</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ms-inv-email" label="Faktura-e-post" error={errorFor("invoice_email")}>
          <input id="ms-inv-email" className={FIELD} type="email" value={v.invoice_email} maxLength={254} onChange={(e) => set("invoice_email", e.target.value)} />
        </Field>
        <Field id="ms-ref" label="Deres referanse">
          <input id="ms-ref" className={FIELD} value={v.invoice_reference} maxLength={120} onChange={(e) => set("invoice_reference", e.target.value)} />
        </Field>
      </div>
      <label htmlFor="ms-ehf" className="flex min-h-[44px] items-center gap-3 text-[15px] text-white">
        <input id="ms-ehf" type="checkbox" className="h-5 w-5 accent-[#C9A84C]" checked={v.invoice_ehf} onChange={(e) => set("invoice_ehf", e.target.checked)} />
        Vi tar imot EHF
      </label>
      <label htmlFor="ms-same" className="flex min-h-[44px] items-center gap-3 text-[15px] text-white">
        <input id="ms-same" type="checkbox" className="h-5 w-5 accent-[#C9A84C]" checked={v.billing_same_as_address} onChange={(e) => set("billing_same_as_address", e.target.checked)} />
        Fakturaadressen er den samme som firmaets adresse
      </label>
      {!v.billing_same_as_address ? (
        <>
          <Field id="ms-b-address" label="Fakturaadresse">
            <input id="ms-b-address" className={FIELD} value={v.billing_address} maxLength={200} onChange={(e) => set("billing_address", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <Field id="ms-b-postal" label="Postnummer" error={errorFor("billing_postal_code")}>
              <input id="ms-b-postal" className={FIELD} value={v.billing_postal_code} maxLength={12} inputMode="numeric" onChange={(e) => set("billing_postal_code", e.target.value)} />
            </Field>
            <Field id="ms-b-city" label="Sted">
              <input id="ms-b-city" className={FIELD} value={v.billing_city} maxLength={80} onChange={(e) => set("billing_city", e.target.value)} />
            </Field>
          </div>
        </>
      ) : null}

      {failed && !failed.field ? (
        <p role="alert" className="text-sm text-[#FF9B9B]">
          {failed.message}
        </p>
      ) : null}
      <Buttons busy={busy} label="Lagre" onCancel={onCancel} />
    </form>
  );
}

function ContactForm({ contact, onSave, onCancel }: { contact: Contact | null; onSave: (details: Record<string, string>) => Promise<Saved>; onCancel: () => void }) {
  const [v, setV] = useState({ full_name: contact?.full_name ?? "", role: contact?.role ?? "", phone: contact?.phone ?? "", email: "" });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<{ message: string; field: string | null } | null>(null);
  const errorFor = (field: string) => (failed?.field === field ? failed.message : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    const r = await onSave(contact ? { full_name: v.full_name, role: v.role, phone: v.phone } : v);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="ms-k-name" label="Navn" error={errorFor("full_name")}>
        <input id="ms-k-name" data-autofocus className={FIELD} value={v.full_name} maxLength={120} autoComplete="name" onChange={(e) => setV({ ...v, full_name: e.target.value })} required />
      </Field>
      <Field id="ms-k-role" label="Rolle">
        <input id="ms-k-role" className={FIELD} value={v.role} maxLength={80} autoComplete="organization-title" onChange={(e) => setV({ ...v, role: e.target.value })} />
      </Field>
      {contact ? (
        <p className={`text-sm ${MUTED}`}>E-postadressen {contact.email} er den dere logger inn med. Ta kontakt med oss for å endre den.</p>
      ) : (
        <Field id="ms-k-email" label="E-post" error={errorFor("email")}>
          <input id="ms-k-email" className={FIELD} type="email" value={v.email} maxLength={254} autoComplete="email" onChange={(e) => setV({ ...v, email: e.target.value })} required />
        </Field>
      )}
      <Field id="ms-k-phone" label="Telefon" error={errorFor("phone")}>
        <input id="ms-k-phone" className={FIELD} type="tel" value={v.phone} maxLength={24} autoComplete="tel" onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </Field>
      {failed && !failed.field ? (
        <p role="alert" className="text-sm text-[#FF9B9B]">
          {failed.message}
        </p>
      ) : null}
      <Buttons busy={busy} label={contact ? "Lagre" : "Legg til"} onCancel={onCancel} />
    </form>
  );
}

function RemoveForm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => Promise<Saved>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    const r = await onConfirm();
    if (!r.ok) setFailed(r.message);
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-white">
        Vi får beskjed om at {name} ikke lenger skal stå som kontaktperson, og fjerner oppføringen. Dokumenter som er signert, blir stående.
      </p>
      {failed ? (
        <p role="alert" className="text-sm text-[#FF9B9B]">
          {failed}
        </p>
      ) : null}
      <Buttons busy={busy} label="Send forespørselen" onCancel={onCancel} />
    </form>
  );
}
