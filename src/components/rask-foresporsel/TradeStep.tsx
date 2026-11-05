"use client";

import { useState } from "react";

import { TRADES } from "./data";
import type { StepProps } from "./types";
import { InlineError, StepButtons, StepTitle, Tile, TileGrid } from "./ui";

/** Step 2: the trade. A tap chooses it and moves on; a new trade clears the roles of the old one. */
export default function TradeStep({ answers, update, onNext, onBack, titleId }: StepProps) {
  const [tried, setTried] = useState(false);
  return (
    <div>
      <StepTitle id={titleId}>Hvilket fagområde?</StepTitle>
      <div className="mt-5">
        <TileGrid>
          {TRADES.map((t) => (
            <Tile
              key={t.key}
              selected={answers.trade === t.key}
              onClick={() => {
                if (answers.trade !== t.key) {
                  update({ trade: t.key, roles: [], otherRoleChosen: t.key === "annet", otherRole: "" });
                }
                onNext();
              }}
            >
              {t.label}
            </Tile>
          ))}
        </TileGrid>
      </div>
      {tried && !answers.trade ? <InlineError>Velg et fagområde.</InlineError> : null}
      <StepButtons
        primary="Neste"
        primaryBlocked={!answers.trade}
        onPrimary={() => (answers.trade ? onNext() : setTried(true))}
        onBack={onBack}
      />
    </div>
  );
}
