import { randomUUID } from "node:crypto";

export type EmployerRequestWizardPayload = {
  company: string;
  category: string;
  position: string;
  positionOther?: string;
  qualification: string;
  experience?: string;
  hiringType: string;
  certifications?: string;
  requirements?: string;
  norwegianLevel?: string;
  englishLevel?: string;
  driverLicense?: string;
  contractType?: string;
  salaryFrom?: string;
  salaryTo?: string;
  salary?: string;
  salaryAmount?: string;
  hoursUnit?: string;
  hoursAmount?: string;
  hasRotation?: string;
  rotationWeeksOn?: string;
  rotationWeeksOff?: string;
  internationalTravel?: string;
  localTravel?: string;
  accommodation?: string;
  accommodationCost?: string;
  city: string;
  startDate?: string;
  job_summary?: string;
  equipment?: string;
  tools?: string;
  numberOfPositions?: string;
  email: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseNum(raw?: string): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function experienceLabel(years?: string, qualification?: string): string {
  const y = parseNum(years);
  if (y !== null && y >= 8) return "senior level";
  if (y !== null && y >= 4) return "experienced level";
  if (y !== null && y >= 1) return "intermediate level";
  const q = (qualification || "").trim().toLowerCase();
  if (q.includes("master") || q.includes("engineer")) return "qualified specialist level";
  return "professional level";
}

function mapCategoryToJobType(category: string): "Offshore" | "Onshore" | "Transport" | "Automotive" {
  const c = category.trim().toLowerCase();
  if (c.includes("offshore")) return "Offshore";
  if (c.includes("transport") || c.includes("logistics") || c.includes("driver")) return "Transport";
  if (c.includes("auto") || c.includes("vehicle") || c.includes("mechanic")) return "Automotive";
  return "Onshore";
}

function parseSalaryRange(payload: EmployerRequestWizardPayload): { min: number | null; max: number | null; label: string } {
  const from = parseNum(payload.salaryFrom);
  const to = parseNum(payload.salaryTo);
  if (from !== null && to !== null) {
    return { min: Math.min(from, to), max: Math.max(from, to), label: `NOK ${Math.round(Math.min(from, to))} to ${Math.round(Math.max(from, to))} per period (see contract)` };
  }
  const single = parseNum(payload.salaryAmount) ?? parseNum(payload.salary);
  if (single !== null) {
    return { min: single, max: single, label: `Around NOK ${Math.round(single)} (employer confirmed range in posting)` };
  }
  const text = [payload.salary, payload.salaryFrom, payload.salaryTo].filter(Boolean).join(" ").trim();
  return { min: null, max: null, label: text || "Compensation aligned with collective agreement and experience" };
}

function rotationSummary(payload: EmployerRequestWizardPayload): string {
  const on = parseNum(payload.rotationWeeksOn);
  const off = parseNum(payload.rotationWeeksOff);
  const flag = (payload.hasRotation || "").trim().toLowerCase();
  if (on !== null && off !== null) {
    return `Rotation rhythm discussed as ${on} weeks on and ${off} weeks off where applicable.`;
  }
  if (flag === "true" || flag === "yes") {
    return "Rotation or swing schedule is part of the role. Details are confirmed with the employer.";
  }
  return "Day-based or fixed schedule unless otherwise agreed with the employer.";
}

function boolishTravelPaid(international?: string, local?: string): boolean {
  const t = `${international || ""} ${local || ""}`.toLowerCase();
  return t.includes("company") || t.includes("covered") || t.includes("paid");
}

function boolishHousing(accommodation?: string, cost?: string): boolean {
  const t = `${accommodation || ""} ${cost || ""}`.toLowerCase();
  return t.includes("yes") || t.includes("company") || t.includes("provided");
}

function licenseRequired(driverLicense?: string): boolean {
  const d = (driverLicense || "").trim().toLowerCase();
  return d.length > 0 && d !== "none" && d !== "no";
}

export type GeneratedEmployerJobInsert = {
  slug: string;
  title: string;
  description: string;
  requirements: string;
  salary_min: number | null;
  salary_max: number | null;
  hours: string | null;
  rotation: string | null;
  license_required: boolean;
  housing_provided: boolean;
  travel_paid: boolean;
  company_name: string;
  employer_email: string;
  location: string;
  category: string;
  mapped_job_type: "Offshore" | "Onshore" | "Transport" | "Automotive";
  experience_years_min: number | null;
};

export function generateEmployerJobContent(payload: EmployerRequestWizardPayload): GeneratedEmployerJobInsert {
  const positionTitle = (payload.position === "Other" ? payload.positionOther : payload.position) || payload.position;
  const expLabel = experienceLabel(payload.experience, payload.qualification);
  const title = `${payload.category} ${positionTitle} (${expLabel})`.replace(/\s+/g, " ").trim();

  const salary = parseSalaryRange(payload);
  const hours =
    payload.hoursAmount && payload.hoursUnit
      ? `${payload.hoursAmount} ${payload.hoursUnit}`.trim()
      : payload.hoursAmount || payload.hoursUnit || null;

  const rotation = rotationSummary(payload);
  const lic = licenseRequired(payload.driverLicense);
  const housing = boolishHousing(payload.accommodation, payload.accommodationCost);
  const travel = boolishTravelPaid(payload.internationalTravel, payload.localTravel);
  const expYears = parseNum(payload.experience);

  const intro = [
    `ArbeidMatch prepared this draft listing based on the employer request for ${payload.company} in ${payload.city}, Norway.`,
    `Hiring type: ${payload.hiringType}.`,
    payload.job_summary ? `Role focus: ${payload.job_summary}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const body = [
    `Position: ${positionTitle}.`,
    `Qualification profile: ${payload.qualification}.`,
    payload.certifications ? `Certifications mentioned: ${payload.certifications}.` : null,
    `Language expectations: Norwegian ${payload.norwegianLevel || "not specified"}, English ${payload.englishLevel || "not specified"}.`,
    payload.contractType ? `Contract: ${payload.contractType}.` : null,
    `Compensation guidance: ${salary.label}.`,
    hours ? `Hours pattern: ${hours}.` : null,
    rotation,
    lic ? "Driving licence is expected for this role." : "Driving licence is not marked as mandatory in the request.",
    housing ? "Employer signals housing support or company-assisted accommodation." : "Housing is arranged personally unless upgraded during review.",
    travel ? "Employer signals travel or rotation travel support where applicable." : "Travel conditions follow standard site agreement.",
    payload.startDate ? `Preferred start window: ${payload.startDate}.` : null,
    payload.equipment ? `Equipment context: ${payload.equipment}.` : null,
    payload.tools ? `Tools context: ${payload.tools}.` : null,
    payload.numberOfPositions ? `Headcount signal: ${payload.numberOfPositions} position(s).` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const description = `${intro}\n\n${body}`;

  const reqLines = [
    payload.requirements?.trim(),
    `Trade or discipline alignment: ${positionTitle}.`,
    `Category: ${payload.category}.`,
    `Minimum experience signal (years in request): ${expYears ?? "see CV screening"}.`,
    payload.driverLicense ? `Driver licence signal: ${payload.driverLicense}.` : null,
  ].filter(Boolean);

  const requirements = reqLines.join("\n");

  const baseSlug = slugify(`${payload.category}-${positionTitle}`).slice(0, 72) || "role";
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;

  return {
    slug,
    title,
    description,
    requirements,
    salary_min: salary.min,
    salary_max: salary.max,
    hours,
    rotation,
    license_required: lic,
    housing_provided: housing,
    travel_paid: travel,
    company_name: payload.company.trim(),
    employer_email: payload.email.trim().toLowerCase(),
    location: `${payload.city.trim()}, Norway`,
    category: payload.category.trim(),
    mapped_job_type: mapCategoryToJobType(payload.category),
    experience_years_min: expYears,
  };
}
