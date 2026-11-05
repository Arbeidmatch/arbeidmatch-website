"use client";

import { useState } from "react";

import { COUNTS, MORE, MORE_COUNTS } from "./data";
import type { StepProps } from "./types";
import { InlineError, StepButtons, StepTitle, Tile, TileGrid } from "./ui";

/** Step 4: how many. "Flere" opens the larger numbers; a number moves on. */
export default function CountStep({ answers, update, onNext, onBack, titleId }: StepProps) {
  const [tried, setTried] = useState(false);
  const more = answers.showMoreCounts || (MORE_COUNTS as readonly string[]).includes(answers.count);
  const pick = (count: string) => {
    update({ count });
    onNext();
  };
  return (
    <div>
      <StepTitle id={titleId}>Hvor mange?</StepTitle>
      <div className="mt-5">
        <TileGrid cols={3}>
          {COUNTS.map((c) => (
            <Tile key={c} selected={answers.count === c} onClick={() => pick(c)}>
              {c}
            </Tile>
          ))}
          <Tile selected={more} onClick={() => update({ showMoreCounts: !more, ...(more ? { count: (MORE_COUNTS as readonly string[]).includes(answers.count) ? "" : answers.count } : {}) })}>
            {MORE}
          </Tile>
        </TileGrid>
        {more ? (
          <div className="mt-2">
            <TileGrid cols={3}>
              {MORE_COUNTS.map((c) => (
                <Tile key={c} selected={answers.count === c} onClick={() => pick(c)}>
                  {c}
                </Tile>
              ))}
            </TileGrid>
          </div>
        ) : null}
      </div>
      {tried && !answers.count ? <InlineError>Velg hvor mange.</InlineError> : null}
      <StepButtons
        primary="Neste"
        primaryBlocked={!answers.count}
        onPrimary={() => (answers.count ? onNext() : setTried(true))}
        onBack={onBack}
      />
    </div>
  );
}
