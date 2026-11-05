"use client";

import { useEffect, useRef, useState } from "react";

import { formatOrgNumber } from "@/lib/orgNumber";

import { summaryLine } from "./data";
import type { StepProps } from "./types";
import { InlineError, inputClass, labelClass, StepButtons, StepTitle } from "./ui";

type Company = { name: string; orgNumber: string; city?: string };

/** The register writes towns in capitals ("MO I RANA"); read as "Mo i Rana". */
export const townName = (v: string) =>
  v
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && w === "i" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is still missing before Send, in the order the client meets it; null when nothing is. */
export function contactProblem(a: StepProps["answers"]): string | null {
  if (!a.company) return "Velg firmaet fra Brønnøysundregistrene.";
  if (!EMAIL_PATTERN.test(a.email.trim())) return "Skriv inn jobb-e-posten.";
  if (!a.privacyAccepted) return "Bekreft at du har lest personvernerklæringen for å fortsette.";
  if (!a.termsAccepted) return "Godta vilkårene for å fortsette.";
  return null;
}

/**
 * Step 8: who we answer. The company only through the register (his rule
 * R133, 8 October 2026: never a free-text employer): by name or by org.nr.,
 * picked from the list, shown under the field. Not found offers the same ways
 * on as the contact page. Then the work e-mail, the request in one line, and
 * the two confirmations /request asks before a code is sent.
 */
export default function ContactStep({
  answers,
  update,
  onBack,
  titleId,
  onSend,
  busy,
  error,
}: StepProps & { onSend: () => void; busy: boolean; error: string | null }) {
  const [hits, setHits] = useState<Company[] | null>(null);
  const [lookup, setLookup] = useState<"idle" | "loading" | "error">("idle");
  const [showNotFound, setShowNotFound] = useState(false);
  const [tried, setTried] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = answers.companyQuery;

  // The register, asked as the client types: by name, or by number when it is nine digits.
  useEffect(() => {
    if (answers.company) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      setLookup("idle");
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLookup("loading");
      try {
        const res = await fetch(`/api/brreg/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const body = (await res.json().catch(() => ({}))) as { companies?: Company[] };
        if (!res.ok && !Array.isArray(body.companies)) throw new Error("brreg");
        setHits(Array.isArray(body.companies) ? body.companies.filter((c) => c.name && c.orgNumber) : []);
        setLookup(res.ok ? "idle" : "error");
      } catch {
        if (!ctrl.signal.aborted) {
          setHits([]);
          setLookup("error");
        }
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, answers.company]);

  const problem = contactProblem(answers);
  const summary = summaryLine(answers);

  return (
    <div>
      <StepTitle id={titleId}>Hvem svarer vi?</StepTitle>

      <div className="mt-5 space-y-5">
        <div>
          <label htmlFor="rf-company" className={labelClass}>
            Firma
          </label>
          {answers.company ? (
            <div className="mt-2 flex items-start justify-between gap-3 border-b border-[#E6E1D6] pb-3">
              <div className="min-w-0 text-[15px] text-[#14202F]">
                <p className="font-semibold">{answers.company.name}</p>
                <p className="text-[13.5px] text-[#6B7382]">
                  Org.nr. {formatOrgNumber(answers.company.orgNumber)}
                  {answers.company.city ? `, ${townName(answers.company.city)}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-[14px] font-medium text-[#0D1B2A] underline decoration-[#C9A84C] underline-offset-4"
                onClick={() => {
                  update({ company: null });
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
              >
                Endre
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <input
                ref={inputRef}
                id="rf-company"
                type="text"
                autoComplete="organization"
                maxLength={100}
                placeholder="Org.nr. eller firmanavn"
                value={query}
                onChange={(e) => {
                  update({ companyQuery: e.target.value });
                  setShowNotFound(false);
                }}
                aria-controls="rf-company-hits"
                className={inputClass}
              />
              {hits && hits.length ? (
                <ul id="rf-company-hits" aria-label="Treff i Brønnøysundregistrene" className="mt-1 border-y border-[#E6E1D6]">
                  {hits.map((c) => (
                    <li key={c.orgNumber} className="border-b border-[#E6E1D6] last:border-b-0">
                      <button
                        type="button"
                        className="flex min-h-11 w-full flex-col items-start px-1 py-2 text-left hover:bg-[#F4F1EA]"
                        onClick={() => {
                          update({ company: c });
                          setHits(null);
                          requestAnimationFrame(() => document.getElementById("rf-email")?.focus());
                        }}
                      >
                        <span className="text-[15px] font-medium text-[#14202F]">{c.name}</span>
                        <span className="text-[13px] text-[#6B7382]">
                          {formatOrgNumber(c.orgNumber)}
                          {c.city ? `, ${townName(c.city)}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-1.5 text-[13px] text-[#6B7382]">
                {lookup === "loading"
                  ? "Søker i Brønnøysundregistrene ..."
                  : lookup === "error"
                    ? "Søket svarer ikke akkurat nå. Prøv igjen om litt."
                    : hits && hits.length === 0 && query.trim().length >= 2
                      ? "Ingen treff i Brønnøysundregistrene."
                      : null}{" "}
                <button
                  type="button"
                  className="font-medium text-[#0D1B2A] underline decoration-[#C9A84C] underline-offset-4"
                  aria-expanded={showNotFound}
                  onClick={() => setShowNotFound((v) => !v)}
                >
                  Fant ikke firmaet?
                </button>
              </p>
              {showNotFound ? (
                <div className="mt-2 border-l border-[#C9A84C] pl-3 text-[13.5px] text-[#14202F]">
                  <p>Vi tar bare imot forespørsler fra firma i Brønnøysundregistrene.</p>
                  <ul className="mt-1 space-y-1">
                    <li>
                      <button
                        type="button"
                        className="underline decoration-[#C9A84C] underline-offset-4"
                        onClick={() => {
                          update({ companyQuery: "" });
                          setShowNotFound(false);
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                      >
                        Søk på org.nr.
                      </button>
                    </li>
                    <li>
                      <a href="/contact" className="underline decoration-[#C9A84C] underline-offset-4">
                        Utenlandsk firma
                      </a>
                    </li>
                    <li>
                      <a href="/for-candidates" className="underline decoration-[#C9A84C] underline-offset-4">
                        Jeg er jobbsøker
                      </a>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="rf-email" className={labelClass}>
            Jobb-e-post
          </label>
          <input
            id="rf-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            placeholder="navn@bedrift.no"
            value={answers.email}
            onChange={(e) => update({ email: e.target.value })}
            className={`${inputClass} mt-2`}
          />
        </div>

        {summary ? <p className="border-l border-[#C9A84C] pl-3 text-[14.5px] text-[#14202F]">{summary}</p> : null}

        <div className="space-y-3 text-[14px] leading-relaxed text-[#14202F]">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={answers.privacyAccepted}
              onChange={(e) => update({ privacyAccepted: e.target.checked })}
              className="mt-1 h-5 w-5 shrink-0 accent-[#0D1B2A]"
            />
            <span>
              Jeg bekrefter at jeg har fullmakt til å sende denne forespørselen på vegne av bedriften min, og at jeg har lest{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline decoration-[#C9A84C] underline-offset-4">
                personvernerklæringen
              </a>
              .
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={answers.termsAccepted}
              onChange={(e) => update({ termsAccepted: e.target.checked })}
              className="mt-1 h-5 w-5 shrink-0 accent-[#0D1B2A]"
            />
            <span>
              Jeg godtar{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline decoration-[#C9A84C] underline-offset-4">
                vilkårene
              </a>
              .
            </span>
          </label>
        </div>
      </div>

      {tried && problem ? <InlineError>{problem}</InlineError> : error ? <InlineError>{error}</InlineError> : null}
      <p className="mt-6 text-[13.5px] text-[#6B7382]">Vi sender en kode til e-posten for å bekrefte den.</p>
      <StepButtons
        primary={busy ? "Sender ..." : "Send"}
        primaryBlocked={problem !== null}
        busy={busy}
        onPrimary={() => {
          if (busy) return;
          if (problem) {
            setTried(true);
            return;
          }
          onSend();
        }}
        onBack={onBack}
      />
    </div>
  );
}
