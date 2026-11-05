import type { RaskAnswers } from "./data";

/** What every step of the popup is given. */
export type StepProps = {
  answers: RaskAnswers;
  update: (patch: Partial<RaskAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  titleId: string;
};
