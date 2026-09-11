"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ADDONS,
  ADDONS_INCLUDED_IN,
  PACKAGES,
  PACKAGE_NAMES,
  addonsOfferedFor,
  formatNok,
  isAdAddon,
  type AdAddon,
  type AdPackage,
  type AdQuote,
  type PaymentMethod,
  type PublicOrderView,
} from "@/lib/job-ads/types";
import QuoteLines from "./QuoteLines";
import { choiceClass, hintTextClass, inputClass, labelClass, primaryButtonClass, spinnerClass } from "./ui";

type Props = {
  token: string;
  order: PublicOrderView;
  onOrder: (order: PublicOrderView) => void;
};

function selectionKey(pkg: AdPackage, addons: readonly string[]): string {
  return `${pkg}|${[...addons].sort().join(",")}`;
}

type PaymentResponse = { ok?: boolean; order?: PublicOrderView; checkoutUrl?: string; error?: string };

/**
 * Packages side by side, add-ons, and card or invoice.
 *
 * The price shown next to the button is always one the ATS computed: the
 * package quote from order.quotes when nothing is added, otherwise the quote the
 * payment call froze for exactly this selection. The pay call freezes it again
 * and refuses if it moved, so the client never pays a number they did not see.
 */
export default function PackagePicker({ token, order, onOrder }: Props) {
  const chosen = order.chosen;
  const [pkg, setPkg] = useState<AdPackage>(chosen?.package ?? "synlig");
  const [addons, setAddons] = useState<AdAddon[]>((chosen?.addons ?? []).filter(isAdAddon));
  const [method, setMethod] = useState<PaymentMethod>(chosen?.method ?? "card");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState(order.advert?.contact?.email ?? "");
  const [quoted, setQuoted] = useState<{ key: string; quote: AdQuote } | null>(
    chosen?.quote ? { key: selectionKey(chosen.package, chosen.quote.addons), quote: chosen.quote } : null,
  );
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const offered = useMemo(() => addonsOfferedFor(pkg), [pkg]);
  const effectiveAddons = useMemo(() => addons.filter((a) => offered.includes(a)), [addons, offered]);
  const key = selectionKey(pkg, effectiveAddons);
  const latestKey = useRef(key);
  useEffect(() => {
    latestKey.current = key;
  }, [key]);

  const finalQuote: AdQuote | null =
    effectiveAddons.length === 0 ? order.quotes?.[pkg] ?? null : quoted?.key === key ? quoted.quote : null;

  // Add-ons change the price: ask the ATS for this exact selection.
  useEffect(() => {
    if (effectiveAddons.length === 0 || quoted?.key === key) return;
    setQuoteError(null);
    const requestedKey = key;
    const t = window.setTimeout(async () => {
      setQuoting(true);
      try {
        const res = await fetch(`/api/job-ads/${token}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "quote", package: pkg, addons: effectiveAddons }),
        });
        const json = (await res.json().catch(() => null)) as PaymentResponse | null;
        if (latestKey.current !== requestedKey) return;
        if (!res.ok || !json?.ok || !json.order?.chosen?.quote) throw new Error(json?.error || "Vi fikk ikke regnet ut prisen.");
        setQuoted({ key: requestedKey, quote: json.order.chosen.quote });
        onOrder(json.order);
      } catch (e) {
        if (latestKey.current === requestedKey) setQuoteError(e instanceof Error ? e.message : "Vi fikk ikke regnet ut prisen.");
      } finally {
        if (latestKey.current === requestedKey) setQuoting(false);
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [key, effectiveAddons, pkg, quoted?.key, token, onOrder]);

  const toggleAddon = (id: AdAddon) => {
    setPayError(null);
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const pay = async () => {
    if (!finalQuote || paying) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`/api/job-ads/${token}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          package: pkg,
          addons: effectiveAddons,
          method,
          expectedTotalNok: finalQuote.totalNok,
          invoiceReference: method === "invoice" ? invoiceReference : undefined,
          invoiceEmail: method === "invoice" ? invoiceEmail : undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as PaymentResponse | null;
      if (res.ok && json?.ok && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      if (json?.order?.chosen?.quote && res.status === 409) {
        setQuoted({ key: selectionKey(json.order.chosen.package, json.order.chosen.quote.addons), quote: json.order.chosen.quote });
      }
      if (json?.order) onOrder(json.order);
      if (!res.ok || !json?.ok) setPayError(json?.error || "Noe gikk galt. Prøv igjen om litt.");
      setPaying(false);
    } catch {
      setPayError("Vi fikk ikke kontakt. Sjekk nettforbindelsen og prøv igjen.");
      setPaying(false);
    }
  };

  if (!order.quotes) {
    return <p className="text-sm text-white/70">Vi fikk ikke hentet prisene. Last inn siden på nytt om litt.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold">Velg pakke</h2>
        <div role="radiogroup" aria-label="Pakke" className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PACKAGES.map((p) => {
            const q = order.quotes?.[p.id];
            const selected = pkg === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setPkg(p.id);
                  setPayError(null);
                }}
                className={`relative flex flex-col rounded-[18px] border p-5 text-left transition-colors duration-150 focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${
                  selected
                    ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)]"
                    : p.recommended
                      ? "border-[rgba(201,168,76,0.45)] bg-white/[0.03] hover:border-[#C9A84C]"
                      : "border-white/15 bg-white/[0.02] hover:border-[rgba(201,168,76,0.4)]"
                }`}
              >
                {p.recommended ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#C9A84C] px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#0D1B2A]">
                    Mest valgt
                  </span>
                ) : null}
                <span className="flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-white">{p.name}</span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#C9A84C]" : "border-white/30"}`}
                    aria-hidden
                  >
                    {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#C9A84C]" /> : null}
                  </span>
                </span>
                {q ? (
                  <span className="mt-3 block">
                    <span className="block text-2xl font-extrabold tabular-nums text-white">{formatNok(q.subtotalNok)}</span>
                    <span className="block text-[12px] text-white/55">eks. mva, {formatNok(q.totalNok)} inkl. mva</span>
                  </span>
                ) : null}
                <ul className="mt-4 space-y-2 text-[13px] leading-snug text-white/75">
                  {p.gives.map((g) => (
                    <li key={g} className="flex gap-2">
                      <span className="mt-[3px] text-[#C9A84C]" aria-hidden>
                        +
                      </span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold">Tillegg</h3>
        <p className={hintTextClass}>Valgfritt. Det som allerede er med i pakken {PACKAGE_NAMES[pkg]}, vises ikke.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ADDONS.filter((a) => offered.includes(a.id)).map((a) => {
            const on = addons.includes(a.id);
            return (
              <label key={a.id} className={`flex cursor-pointer items-center gap-3 ${choiceClass(on)}`}>
                <input type="checkbox" checked={on} onChange={() => toggleAddon(a.id)} className="h-4 w-4 shrink-0 accent-[#C9A84C]" />
                <span>{a.label}</span>
              </label>
            );
          })}
        </div>
        {ADDONS_INCLUDED_IN[pkg].length > 0 ? (
          <p className="mt-2 text-[12px] text-white/45">
            Med i {PACKAGE_NAMES[pkg]}: {ADDONS.filter((a) => ADDONS_INCLUDED_IN[pkg].includes(a.id)).map((a) => a.label.toLowerCase()).join(", ")}.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="text-base font-bold">Betaling</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setMethod("card")} className={choiceClass(method === "card")} aria-pressed={method === "card"}>
            <span className="block font-semibold text-white">Betal med kort</span>
            <span className="block text-[12px] text-white/55">Annonsen publiseres når betalingen er gjennomført.</span>
          </button>
          <button type="button" onClick={() => setMethod("invoice")} className={choiceClass(method === "invoice")} aria-pressed={method === "invoice"}>
            <span className="block font-semibold text-white">Faktura (14 dager)</span>
            <span className="block text-[12px] text-white/55">Annonsen publiseres med en gang, fakturaen kommer på e-post.</span>
          </button>
        </div>
        {method === "invoice" ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inv-ref" className={labelClass}>
                Deres referanse <span className="ml-1 font-normal normal-case tracking-normal text-white/45">(valgfritt)</span>
              </label>
              <input
                id="inv-ref"
                value={invoiceReference}
                onChange={(e) => setInvoiceReference(e.target.value.slice(0, 100))}
                className={inputClass(false)}
              />
            </div>
            <div>
              <label htmlFor="inv-email" className={labelClass}>
                Fakturaadresse e-post <span className="ml-1 font-normal normal-case tracking-normal text-white/45">(valgfritt)</span>
              </label>
              <input
                id="inv-email"
                type="email"
                value={invoiceEmail}
                onChange={(e) => setInvoiceEmail(e.target.value.slice(0, 200))}
                className={inputClass(false)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[18px] border border-[rgba(201,168,76,0.25)] bg-white/[0.03] p-5">
        <h3 className="text-base font-bold">Å betale</h3>
        <div className="mt-3">
          {finalQuote ? (
            <QuoteLines quote={finalQuote} />
          ) : quoteError ? (
            <p className="text-sm text-red-200">{quoteError}</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-white/60">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#C9A84C]" />
              Regner ut prisen{quoting ? "..." : ""}
            </p>
          )}
        </div>
        {payError ? (
          <div role="alert" className="mt-4 rounded-[10px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {payError}
          </div>
        ) : null}
        <button type="button" onClick={() => void pay()} disabled={!finalQuote || paying} className={`${primaryButtonClass} mt-5 w-full`}>
          {paying ? (
            <>
              <span className={spinnerClass} />
              {method === "card" ? "Åpner betaling..." : "Bestiller..."}
            </>
          ) : finalQuote ? (
            method === "card" ? (
              `Gå til betaling, ${formatNok(finalQuote.totalNok)}`
            ) : (
              `Bestill med faktura, ${formatNok(finalQuote.totalNok)}`
            )
          ) : (
            "Venter på prisen"
          )}
        </button>
        <p className="mt-3 text-center text-[12px] text-white/45">
          {method === "card"
            ? "Kortbetalingen skjer på en sikker betalingsside. Prisen er inkl. 25 % mva."
            : "Fakturaen har 14 dagers betalingsfrist. Prisen er inkl. 25 % mva."}
        </p>
      </div>
    </div>
  );
}
