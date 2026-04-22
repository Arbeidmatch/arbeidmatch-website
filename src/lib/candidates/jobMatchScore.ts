import type { JobRecord } from "@/lib/jobs/types";
import type { CandidateProfilePayload, JobPreferencesPayload } from "@/lib/candidates/profileSchema";

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

function salaryHourlyScore(job: JobRecord, band: JobPreferencesPayload["salaryHourly"]): number {
  const salaryText = `${job.salary ?? ""}`;
  if (!salaryText.trim()) return 58;

  const mentionsHourly = includesAny(salaryText, ["hour", "per hour", "/h", "kr/h", "nok/h"]);
  const lowHour = includesAny(salaryText, ["380", "400", "420", "440", "450"]);
  const midHour = includesAny(salaryText, ["480", "500", "520", "540", "550", "560"]);
  const highHour = includesAny(salaryText, ["580", "600", "620", "650", "700"]);

  if (mentionsHourly || lowHour || midHour || highHour) {
    if (band === "600_plus") return highHour ? 92 : midHour ? 84 : 74;
    if (band === "500_600") return midHour || highHour ? 88 : lowHour ? 76 : 72;
    return lowHour || midHour ? 82 : 70;
  }

  const highAnnual = includesAny(salaryText, ["700", "720", "750", "800", "850"]);
  const midAnnual = includesAny(salaryText, ["600", "620", "650", "680"]);
  if (band === "600_plus") return highAnnual ? 90 : midAnnual ? 82 : 74;
  if (band === "500_600") return midAnnual || highAnnual ? 86 : 78;
  return 76;
}

export type JobMatchResult = {
  score: number;
  reasons: string[];
};

export function computeJobMatchScore(job: JobRecord, profile: CandidateProfilePayload): JobMatchResult {
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
  const wantsHeavyHours = profile.preferences.hoursPerWeek === "60_plus" || profile.preferences.hoursPerWeek === "48";
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
