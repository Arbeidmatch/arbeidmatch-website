"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  PACKAGE_NAMES,
  type AdvertDraft,
  type OrderStatus,
  type PostingRules,
  type PublicOrderView,
  type ReviewFinding,
} from "@/lib/job-ads/types";
import { SupportButton } from "@/components/support/SupportRequest";
import AdvertForm, { type AdvertSubmitResult } from "./AdvertForm";
import PackagePicker from "./PackagePicker";
import QuoteLines from "./QuoteLines";
import { rememberOrder } from "./storage";
import { bigSpinnerClass, cardClass, cardHairline, primaryButtonClass, secondaryButtonClass } from "./ui";

const POLL_MS = 8_000;
/** About three minutes of polling, then a calm message instead of an endless spinner. */
const MAX_POLLS = 23;
const POLLING: OrderStatus[] = ["in_review", "paid", "invoiced"];

type OrderResponse = { ok?: boolean; order?: PublicOrderView; error?: string; fields?: Record<string, string> };

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}

/** The application deadline was an earlier day in Oslo: paying now would publish an advert already closed. */
function deadlineGone(deadline: string | null | undefined): boolean {
  const d = String(deadline ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return d < today;
}

function groupFindings(findings: ReviewFinding[]): Array<{ rule: string; items: ReviewFinding[] }> {
  const map = new Map<string, ReviewFinding[]>();
  for (const f of findings) {
    const list = map.get(f.rule) ?? [];
    list.push(f);
    map.set(f.rule, list);
  }
  return [...map.entries()].map(([rule, items]) => ({ rule, items }));
}

function Findings({ findings, ruleTitles }: { findings: ReviewFinding[]; ruleTitles: Record<string, string> }) {
  if (findings.length === 0) return null;
  return (
    <div className="space-y-4">
      {groupFindings(findings).map((group) => (
        <section key={group.rule} className="rounded-[14px] border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm font-bold text-[#C9A84C]">
            {group.rule === "missing_field" ? "Felt som mangler eller må rettes" : ruleTitles[group.rule] ?? "Annonsereglene"}
          </h3>
          <ul className="mt-3 space-y-4">
            {group.items.map((f, i) => (
              <li key={`${group.rule}-${i}`} className="text-sm">
                {f.quote ? (
                  <blockquote className="mb-2 border-l-2 border-[rgba(201,168,76,0.5)] pl-3 italic text-white/60">«{f.quote}»</blockquote>
                ) : null}
                <p className="text-white">{f.problem}</p>
                {f.fix ? (
                  <p className="mt-1 text-white/70">
                    <span className="font-semibold text-white/85">Slik retter dere det: </span>
                    {f.fix}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function OrderClient({ token, sessionId }: { token: string; sessionId: string | null }) {
  const router = useRouter();
  const [order, setOrder] = useState<PublicOrderView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(Boolean(sessionId));
  /** Back from a checkout that may have been paid, and the order still says it waits: no second payment button meanwhile. */
  const [awaitingCheckout, setAwaitingCheckout] = useState(false);
  const [polls, setPolls] = useState(0);
  const [editing, setEditing] = useState(false);
  const [ruleTitles, setRuleTitles] = useState<Record<string, string>>({});
  const rulesRequested = useRef(false);
  const started = useRef(false);

  const refresh = useCallback(async (): Promise<PublicOrderView | null> => {
    try {
      const res = await fetch(`/api/job-ads/${token}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as OrderResponse | null;
      if (!res.ok || !json?.ok || !json.order) {
        setLoadError(json?.error || "Vi fikk ikke hentet bestillingen. Prøv igjen om litt.");
        return null;
      }
      setLoadError(null);
      setOrder(json.order);
      return json.order;
    } catch {
      setLoadError("Vi fikk ikke kontakt. Sjekk nettforbindelsen og last inn siden på nytt.");
      return null;
    }
  }, [token]);

  // First load; after Stripe, confirm the payment first.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      if (sessionId) {
        try {
          const res = await fetch(`/api/job-ads/${token}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const json = (await res.json().catch(() => null)) as OrderResponse | null;
          const current = json?.order ?? (await refresh());
          if (json?.order) setOrder(json.order);
          // 402: Stripe says the checkout was not paid, so choosing again is safe.
          if (res.status !== 402 && current?.status === "awaiting_payment") setAwaitingCheckout(true);
          else if (!res.ok || !json?.ok) setNotice(json?.error || "Vi fikk ikke bekreftet betalingen ennå.");
        } catch {
          const current = await refresh();
          if (current?.status === "awaiting_payment") setAwaitingCheckout(true);
          else setNotice("Vi fikk ikke bekreftet betalingen ennå. Last inn siden på nytt om litt.");
        } finally {
          setConfirming(false);
          router.replace(`/annonse/${token}`, { scroll: false });
        }
      } else {
        await refresh();
      }
    })();
  }, [refresh, router, sessionId, token]);

  // Keep a pointer to the order in this browser.
  useEffect(() => {
    if (order?.token) rememberOrder(order.token, order.advert?.title ?? "");
  }, [order?.token, order?.advert?.title]);

  // Poll while something is happening on our side.
  useEffect(() => {
    const watching = POLLING.includes(order?.status as OrderStatus) || (awaitingCheckout && order?.status === "awaiting_payment");
    if (!order || editing || !watching || polls >= MAX_POLLS) return;
    const t = window.setTimeout(async () => {
      await refresh();
      setPolls((p) => p + 1);
    }, POLL_MS);
    return () => window.clearTimeout(t);
  }, [order, editing, polls, refresh, awaitingCheckout]);

  // Rule titles for the reviewer's findings.
  useEffect(() => {
    if (!order || order.findings.length === 0 || rulesRequested.current) return;
    rulesRequested.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/job-ads", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as ({ ok?: boolean } & Partial<PostingRules>) | null;
        if (json?.ok && Array.isArray(json.rules)) setRuleTitles(Object.fromEntries(json.rules.map((r) => [r.id, r.title])));
      } catch {
        // Titles are a nicety; the findings read without them.
      }
    })();
  }, [order]);

  const notes = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of order?.findings ?? []) {
      if (!f.field) continue;
      out[f.field] = out[f.field] ? `${out[f.field]} ${f.problem}` : f.problem;
    }
    return out;
  }, [order?.findings]);

  const revise = async (input: { advert: AdvertDraft }): Promise<AdvertSubmitResult> => {
    try {
      const res = await fetch(`/api/job-ads/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advert: input.advert }),
      });
      const json = (await res.json().catch(() => null)) as OrderResponse | null;
      if (res.ok && json?.ok && json.order) {
        setOrder(json.order);
        setPolls(0);
        setEditing(false);
        rulesRequested.current = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return { ok: true };
      }
      if (res.status === 504) {
        // The review is still running on our side: show the order and wait for it.
        await refresh();
        setPolls(0);
        setEditing(false);
        setNotice("Kontrollen tar lengre tid enn vanlig. Svaret kommer her.");
        return { ok: true };
      }
      return { ok: false, error: json?.error || "Vi fikk ikke sendt annonsen. Prøv igjen om litt.", fields: json?.fields };
    } catch {
      return { ok: false, error: "Vi fikk ikke kontakt. Sjekk nettforbindelsen og prøv igjen." };
    }
  };

  const onOrder = useCallback((next: PublicOrderView) => setOrder(next), []);

  if (confirming) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <span className={bigSpinnerClass} />
        <p className="mt-6 text-lg font-bold">Vi bekrefter betalingen...</p>
        <p className="mt-2 text-sm text-white/60">Et øyeblikk. Ikke lukk siden.</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        {loadError ? (
          <>
            <p className="text-lg font-bold">{loadError}</p>
            <button type="button" onClick={() => void refresh()} className={`${secondaryButtonClass} mt-6`}>
              Prøv igjen
            </button>
          </>
        ) : (
          <span className={bigSpinnerClass} />
        )}
      </div>
    );
  }

  const title = order.advert?.title || "Stillingsannonse";
  const expires = formatDate(order.expiresAt);

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-[680px]">
        <h1 className="mb-2 text-3xl font-extrabold">Rediger annonsen</h1>
        <p className="mb-6 text-sm text-white/65">Rett det kontrollen pekte på. Merknadene står under feltene det gjelder.</p>
        {order.findings.length > 0 ? (
          <details className="mb-6 rounded-[14px] border border-white/10 bg-white/[0.02] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white">Se alle merknadene ({order.findings.length})</summary>
            <div className="mt-4">
              <Findings findings={order.findings} ruleTitles={ruleTitles} />
            </div>
          </details>
        ) : null}
        <AdvertForm
          mode="edit"
          initial={order.advert}
          acceptedRulesVersion={order.rulesVersion}
          notes={notes}
          onSubmit={revise}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const status = order.status;
  const pollingDone = polls >= MAX_POLLS;
  const checkoutPending = awaitingCheckout && status === "awaiting_payment";

  return (
    <div className="mx-auto w-full max-w-[960px]">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Stillingsannonse</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/60">
          {order.company}
          {order.advert?.location?.city ? `, ${order.advert.location.city}` : ""}
        </p>
        <p className="mt-3 text-[12px] text-white/40">Ta vare på lenken til denne siden. Her ser dere status for annonsen.</p>
      </header>

      {notice ? (
        <div role="status" className="mb-6 rounded-[12px] border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {notice}
        </div>
      ) : null}

      {status === "in_review" ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <div className="py-6 text-center">
            {pollingDone ? (
              <>
                <p className="text-xl font-bold">Vi kontrollerer fortsatt annonsen</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/65">
                  Det tar litt lengre tid enn vanlig. Dere får beskjed her, så dere kan komme tilbake til denne siden senere.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPolls(0);
                    void refresh();
                  }}
                  className={`${secondaryButtonClass} mt-6`}
                >
                  Sjekk igjen
                </button>
              </>
            ) : (
              <>
                <span className={bigSpinnerClass} />
                <p className="mt-6 text-xl font-bold">Vi kontrollerer annonsen...</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/65">
                  Vi leser den mot annonsereglene. Siden oppdaterer seg selv når vi er ferdige.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {status === "changes_requested" ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <h2 className="text-2xl font-extrabold">Annonsen trenger noen endringer</h2>
          <p className="mt-2 text-sm text-white/65">
            Vi har lest annonsen og funnet noe som må rettes før den kan publiseres. Rett punktene under og send den på nytt. Dere betaler
            ikke noe før den er godkjent.
          </p>
          <div className="mt-6">
            <Findings findings={order.findings} ruleTitles={ruleTitles} />
          </div>
          <button type="button" onClick={() => setEditing(true)} className={`${primaryButtonClass} mt-6`}>
            Rediger annonsen
          </button>
        </div>
      ) : null}

      {status === "refused" ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <h2 className="text-2xl font-extrabold">Vi kan ikke publisere denne annonsen</h2>
          <p className="mt-2 text-sm text-white/65">
            Dette er ikke noe som kan rettes ved å endre teksten. Dere er ikke belastet noe. Se begrunnelsen under, og{" "}
            <SupportButton lang="nb" showIcon={false} className="text-[#C9A84C] underline underline-offset-2">
              kontakt support
            </SupportButton>{" "}
            hvis dere mener dette er feil, så ser vi på det sammen med dere.
          </p>
          {order.findings.length > 0 ? (
            <div className="mt-6">
              <Findings findings={order.findings} ruleTitles={ruleTitles} />
            </div>
          ) : null}
        </div>
      ) : null}

      {checkoutPending ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <div className="py-6 text-center">
            {pollingDone ? (
              <>
                <p className="text-xl font-bold">Vi har ikke fått bekreftet betalingen ennå</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/65">
                  Er beløpet trukket, skal dere ikke betale på nytt.{" "}
                  <SupportButton lang="nb" showIcon={false} className="text-[#C9A84C] underline underline-offset-2">
                    Kontakt support
                  </SupportButton>
                  , så ordner vi det.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPolls(0);
                      void refresh();
                    }}
                    className={secondaryButtonClass}
                  >
                    Sjekk igjen
                  </button>
                  <button type="button" onClick={() => setAwaitingCheckout(false)} className={secondaryButtonClass}>
                    Betalingen ble ikke gjennomført
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className={bigSpinnerClass} />
                <p className="mt-6 text-xl font-bold">Vi venter på bekreftelse av betalingen...</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/65">Ikke betal på nytt. Siden oppdaterer seg selv.</p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {!checkoutPending && (status === "approved" || status === "awaiting_payment") ? (
        deadlineGone(order.advert?.deadline) ? (
          <div className={cardClass}>
            <div className={cardHairline} />
            <h2 className="text-2xl font-extrabold">Søknadsfristen har gått ut</h2>
            <p className="mt-2 text-sm text-white/65">
              Fristen i annonsen er passert, så den kan ikke publiseres slik den er. Sett en ny frist, så kontrollerer vi annonsen på nytt før
              dere betaler.
            </p>
            <button type="button" onClick={() => setEditing(true)} className={`${primaryButtonClass} mt-6`}>
              Endre annonsen
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[14px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Annonsen er kontrollert og godkjent. Velg pakke og betaling, så publiserer vi den.
            </div>
            <div className={cardClass}>
              <div className={cardHairline} />
              <PackagePicker token={token} order={order} onOrder={onOrder} />
            </div>
            <p className="text-center text-[13px] text-white/50">
              Må dere endre noe i annonsen?{" "}
              <button type="button" onClick={() => setEditing(true)} className="font-semibold text-[#C9A84C] underline underline-offset-2">
                Endre den
              </button>
              . Den kontrolleres da på nytt før dere betaler.
            </p>
          </div>
        )
      ) : null}

      {status === "paid" || status === "invoiced" || status === "published" ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <h2 className="text-2xl font-extrabold">
            {status === "published" ? "Annonsen er publisert" : status === "paid" ? "Takk, betalingen er mottatt" : "Takk for bestillingen"}
          </h2>
          <div className="mt-3 space-y-2 text-sm text-white/70">
            {status === "published" ? (
              <p>
                Takk for bestillingen. Annonsen ligger nå på arbeidmatch.no
                {expires ? `, til og med ${expires}` : ""}.
              </p>
            ) : (
              <p>
                Annonsen publiseres i løpet av kort tid.
                {pollingDone ? " Last inn siden på nytt om litt for å se lenken." : " Siden oppdaterer seg selv."}
              </p>
            )}
            {order.chosen?.method === "invoice" ? <p>Fakturaen kommer på e-post, med 14 dagers betalingsfrist.</p> : null}
            {order.chosen?.method === "card" && status === "published" ? <p>Betalingen er mottatt.</p> : null}
          </div>
          {status === "published" && order.publishedSlug ? (
            <Link href={`/stilling/${order.publishedSlug}`} className={`${primaryButtonClass} mt-6`}>
              Se annonsen
            </Link>
          ) : null}
          {order.chosen?.quote ? (
            <div className="mt-8 max-w-md rounded-[14px] border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-3 text-sm font-semibold text-white">Pakke {PACKAGE_NAMES[order.chosen.package]}</p>
              <QuoteLines quote={order.chosen.quote} />
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "expired" ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <h2 className="text-2xl font-extrabold">Annonseperioden er over</h2>
          <p className="mt-2 text-sm text-white/65">
            Annonsen ligger ikke lenger ute. Vil dere annonsere igjen, kan dere{" "}
            <Link href="/annonse/ny" className="text-[#C9A84C] underline underline-offset-2">
              lage en ny annonse
            </Link>
            .
          </p>
        </div>
      ) : null}

      {status === "cancelled" ? (
        <div className={cardClass}>
          <div className={cardHairline} />
          <h2 className="text-2xl font-extrabold">Bestillingen er avbrutt</h2>
          <p className="mt-2 text-sm text-white/65">
            <SupportButton lang="nb" showIcon={false} className="text-[#C9A84C] underline underline-offset-2">
              Kontakt support
            </SupportButton>{" "}
            hvis dette er feil.
          </p>
        </div>
      ) : null}

      <p className="mt-10 text-center text-[13px] text-white/45">
        Spørsmål om annonsen?{" "}
        <SupportButton lang="nb" showIcon={false} className="text-white/70 underline underline-offset-2">
          Kontakt support
        </SupportButton>
      </p>
    </div>
  );
}
