"use client";

import { useState } from "react";

import { checkPayConditions, payFieldErrors, toggleBenefit } from "@/lib/pay-conditions";

import PayAndConditions from "./PayAndConditions";
import type { StepProps } from "./types";
import { StepButtons, StepTitle } from "./ui";

/**
 * Step 7: pay and conditions. Neste stays blocked until equal treatment is
 * confirmed and no amount is under the floor. On this variant (a candidate on
 * the role) Fra starts at the floor when RecOS knows one, Til may stay empty
 * (it is then Fra), and with no floor known the range may stay empty.
 */
export default function PayStep({ answers, update, onNext, onBack, titleId, floor }: StepProps & { floor: number | null }) {
  const [tried, setTried] = useState(false);
  const fieldErrors = payFieldErrors({ from: answers.payFrom, to: answers.payTo, floor });
  const problem = checkPayConditions({
    answerMode: "rolle",
    equalTreatmentConfirmed: answers.equalTreatment,
    payFrom: answers.payFrom,
    payTo: answers.payTo.trim() ? answers.payTo : answers.payFrom,
    payFloorAtSubmit: floor,
  });
  const blocked = problem !== null || Boolean(fieldErrors.from || fieldErrors.to);

  return (
    <div>
      <StepTitle id={titleId}>Lønn og vilkår</StepTitle>
      <div className="mt-5">
        <PayAndConditions
          idPrefix="rf"
          floor={floor}
          equalTreatment={answers.equalTreatment}
          onEqualTreatment={(v) => update({ equalTreatment: v })}
          payFrom={answers.payFrom}
          payTo={answers.payTo}
          onPayFrom={(v) => update({ payFrom: v, payFromTouched: true })}
          onPayTo={(v) => update({ payTo: v })}
          benefits={answers.benefits}
          onToggleBenefit={(b) => update({ benefits: toggleBenefit(answers.benefits, b) })}
          showConfirmError={tried}
          rangeError={tried && answers.equalTreatment ? problem : null}
        />
      </div>
      <StepButtons primary="Neste" primaryBlocked={blocked} onPrimary={() => (blocked ? setTried(true) : onNext())} onBack={onBack} />
    </div>
  );
}
