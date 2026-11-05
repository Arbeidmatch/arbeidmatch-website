"use client";

import { useState } from "react";

import { PICK_DATE, WHEN_OPTIONS, whenLine } from "./data";
import type { StepProps } from "./types";
import { InlineError, inputClass, StepButtons, StepTitle, Tile, TileGrid } from "./ui";

/** Today as yyyy-mm-dd in the visitor's own time, the earliest date the field takes. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Step 5: when. "Velg dato" opens a date field that starts today. */
export default function WhenStep({ answers, update, onNext, onBack, titleId }: StepProps) {
  const [tried, setTried] = useState(false);
  const min = todayIso();
  const dateTooEarly = answers.when === PICK_DATE && answers.date !== "" && answers.date < min;
  const ready = whenLine(answers) !== "" && !dateTooEarly;
  return (
    <div>
      <StepTitle id={titleId}>Når?</StepTitle>
      <div className="mt-5">
        <TileGrid>
          {WHEN_OPTIONS.map((w) => (
            <Tile
              key={w}
              selected={answers.when === w}
              onClick={() => {
                update({ when: w });
                onNext();
              }}
            >
              {w}
            </Tile>
          ))}
          <Tile selected={answers.when === PICK_DATE} onClick={() => update({ when: PICK_DATE })}>
            {PICK_DATE}
          </Tile>
        </TileGrid>
        {answers.when === PICK_DATE ? (
          <div className="mt-3">
            <label htmlFor="rf-date" className="sr-only">
              Startdato
            </label>
            <input
              id="rf-date"
              type="date"
              min={min}
              value={answers.date}
              onChange={(e) => update({ date: e.target.value })}
              className={inputClass}
            />
          </div>
        ) : null}
      </div>
      {dateTooEarly ? <InlineError>Velg en dato fra i dag.</InlineError> : tried && !ready ? <InlineError>Velg når dere trenger folk.</InlineError> : null}
      <StepButtons primary="Neste" primaryBlocked={!ready} onPrimary={() => (ready ? onNext() : setTried(true))} onBack={onBack} />
    </div>
  );
}
