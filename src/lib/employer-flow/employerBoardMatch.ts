import type { CandidateProfilePayload } from "@/lib/candidates/profileSchema";
import { resolveSalaryHourlyMidNok } from "@/lib/candidates/profileSchema";
import type { EmployerBoardMeta } from "@/lib/jobs/types";

function bandMinYears(band: CandidateProfilePayload["preferences"]["experienceBand"]): number {
  switch (band) {
    case "0_2":
      return 0;
    case "2_5":
      return 2;
    case "5_10":
      return 5;
    case "10_plus":
      return 10;
    default:
      return 0;
  }
}

export type EmployerBoardMatchResult = {
  points: number;
  maxPoints: number;
  percent: number;
  breakdown: string[];
};

export function computeEmployerBoardMatch(meta: EmployerBoardMeta, profile: CandidateProfilePayload): EmployerBoardMatchResult {
  const breakdown: string[] = [];
  let points = 0;
  const maxPoints = 12;

  if (meta.mappedJobType && meta.mappedJobType === profile.preferences.jobType) {
    points += 3;
    breakdown.push("Job sector +3");
  } else {
    breakdown.push("Job sector 0");
  }

  const candYears = bandMinYears(profile.preferences.experienceBand);
  const need = meta.experienceYearsMin;
  if (need === null || need === undefined) {
    points += 2;
    breakdown.push("Experience signal +2");
  } else if (candYears + 1 >= need) {
    points += 2;
    breakdown.push("Experience fit +2");
  } else {
    breakdown.push("Experience gap 0");
  }

  const mid = resolveSalaryHourlyMidNok(profile.preferences.salaryHourly);
  if (meta.salaryMin !== null && meta.salaryMax !== null) {
    const lo = Math.min(meta.salaryMin, meta.salaryMax);
    const hi = Math.max(meta.salaryMin, meta.salaryMax);
    if (mid >= lo - 40 && mid <= hi + 60) {
      points += 2;
      breakdown.push("Salary band +2");
    } else {
      breakdown.push("Salary band 0");
    }
  } else {
    points += 1;
    breakdown.push("Salary data partial +1");
  }

  const hoursText = `${meta.hours || ""}`.toLowerCase();
  const wantsHeavy = profile.preferences.hoursPerWeek === "54_plus" || profile.preferences.hoursPerWeek === "48";
  const jobHeavy =
    hoursText.includes("48") ||
    hoursText.includes("50") ||
    hoursText.includes("54") ||
    hoursText.includes("60") ||
    hoursText.includes("rotation");
  if ((jobHeavy && wantsHeavy) || (!jobHeavy && !wantsHeavy)) {
    points += 1;
    breakdown.push("Hours rhythm +1");
  } else {
    breakdown.push("Hours rhythm 0");
  }

  const rotText = `${meta.rotation || ""}`.toLowerCase();
  const jobRotationHeavy = rotText.includes("rotation") || rotText.includes("weeks");
  const pref = profile.preferences.rotation;
  if (!jobRotationHeavy && pref === "flexible") {
    points += 1;
    breakdown.push("Rotation +1");
  } else if (jobRotationHeavy && pref !== "flexible") {
    points += 1;
    breakdown.push("Rotation +1");
  } else if (jobRotationHeavy && pref === "flexible") {
    points += 1;
    breakdown.push("Rotation flexible +1");
  } else {
    breakdown.push("Rotation 0");
  }

  if (!meta.licenseRequired || profile.preferences.hasPermit) {
    points += 1;
    breakdown.push("Licence signal +1");
  } else {
    breakdown.push("Licence mismatch 0");
  }

  if (!meta.housingProvided) {
    points += 1;
    breakdown.push("Housing fit +1");
  } else if (profile.preferences.housing === "company" || profile.preferences.housing === "no_preference") {
    points += 1;
    breakdown.push("Housing fit +1");
  } else {
    breakdown.push("Housing mismatch 0");
  }

  if (!meta.travelPaid) {
    points += 1;
    breakdown.push("Travel expectation +1");
  } else if (profile.preferences.travel === "company") {
    points += 1;
    breakdown.push("Travel expectation +1");
  } else {
    breakdown.push("Travel mismatch 0");
  }

  const capped = Math.min(maxPoints, Math.max(0, points));
  const percent = Math.round((capped / maxPoints) * 1000) / 10;
  return { points: capped, maxPoints, percent, breakdown };
}

export function employerBoardMeetsThreshold(result: EmployerBoardMatchResult): boolean {
  return result.percent >= 70;
}
