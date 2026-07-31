"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/cv/suggest";

/**
 * "Improve this" control. The suggestion is computed locally from the phrasing library,
 * so pressing it sends nothing anywhere. It never overwrites: the user chooses.
 */
export function ImproveButton({
  label = "Improve this",
  getSuggestion,
  onAccept,
}: {
  label?: string;
  getSuggestion: () => Suggestion | null;
  onAccept: (text: string) => void;
}) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [empty, setEmpty] = useState(false);

  function run() {
    const result = getSuggestion();
    setSuggestion(result);
    setEmpty(result === null);
  }

  return (
    <div className="-mt-2 mb-4">
      <button
        type="button"
        onClick={run}
        className="rounded border border-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1.5 text-[13px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#C9A84C]/25 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
      >
        {label}
      </button>

      {empty ? (
        <p className="mt-2 text-[13px] text-[#55616D]" aria-live="polite">
          This already reads well. Nothing to change.
        </p>
      ) : null}

      {suggestion ? (
        <div className="mt-2 rounded border border-[#C9A84C]/60 bg-[#FBF7EC] p-3" aria-live="polite">
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#8A7331]">Suggested</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#0D1B2A]">{suggestion.text}</p>

          {suggestion.notes.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {suggestion.notes.map((note, index) => (
                <li key={index} className="text-[13px] leading-snug text-[#55616D]">
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onAccept(suggestion.text);
                setSuggestion(null);
              }}
              className="rounded bg-[#0D1B2A] px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-[#16293c] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="rounded border border-[#E2E5EA] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#55616D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]"
            >
              Keep mine
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
