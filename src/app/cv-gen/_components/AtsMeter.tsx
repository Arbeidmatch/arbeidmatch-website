"use client";

import { useMemo, useState } from "react";
import { evaluateAts, linearise } from "@/lib/cv/ats-rules";
import type { CvDocument } from "@/lib/cv/schema";

function scoreColour(score: number): string {
  if (score >= 85) return "#1D9E75";
  if (score >= 60) return "#C9A84C";
  return "#B03A2E";
}

/**
 * Live readiness score plus the raw text a parser will extract. The text view is the
 * teaching part: it shows why layout decisions matter.
 */
export function AtsMeter({ doc }: { doc: CvDocument }) {
  const [showText, setShowText] = useState(false);
  const report = useMemo(() => evaluateAts(doc), [doc]);
  const text = useMemo(() => (showText ? linearise(doc) : ""), [doc, showText]);
  const colour = scoreColour(report.score);

  return (
    <section className="rounded border border-[#E2E5EA] bg-white p-4" aria-label="ATS readiness">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">ATS readiness</h2>
        <span className="text-2xl font-bold" style={{ color: colour }} aria-live="polite">
          {report.score}
          <span className="text-sm font-semibold text-[#8A929C]">/100</span>
        </span>
      </div>

      <div
        className="mt-2 h-2 w-full overflow-hidden rounded bg-[#E2E5EA]"
        role="progressbar"
        aria-valuenow={report.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ATS readiness score"
      >
        <div className="h-full transition-all" style={{ width: `${report.score}%`, backgroundColor: colour }} />
      </div>

      {report.failures.length > 0 ? (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {report.failures.map((rule) => (
            <li key={rule.id} className="text-[13px] leading-snug text-[#55616D]">
              <span className="font-semibold text-[#0D1B2A]">{rule.label}.</span> {rule.fix}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] font-medium text-[#1D9E75]">
          Every check passes. This CV should come through a parser intact.
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowText((current) => !current)}
        aria-expanded={showText}
        className="mt-3 rounded border border-[#E2E5EA] px-3 py-1.5 text-[13px] font-semibold text-[#0D1B2A] transition-colors hover:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
      >
        {showText ? "Hide ATS text view" : "Show ATS text view"}
      </button>

      {showText ? (
        <>
          <p className="mt-2 text-[13px] text-[#55616D]">
            This is what a recruitment system reads. If something is missing here, it is missing
            from your application.
          </p>
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-[#0D1B2A] p-3 text-[12px] leading-relaxed text-[#E6EAEF]">
            {text}
          </pre>
        </>
      ) : null}
    </section>
  );
}
