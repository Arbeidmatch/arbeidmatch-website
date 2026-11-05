"use client";

import type { AnswerMode } from "@/lib/pay-conditions";

import { serif, Tile, TileGrid, type Tone } from "./ui";

/**
 * Step 1, on the popup and at the top of /request (the owner, 5 November
 * 2026): a candidate on the role answers faster, a candidate on the details
 * takes longer. Choosing the details goes to the detailed form.
 */
export const ANSWER_MODE_OPTIONS: ReadonlyArray<{ mode: AnswerMode; label: string; sub: string }> = [
  { mode: "rolle", label: "Kandidat på rolle", sub: "Raskere svar" },
  { mode: "detaljer", label: "Kandidat på detaljer", sub: "Tar lengre tid" },
];

export const ANSWER_MODE_TITLE = "Hvordan vil dere ha svar?";

export default function AnswerModeStep({
  value,
  onChoose,
  tone = "light",
  titleId,
}: {
  value: AnswerMode | "";
  onChoose: (mode: AnswerMode) => void;
  tone?: Tone;
  titleId?: string;
}) {
  return (
    <div>
      <h2
        id={titleId}
        tabIndex={-1}
        className={`${serif} text-[30px] leading-[1.1] outline-none sm:text-[36px] ${tone === "dark" ? "text-white" : "text-[#0D1B2A]"}`}
      >
        {ANSWER_MODE_TITLE}
      </h2>
      <div className="mt-5">
        <TileGrid>
          {ANSWER_MODE_OPTIONS.map((o) => (
            <Tile key={o.mode} tone={tone} sub={o.sub} selected={value === o.mode} onClick={() => onChoose(o.mode)}>
              {o.label}
            </Tile>
          ))}
        </TileGrid>
      </div>
    </div>
  );
}
