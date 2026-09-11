import { formatNok, type AdQuote } from "@/lib/job-ads/types";

/** A quote line by line, then "Sum eks. mva", "Mva 25 %" and "Totalt", as the ATS priced it. */
export default function QuoteLines({ quote }: { quote: AdQuote }) {
  return (
    <dl className="space-y-1.5 text-sm">
      {quote.lines.map((line) => (
        <div key={line.key} className="flex items-start justify-between gap-4">
          <dt className="text-white/70">{line.label}</dt>
          <dd className="shrink-0 tabular-nums text-white">{formatNok(line.nok)}</dd>
        </div>
      ))}
      <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-2">
        <dt className="text-white/70">Sum eks. mva</dt>
        <dd className="shrink-0 tabular-nums text-white">{formatNok(quote.subtotalNok)}</dd>
      </div>
      <div className="flex items-start justify-between gap-4">
        <dt className="text-white/70">Mva 25 %</dt>
        <dd className="shrink-0 tabular-nums text-white">{formatNok(quote.vatNok)}</dd>
      </div>
      <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-2 text-base font-bold">
        <dt className="text-white">Totalt</dt>
        <dd className="shrink-0 tabular-nums text-[#C9A84C]">{formatNok(quote.totalNok)}</dd>
      </div>
    </dl>
  );
}
