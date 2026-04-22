import type { JobRecord } from "@/lib/jobs/types";
import {
  type JobCompatibilityCriterionKey,
  type JobMatchProfileInput,
  compatibilityStrengthLabel,
  computeJobMatchScore,
  jobCompatibilityCriteria,
} from "@/lib/candidates/jobMatchScore";

const CRITERIA_ROWS: { key: JobCompatibilityCriterionKey; label: string }[] = [
  { key: "jobType", label: "Job type" },
  { key: "experience", label: "Experience" },
  { key: "salary", label: "Salary" },
  { key: "hours", label: "Hours" },
  { key: "rotation", label: "Rotation" },
  { key: "license", label: "License" },
];

export type CompatibilityCriterionRow = { label: string; aligned: boolean };

export type JobCompatibilityPayload = {
  overallPercent: number;
  band: ReturnType<typeof compatibilityStrengthLabel>;
  criteria: CompatibilityCriterionRow[];
  tips: string[];
};

export function buildCompatibilityTips(
  flags: Record<JobCompatibilityCriterionKey, boolean>,
): string[] {
  const tips: string[] = [];

  if (!flags.jobType) {
    tips.push(
      "Updating your preferred sector to sit closer to this category helps recruiters see a confident match with similar vacancies.",
    );
  }
  if (!flags.experience) {
    tips.push(
      "Adding a short note about comparable tools or responsibilities in your work history can make overlapping roles easier to spot.",
    );
  }
  if (!flags.salary) {
    tips.push(
      "Fine-tuning your expected hourly range so it sits comfortably near this posting often reads as thoughtful and realistic.",
    );
  }
  if (!flags.hours && tips.length < 3) {
    tips.push(
      "If longer weeks suit you, stating openness to extended schedules can resonate well with rotation-heavy language in the ad.",
    );
  }
  if (!flags.rotation && tips.length < 3) {
    tips.push(
      "Clarifying how you feel about swing or offshore rotations in your preferences can line up neatly with how this role is described.",
    );
  }
  if (!flags.license && tips.length < 3) {
    tips.push(
      "If you hold a relevant driving category, marking it in your profile makes transport-focused wording in listings easier to align with.",
    );
  }

  if (tips.length === 0) {
    tips.push(
      "Your saved preferences line up encouragingly with this vacancy. Applying while the post is fresh keeps your name near the top of the shortlist.",
    );
    tips.push(
      "Keeping availability and location current in your profile helps recruiters move quickly after you express interest.",
    );
  }

  return tips.slice(0, 3);
}

export function buildJobCompatibilityPayload(job: JobRecord, profile: JobMatchProfileInput): JobCompatibilityPayload {
  const flags = jobCompatibilityCriteria(job, profile);
  const { score } = computeJobMatchScore(job, profile);
  const criteria = CRITERIA_ROWS.map((row) => ({
    label: row.label,
    aligned: flags[row.key],
  }));
  return {
    overallPercent: score,
    band: compatibilityStrengthLabel(score),
    criteria,
    tips: buildCompatibilityTips(flags),
  };
}
