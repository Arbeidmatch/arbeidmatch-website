"use client";

import { useState } from "react";

import { COUNTIES, countyOf, ELSEWHERE_IN_COUNTY } from "./data";
import type { StepProps } from "./types";
import { InlineError, StepButtons, StepTitle, Tile, TileGrid } from "./ui";

/**
 * Step 6: where. The fifteen counties first; a county opens its larger towns
 * and "Annet sted i fylket". Tilbake from the towns returns to the counties.
 */
export default function PlaceStep({ answers, update, onNext, onBack, titleId }: StepProps) {
  const [tried, setTried] = useState(false);
  const county = countyOf(answers.county);
  const ready = Boolean(county && answers.town);

  if (!county) {
    return (
      <div>
        <StepTitle id={titleId}>Hvor?</StepTitle>
        <div className="mt-5">
          <TileGrid cols={3}>
            {COUNTIES.map((c) => (
              <Tile key={c.name} selected={false} onClick={() => update({ county: c.name, town: "" })}>
                {c.name}
              </Tile>
            ))}
          </TileGrid>
        </div>
        {tried ? <InlineError>Velg fylke.</InlineError> : null}
        <StepButtons primary="Neste" primaryBlocked onPrimary={() => setTried(true)} onBack={onBack} />
      </div>
    );
  }

  return (
    <div>
      <StepTitle id={titleId}>Hvor i {county.name}?</StepTitle>
      <div className="mt-5">
        <TileGrid cols={3}>
          {[...county.towns, ELSEWHERE_IN_COUNTY].map((town) => (
            <Tile
              key={town}
              selected={answers.town === town}
              onClick={() => {
                update({ town });
                onNext();
              }}
            >
              {town}
            </Tile>
          ))}
        </TileGrid>
      </div>
      {tried && !ready ? <InlineError>Velg sted.</InlineError> : null}
      <StepButtons
        primary="Neste"
        primaryBlocked={!ready}
        onPrimary={() => (ready ? onNext() : setTried(true))}
        onBack={() => update({ county: "", town: "" })}
      />
    </div>
  );
}
