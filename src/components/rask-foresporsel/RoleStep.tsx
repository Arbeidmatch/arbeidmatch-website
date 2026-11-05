"use client";

import { useState } from "react";

import { chosenRoles, OTHER_ROLE, ROLES_BY_TRADE } from "./data";
import type { StepProps } from "./types";
import { InlineError, inputClass, StepButtons, StepTitle, Tile, TileGrid } from "./ui";

/**
 * Step 3: the roles of the chosen trade, several at once, and "Annen rolle"
 * with one short field. A typed role marks the request as outside our trades;
 * the recruiter decides.
 */
export default function RoleStep({ answers, update, onNext, onBack, titleId }: StepProps) {
  const [tried, setTried] = useState(false);
  const roles = answers.trade ? ROLES_BY_TRADE[answers.trade] : [];
  const ready = chosenRoles(answers).length > 0;
  const toggle = (role: string) =>
    update({ roles: answers.roles.includes(role) ? answers.roles.filter((r) => r !== role) : [...answers.roles, role] });

  return (
    <div>
      <StepTitle id={titleId}>Hvilken rolle?</StepTitle>
      <div className="mt-5">
        <TileGrid>
          {roles.map((role) => (
            <Tile key={role} multi selected={answers.roles.includes(role)} onClick={() => toggle(role)}>
              {role}
            </Tile>
          ))}
          <Tile multi selected={answers.otherRoleChosen} onClick={() => update({ otherRoleChosen: !answers.otherRoleChosen })}>
            {OTHER_ROLE}
          </Tile>
        </TileGrid>
        {answers.otherRoleChosen ? (
          <div className="mt-3">
            <label htmlFor="rf-other-role" className="sr-only">
              {OTHER_ROLE}
            </label>
            <input
              id="rf-other-role"
              type="text"
              maxLength={80}
              autoComplete="off"
              placeholder="Skriv rollen"
              value={answers.otherRole}
              onChange={(e) => update({ otherRole: e.target.value })}
              className={inputClass}
            />
          </div>
        ) : null}
      </div>
      {tried && !ready ? <InlineError>Velg minst én rolle.</InlineError> : null}
      <StepButtons primary="Neste" primaryBlocked={!ready} onPrimary={() => (ready ? onNext() : setTried(true))} onBack={onBack} />
    </div>
  );
}
