"use client";

/**
 * ORDER 508 (25 November 2026): after a trial tried with no signature, the
 * firm's signer. Three faces, one at a time:
 *
 * - the user's card, fourteen and again three days before the trial ends:
 *   "Prøveperioden slutter <dato>. Hvem signerer for firmaet?", the register's
 *   signer confirmed with one press, or another name and work e-mail;
 * - the user's line while it waits, with the reminder once the trial ended;
 * - the signer's screen, in his order and nothing else: plan and price, the
 *   terms with "Jeg godtar vilkårene og prisen", the invoice details, then
 *   "Signer avtalen" through the e-signature.
 */
import dynamic from "next/dynamic";
import { useState } from "react";

import { BillingFields } from "@/components/min-side/MinSideHiringBilling";
import { TermsReader } from "@/components/min-side/MinSideHiringConfirm";
import { BTN_NAVY, BTN_OUTLINE, CARD_L, ERROR_L, FIELD_L, GOLD_CARD, INK, MUTED_L, SOFT } from "@/components/min-side/ui";
import { hiringBillingReady, hiringBillingValues, type HiringBillingValues } from "@/lib/min-side/profile";
import { signoffBillingBody, type SignoffView } from "@/lib/min-side/signoff";

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

type Saved = { ok: true } | { ok: false; message: string; field: string | null };
type Fetched = { ok: true; data: unknown } | { ok: false; message: string; status: number };

export function MinSideTrialSigner({
  view,
  send,
  sendData,
}: {
  view: SignoffView;
  send: (body: Record<string, unknown>) => Promise<Saved>;
  sendData: (body: Record<string, unknown>) => Promise<Fetched>;
}) {
  if (view.kind === "card") return <SignerCard view={view} send={send} />;
  if (view.kind === "user") return <WaitingLine view={view} send={send} />;
  return <SignerScreen view={view} send={send} sendData={sendData} />;
}

function Failure({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className={`text-sm ${ERROR_L}`}>
      {message}
    </p>
  ) : null;
}

function SignerCard({ view, send }: { view: Extract<SignoffView, { kind: "card" }>; send: (b: Record<string, unknown>) => Promise<Saved> }) {
  const [other, setOther] = useState(!view.suggestion);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sug = view.suggestion;

  async function go(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const r = await send(body);
    setBusy(false);
    if (!r.ok) setError(r.message);
  }

  return (
    <section aria-labelledby="ms-signer-title" className={`${GOLD_CARD} flex flex-col gap-3 p-4`}>
      <h2 id="ms-signer-title" className={`text-[17px] font-bold ${INK}`}>
        {view.title}
      </h2>
      {sug && !other ? (
        <>
          <p className={`text-[15px] ${SOFT}`}>
            Enhetsregisteret: <strong className={INK}>{sug.name}</strong>, {sug.role.toLowerCase()}
            {sug.email ? ` (${sug.email})` : ""}.
          </p>
          {sug.email ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className={BTN_NAVY} disabled={busy} onClick={() => void go({ action: "signoff_name", confirm: true })}>
                {busy ? "Sender..." : "Bekreft"}
              </button>
              <button type="button" className={BTN_OUTLINE} disabled={busy} onClick={() => setOther(true)}>
                En annen
              </button>
            </div>
          ) : (
            <button type="button" className={`${BTN_OUTLINE} self-start`} onClick={() => { setName(sug.name); setOther(true); }}>
              Legg inn e-post
            </button>
          )}
        </>
      ) : (
        <form
          className="grid min-w-0 gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void go({ action: "signoff_name", name, email });
          }}
        >
          <label className="flex min-w-0 flex-col gap-1">
            <span className={`text-sm font-semibold ${INK}`}>Fullt navn</span>
            <input className={FIELD_L} value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className={`text-sm font-semibold ${INK}`}>E-post på jobben</span>
            <input className={FIELD_L} type="email" value={email} maxLength={200} autoComplete="email" onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" className={BTN_NAVY} disabled={busy}>
              {busy ? "Sender..." : "Send til signering"}
            </button>
            {sug ? (
              <button type="button" className={BTN_OUTLINE} disabled={busy} onClick={() => setOther(false)}>
                Tilbake
              </button>
            ) : null}
          </div>
        </form>
      )}
      <Failure message={error} />
      {!view.ended ? (
        <button type="button" className={`self-start text-sm font-semibold underline underline-offset-4 ${MUTED_L}`} disabled={busy} onClick={() => void go({ action: "signoff_later" })}>
          Senere
        </button>
      ) : null}
    </section>
  );
}

function WaitingLine({ view, send }: { view: Extract<SignoffView, { kind: "user" }>; send: (b: Record<string, unknown>) => Promise<Saved> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  return (
    <section className={`${view.waiting ? GOLD_CARD : CARD_L} flex flex-col gap-2 p-4`} role="status">
      {view.waiting ? <h2 className={`text-[17px] font-bold ${INK}`}>{view.waiting}</h2> : null}
      {view.waiting ? <p className={`text-[15px] ${SOFT}`}>Varslene står på pause til avtalen er signert. Ingenting faktureres før det.</p> : null}
      <p className={`text-[15px] ${SOFT}`}>{view.note}</p>
      {view.can_remind && !sent ? (
        <button
          type="button"
          className={`${BTN_OUTLINE} self-start`}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            const r = await send({ action: "signoff_remind" });
            setBusy(false);
            if (r.ok) setSent(true);
            else setError(r.message);
          }}
        >
          {busy ? "Sender..." : `Minn ${view.signer_name.split(/\s+/)[0] || "den som signerer"} på det`}
        </button>
      ) : null}
      {sent ? <p className={`text-sm ${SOFT}`}>Påminnelsen sendes om kort tid.</p> : null}
      <Failure message={error} />
    </section>
  );
}

const STEP_NO = ["Plan og pris", "Vilkår", "Fakturering", "Signer"];

function SignerScreen({
  view,
  send,
  sendData,
}: {
  view: Extract<SignoffView, { kind: "signer" }>;
  send: (b: Record<string, unknown>) => Promise<Saved>;
  sendData: (b: Record<string, unknown>) => Promise<Fetched>;
}) {
  const s = view.snapshot;
  const [accepted, setAccepted] = useState(false);
  const [reading, setReading] = useState(false);
  const [billing, setBilling] = useState<HiringBillingValues>(() => hiringBillingValues(view.billing));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<{ message: string; field: string | null } | null>(null);
  const at = view.step === "terms" ? 1 : view.step === "billing" ? 2 : 3;

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setFailed(null);
    const r = await send(body);
    setBusy(false);
    if (!r.ok) setFailed({ message: r.message, field: r.field });
  }

  async function sign() {
    setBusy(true);
    setFailed(null);
    const r = await sendData({ action: "signoff_sign" });
    const url = r.ok ? (r.data as { sign_url?: unknown } | null)?.sign_url : null;
    if (r.ok && typeof url === "string" && url.startsWith("https://")) {
      window.location.assign(url);
      return;
    }
    setBusy(false);
    setFailed({ message: r.ok ? "Signeringen kunne ikke åpnes. Prøv igjen." : r.message, field: null });
  }

  if (view.step === "done") {
    return (
      <section className={`${CARD_L} p-4`} role="status">
        <h2 className={`text-[17px] font-bold ${INK}`}>Avtalen er signert</h2>
        <p className={`text-[15px] ${SOFT}`}>Den signerte avtalen ligger under Dokumenter. ArbeidMatch aktiverer abonnementet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="ms-signoff-title" className={`${CARD_L} flex flex-col gap-4 p-4`}>
      <div className="flex flex-col gap-1">
        <h2 id="ms-signoff-title" className={`text-[17px] font-bold ${INK}`}>
          Avtale om prosjektvarsler
        </h2>
        <ol className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${MUTED_L}`} aria-label="Steg">
          {STEP_NO.map((label, i) => (
            <li key={label} aria-current={i === at ? "step" : undefined} className={i === at ? `font-semibold ${INK}` : ""}>
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <p className={`text-[15px] ${SOFT}`}>
          {s.coverage} · {s.domains} · {s.frequency}
        </p>
        <dl className="grid max-w-md grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-[15px]">
          {s.priceLines.map((l) => (
            <div key={l.label} className="contents">
              <dt className={SOFT}>{l.label}</dt>
              <dd className={`text-right tabular-nums ${INK}`}>{l.value}</dd>
            </div>
          ))}
        </dl>
        <p className={`text-xs ${MUTED_L}`}>Alle priser eks. mva. Ingenting faktureres før avtalen er signert.</p>
      </div>

      {view.step === "terms" ? (
        <div className="flex flex-col gap-3">
          <label className={`flex min-h-[44px] items-start gap-3 text-[15px] ${INK}`}>
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#1B2B44]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>
              Jeg godtar vilkårene og prisen.{" "}
              <button type="button" className="font-semibold underline underline-offset-4" onClick={() => setReading(true)}>
                Les vilkårene
              </button>
            </span>
          </label>
          <button type="button" className={`${BTN_NAVY} self-start`} disabled={!accepted || busy} onClick={() => void act({ action: "signoff_accept", accept: true, hash: s.hash })}>
            {busy ? "Lagrer..." : "Godta"}
          </button>
          {reading ? (
            <PortalModal title={s.termsTitle} onClose={() => setReading(false)}>
              <TermsReader
                terms={{ title: s.termsTitle, paragraphs: s.terms, version: "", consent: "" }}
                onAccept={() => {
                  setAccepted(true);
                  setReading(false);
                }}
                onClose={() => setReading(false)}
              />
            </PortalModal>
          ) : null}
        </div>
      ) : null}

      {view.step === "billing" ? (
        <div className="flex flex-col gap-3">
          <BillingFields billing={view.billing} value={billing} onChange={(part) => setBilling((v) => ({ ...v, ...part }))} errorFor={(f) => (failed?.field === f ? failed.message : null)} />
          <button
            type="button"
            className={`${BTN_NAVY} self-start`}
            disabled={busy || !hiringBillingReady(billing, view.billing)}
            onClick={() => void act({ action: "signoff_billing", billing: signoffBillingBody(billing) })}
          >
            {busy ? "Lagrer..." : "Lagre fakturaopplysningene"}
          </button>
        </div>
      ) : null}

      {view.step === "sign" || view.step === "signing" ? (
        <div className="flex flex-col gap-2">
          {view.joint_names.length > 1 ? <p className={`text-[15px] ${SOFT}`}>Firmaet signerer i fellesskap: {view.joint_names.join(", ")}. Avtalen gjelder når alle har signert.</p> : null}
          {view.step === "signing" && !view.sign_url ? (
            <p className={`text-[15px] ${SOFT}`}>Du har signert. Avtalen venter på de andre som signerer.</p>
          ) : (
            <button type="button" className={`${BTN_NAVY} self-start`} disabled={busy} onClick={() => void sign()}>
              {busy ? "Åpner..." : "Signer avtalen"}
            </button>
          )}
        </div>
      ) : null}

      {failed && !(view.step === "billing" && failed.field) ? <Failure message={failed.message} /> : null}
    </section>
  );
}
