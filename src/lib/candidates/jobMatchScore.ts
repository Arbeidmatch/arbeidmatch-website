import type { JobRecord } from "@/lib/jobs/types";
import type { CandidateProfilePayload, JobPreferencesPayload } from "@/lib/candidates/profileSchema";
import { resolveSalaryHourlyMidNok } from "@/lib/candidates/profileSchema";

/** Minimum profile fields required for role matching heuristics. */
export type JobMatchProfileInput = Pick<CandidateProfilePayload, "experiences" | "preferences">;

function normalizeList(items?: string[] | string | null): string[] {
  if (!items) return [];
  if (Array.isArray(items)) return items.map((item) => item.trim()).filter(Boolean);
  return items.split("\n").map((item) => item.trim()).filter(Boolean);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function includesAny(haystack: string, needles: string[]): boolean {
  const h = normalize(haystack);
  return needles.some((n) => h.includes(normalize(n)));
}

function experienceBandMonths(band: JobPreferencesPayload["experienceBand"]): number {
  switch (band) {
    case "0_2":
      return 18;
    case "2_5":
      return 42;
    case "5_10":
      return 90;
    case "10_plus":
      return 150;
    default:
      return 42;
  }
}

function mapCategoryToJobType(category?: string | null): string | null {
  if (!category) return null;
  const c = normalize(category);
  if (c.includes("offshore")) return "Offshore";
  if (c.includes("transport") || c.includes("logistics")) return "Transport";
  if (c.includes("auto") || c.includes("vehicle")) return "Automotive";
  return "Onshore";
}

function extractLikelyHourlyMidNok(salaryText: string): number | null {
  const s = `${salaryText}`;
  if (!s.trim()) return null;
  const mentionsHourly = includesAny(s, ["hour", "per hour", "/h", "kr/h", "nok/h", "timer"]);
  const nums = [...s.matchAll(/\b(\d{3})\b/g)]
    .map((m) => parseInt(m[1], 10))
    .filter((n) => n >= 200 && n <= 900);
  if (!nums.length) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const mid = (lo + hi) / 2;
  if (mentionsHourly) return mid;
  if (hi <= 900) return mid;
  return null;
}

export function salaryHourlyScore(job: JobRecord, band: JobPreferencesPayload["salaryHourly"]): number {
  const salaryText = `${job.salary ?? ""}`;
  if (!salaryText.trim()) return 58;

  const candMid = resolveSalaryHourlyMidNok(band);
  const implied = extractLikelyHourlyMidNok(salaryText);
  if (implied !== null) {
    const diff = Math.abs(implied - candMid);
    if (diff <= 40) return 92;
    if (diff <= 90) return 84;
    if (diff <= 150) return 76;
    return 68;
  }

  const high = includesAny(salaryText, ["560", "570", "580", "590", "600", "620", "650", "700", "720"]);
  const midHigh = includesAny(salaryText, ["480", "500", "510", "520", "530", "540", "550"]);
  const mid = includesAny(salaryText, ["380", "400", "410", "420", "430", "440", "450", "460", "470"]);
  const low = includesAny(salaryText, ["200", "220", "240", "250", "260", "280", "300", "320", "340", "350", "360"]);

  if (candMid >= 575) return high || midHigh ? 90 : mid ? 80 : 72;
  if (candMid >= 475) return midHigh || high ? 88 : mid || low ? 78 : 72;
  if (candMid >= 375) return mid || midHigh ? 84 : low ? 78 : 70;
  if (candMid >= 275) return low || mid ? 82 : 70;
  return low ? 84 : mid ? 76 : 70;
}

export type JobMatchResult = {
  score: number;
  reasons: string[];
};

export function computeJobMatchScore(job: JobRecord, profile: JobMatchProfileInput): JobMatchResult {
  const reasons: string[] = [];
  let weighted = 0;
  let weightSum = 0;

  const add = (weight: number, score: number, reason: string) => {
    weighted += weight * score;
    weightSum += weight;
    reasons.push(reason);
  };

  const trade = job.trade?.trim();
  if (trade) {
    const titleHit = includesAny(job.title, [trade]);
    const expHit = profile.experiences.some((e) => includesAny(`${e.jobTitle} ${e.responsibilities}`, [trade]));
    const score = titleHit || expHit ? 88 : 62;
    add(0.34, score, titleHit ? `Strong trade alignment with ${trade}.` : `Partial trade alignment for ${trade}.`);
  } else {
    add(0.22, 65, "Limited trade signal on the job posting.");
  }

  const mapped = mapCategoryToJobType(job.category);
  if (mapped) {
    const score = mapped === profile.preferences.jobType ? 90 : 68;
    add(0.18, score, mapped === profile.preferences.jobType ? "Sector preference matches job category." : "Sector preference is close but not exact.");
  } else {
    add(0.12, 66, "Job category mapping is neutral.");
  }

  add(0.16, salaryHourlyScore(job, profile.preferences.salaryHourly), "Hourly expectation compared to the role compensation text.");

  const expMonths = experienceBandMonths(profile.preferences.experienceBand);
  const years = expMonths / 12;
  const workModel = normalize(job.workModel ?? "");
  const wantsHeavyHours = profile.preferences.hoursPerWeek === "54_plus" || profile.preferences.hoursPerWeek === "48";
  const offshore = profile.preferences.jobType === "Offshore";
  let hoursScore = 70;
  if (offshore && wantsHeavyHours) hoursScore = 88;
  else if (includesAny(workModel, ["rotation", "offshore", "shift"]) && wantsHeavyHours) hoursScore = 84;
  else if (years >= 3) hoursScore = 80;
  else hoursScore = 72;
  add(0.14, hoursScore, `Work rhythm fit using hours preference, rotation context, and about ${years.toFixed(1)} years of declared experience band.`);

  const rotationText = `${job.description} ${normalizeList(job.requirements).join(" ")}`;
  const rotationHeavy = includesAny(rotationText, ["rotation", "swing", "2/4", "2-4", "14/14", "28/28"]);
  let rotationScore = 72;
  if (rotationHeavy && profile.preferences.rotation !== "flexible") rotationScore = 86;
  if (!rotationHeavy && profile.preferences.rotation === "flexible") rotationScore = 78;
  add(0.1, rotationScore, "Rotation preference compared to role language.");

  const reqText = `${job.description}\n${normalizeList(job.requirements).join("\n")}`;
  const needsLicense = includesAny(reqText, ["driving", "license", "licence", "c+e", "ce license"]);
  if (needsLicense) {
    const score = profile.preferences.hasPermit ? 86 : 58;
    add(0.08, score, profile.preferences.hasPermit ? "Driving licence signal matches role requirements." : "Role suggests licence needs, profile signal is weak.");
  }

  const score = weightSum > 0 ? Math.round(weighted / weightSum) : 50;
  return { score: Math.min(99, Math.max(0, score)), reasons };
}

const ALIGN_THRESHOLD = 72;

function hoursSubScore(job: JobRecord, profile: JobMatchProfileInput): number {
  const expMonths = experienceBandMonths(profile.preferences.experienceBand);
  const years = expMonths / 12;
  const workModel = normalize(job.workModel ?? "");
  const wantsHeavyHours = profile.preferences.hoursPerWeek === "54_plus" || profile.preferences.hoursPerWeek === "48";
  const offshore = profile.preferences.jobType === "Offshore";
  let hoursScore = 70;
  if (offshore && wantsHeavyHours) hoursScore = 88;
  else if (includesAny(workModel, ["rotation", "offshore", "shift"]) && wantsHeavyHours) hoursScore = 84;
  else if (years >= 3) hoursScore = 80;
  else hoursScore = 72;
  return hoursScore;
}

function rotationSubScore(job: JobRecord, profile: JobMatchProfileInput): number {
  const rotationText = `${job.description} ${normalizeList(job.requirements).join(" ")}`;
  const rotationHeavy = includesAny(rotationText, ["rotation", "swing", "2/4", "2-4", "14/14", "28/28"]);
  let rotationScore = 72;
  if (rotationHeavy && profile.preferences.rotation !== "flexible") rotationScore = 86;
  if (!rotationHeavy && profile.preferences.rotation === "flexible") rotationScore = 78;
  return rotationScore;
}

export type JobCompatibilityCriterionKey =
  | "jobType"
  | "experience"
  | "salary"
  | "hours"
  | "rotation"
  | "license";

export function jobCompatibilityCriteria(
  job: JobRecord,
  profile: JobMatchProfileInput,
): Record<JobCompatibilityCriterionKey, boolean> {
  const mapped = mapCategoryToJobType(job.category);
  const jobType = mapped == null ? true : mapped === profile.preferences.jobType;

  const trade = job.trade?.trim();
  const blob = `${job.title}\n${job.description}\n${normalizeList(job.requirements).join("\n")}`;
  let experience = false;
  if (trade) {
    const titleHit = includesAny(job.title, [trade]);
    const expHit = profile.experiences.some((e) => includesAny(`${e.jobTitle} ${e.responsibilities}`, [trade]));
    if (titleHit || expHit) experience = true;
  }
  if (!experience) {
    const demands = includesAny(blob, [
      "5+ years",
      "5+ år",
      "minimum 5",
      "minimum 3",
      "senior",
      "10+ years",
      "10 år",
      "7+ years",
    ]);
    if (!demands) experience = true;
    else {
      const months = experienceBandMonths(profile.preferences.experienceBand);
      experience = months >= 42;
    }
  }

  const salary = salaryHourlyScore(job, profile.preferences.salaryHourly) >= ALIGN_THRESHOLD;
  const hours = hoursSubScore(job, profile) >= ALIGN_THRESHOLD;
  const rotation = rotationSubScore(job, profile) >= ALIGN_THRESHOLD;

  const reqText = `${job.description}\n${normalizeList(job.requirements).join("\n")}`;
  const needsLicense = includesAny(reqText, ["driving", "license", "licence", "c+e", "ce license"]);
  const license = !needsLicense || profile.preferences.hasPermit;

  return { jobType, experience, salary, hours, rotation, license };
}

export function compatibilityStrengthLabel(percent: number): "Strong" | "Good" | "Low" {
  if (percent >= 80) return "Strong";
  if (percent >= 70) return "Good";
  return "Low";
}
