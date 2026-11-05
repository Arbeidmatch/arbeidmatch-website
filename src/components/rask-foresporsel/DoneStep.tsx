"use client";

import { btnOutline, StepTitle } from "./ui";

/** "Mottatt": one line and one outline button. */
export default function DoneStep({ titleId, reference, onClose }: { titleId: string; reference: string; onClose: () => void }) {
  return (
    <div>
      <StepTitle id={titleId}>Mottatt</StepTitle>
      <p className="mt-3 text-[15px] text-[#14202F]">
        Vi svarer på e-post så snart vi har kandidater{reference ? ` (referanse ${reference})` : ""}.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row-reverse sm:justify-start">
        <button type="button" onClick={onClose} className={btnOutline}>
          Lukk
        </button>
      </div>
    </div>
  );
}
