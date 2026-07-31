import {
  MONTH_YEAR_RE,
  PHONE_RE,
  SECTION_HEADINGS,
  dateRange,
  fullName,
  looksLikeNationalId,
  type CvDocument,
} from "@/lib/cv/schema";

export type AtsRuleId =
  | "phone-format"
  | "email-present"
  | "recent-role-bullets"
  | "no-long-gaps"
  | "skills-count"
  | "date-format"
  | "summary-length"
  | "allowed-characters"
  | "length-two-pages"
  | "no-national-id";

export interface AtsRuleResult {
  id: AtsRuleId;
  label: string;
  passed: boolean;
  weight: number;
  /** Shown only when the rule fails. Tells the user what to change. */
  fix: string;
}

export interface AtsReport {
  score: number;
  results: AtsRuleResult[];
  failures: AtsRuleResult[];
}

/**
 * Characters that do not survive PDF text extraction cleanly: long dashes, curly
 * quotes, ellipsis, non-breaking space, bullet glyph and tab. Declared as code points
 * so the source file itself stays plain ASCII.
 */
const FORBIDDEN_CODE_POINTS = new Set([
  0x2014, 0x2013, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x00a0, 0x2022, 0x0009,
]);

function monthYearToIndex(value: string): number | null {
  if (value === "Present") return Number.POSITIVE_INFINITY;
  if (!MONTH_YEAR_RE.test(value)) return null;
  const [month, year] = value.split("/").map(Number);
  return year * 12 + (month - 1);
}

/** Longest unexplained gap between roles, in months. Education periods do not count as gaps. */
export function longestGapMonths(doc: CvDocument): number {
  const periods = doc.experience
    .map((entry) => ({
      start: monthYearToIndex(entry.startDate),
      end: monthYearToIndex(entry.endDate),
    }))
    .filter((p): p is { start: number; end: number } => p.start !== null && p.end !== null)
    .sort((a, b) => a.start - b.start);

  if (periods.length < 2) return 0;

  let longest = 0;
  let coveredUntil = periods[0].end;
  for (let i = 1; i < periods.length; i += 1) {
    if (periods[i].start > coveredUntil) {
      longest = Math.max(longest, periods[i].start - coveredUntil);
    }
    coveredUntil = Math.max(coveredUntil, periods[i].end);
  }
  return Number.isFinite(longest) ? longest : 0;
}

/**
 * Rough page estimate from the linearised text. Deliberately conservative: it is a
 * warning for the user, while the real page count is asserted against the rendered PDF.
 */
export function estimatePageCount(doc: CvDocument): number {
  const lines = linearise(doc).split("\n");
  const visualLines = lines.reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 95)), 0);
  return Math.max(1, Math.ceil(visualLines / 52));
}

function everyDateValid(doc: CvDocument): boolean {
  const values: string[] = [];
  for (const entry of doc.experience) values.push(entry.startDate, entry.endDate);
  for (const entry of doc.education) values.push(entry.startDate, entry.endDate);
  for (const entry of doc.certifications) {
    if (entry.issued) values.push(entry.issued);
    if (entry.expires) values.push(entry.expires);
  }
  return values.every((value) => value === "Present" || MONTH_YEAR_RE.test(value));
}

function containsNationalId(doc: CvDocument): boolean {
  const haystack = [
    doc.summary,
    ...doc.experience.flatMap((entry) => entry.bullets),
    ...doc.education.map((entry) => entry.details ?? ""),
    doc.coverLetter?.body ?? "",
  ].join(" ");
  return looksLikeNationalId(haystack);
}

function containsForbiddenChars(doc: CvDocument): boolean {
  const haystack = [
    doc.summary,
    doc.personal.headline,
    ...doc.experience.flatMap((entry) => [entry.jobTitle, entry.company, ...entry.bullets]),
    ...doc.skills,
    doc.coverLetter?.body ?? "",
  ].join(" ");
  for (const char of haystack) {
    const code = char.codePointAt(0);
    if (code !== undefined && FORBIDDEN_CODE_POINTS.has(code)) return true;
  }
  return false;
}

export function evaluateAts(doc: CvDocument): AtsReport {
  const mostRecent = [...doc.experience].sort((a, b) => {
    const aEnd = monthYearToIndex(a.endDate) ?? 0;
    const bEnd = monthYearToIndex(b.endDate) ?? 0;
    return bEnd - aEnd;
  })[0];

  const gap = longestGapMonths(doc);
  const pages = estimatePageCount(doc);
  const summaryLength = doc.summary.trim().length;

  const results: AtsRuleResult[] = [
    {
      id: "email-present",
      label: "Email address on the CV",
      weight: 12,
      passed: doc.personal.email.includes("@"),
      fix: "Add a working email address. It is the first thing a recruiter copies out of your CV.",
    },
    {
      id: "phone-format",
      label: "Phone number in international format",
      weight: 12,
      passed: PHONE_RE.test(doc.personal.phone.replace(/\s/g, "")),
      fix: "Write your number with the country code, for example +47 96734730.",
    },
    {
      id: "recent-role-bullets",
      label: "At least 3 bullets on your most recent role",
      weight: 14,
      passed: (mostRecent?.bullets.length ?? 0) >= 3,
      fix: "Describe your most recent job with at least 3 bullets. Say what you did, not just the job title.",
    },
    {
      id: "no-long-gaps",
      label: "No unexplained gap over 12 months",
      weight: 10,
      passed: gap <= 12,
      fix: `There is a gap of about ${gap} months between two roles. Add a short entry explaining it, for example a course or a period abroad.`,
    },
    {
      id: "skills-count",
      label: "6 or more skills listed",
      weight: 10,
      passed: doc.skills.length >= 6,
      fix: "List at least 6 skills. Use the words an employer would search for, such as the tools and materials you work with.",
    },
    {
      id: "date-format",
      label: "All dates written as MM/YYYY",
      weight: 12,
      passed: everyDateValid(doc),
      fix: "Write every date as MM/YYYY, for example 03/2021. Parsers cannot read free text dates.",
    },
    {
      id: "summary-length",
      label: "Summary between 300 and 800 characters",
      weight: 10,
      passed: summaryLength >= 300 && summaryLength <= 800,
      fix:
        summaryLength < 300
          ? `Your summary is ${summaryLength} characters. Aim for 300 to 800 so it carries real keywords.`
          : `Your summary is ${summaryLength} characters. Cut it back to 800 or fewer.`,
    },
    {
      id: "allowed-characters",
      label: "No characters that break text extraction",
      weight: 8,
      passed: !containsForbiddenChars(doc),
      fix: "Replace long dashes, curly quotes and tab characters with plain hyphens, straight quotes and spaces.",
    },
    {
      id: "length-two-pages",
      label: "Fits on 2 pages",
      weight: 6,
      passed: pages <= 2,
      fix: "Your CV is heading past 2 pages. Shorten older roles to 2 bullets each.",
    },
    {
      id: "no-national-id",
      label: "No national identity number",
      weight: 6,
      passed: !containsNationalId(doc),
      fix: "Remove your national identity number. Norwegian employers must not receive it in a CV.",
    },
  ];

  const totalWeight = results.reduce((sum, rule) => sum + rule.weight, 0);
  const earned = results.reduce((sum, rule) => sum + (rule.passed ? rule.weight : 0), 0);

  return {
    score: Math.round((earned / totalWeight) * 100),
    results,
    failures: results.filter((rule) => !rule.passed),
  };
}

/**
 * The exact linear text a parser should extract, in render-tree order.
 * Powers the "Show ATS text view" toggle in the builder and the ordering assertions
 * in the parsability test suite.
 */
export function linearise(doc: CvDocument): string {
  const lines: string[] = [];
  const { personal } = doc;

  lines.push(fullName(personal));
  lines.push(personal.headline);
  lines.push([personal.city, personal.country].filter(Boolean).join(", "));
  lines.push(personal.phone);
  lines.push(personal.email);
  if (personal.linkedin) lines.push(personal.linkedin);
  if (personal.portfolio) lines.push(personal.portfolio);

  lines.push("", SECTION_HEADINGS.summary, doc.summary);

  lines.push("", SECTION_HEADINGS.experience);
  for (const entry of doc.experience) {
    lines.push(entry.jobTitle);
    lines.push([entry.company, entry.city, entry.country].join(", "));
    lines.push(dateRange(entry.startDate, entry.endDate));
    for (const bullet of entry.bullets) lines.push(`- ${bullet}`);
    lines.push("");
  }

  if (doc.education.length > 0) {
    lines.push(SECTION_HEADINGS.education);
    for (const entry of doc.education) {
      lines.push(entry.qualification);
      lines.push([entry.institution, entry.city, entry.country].join(", "));
      lines.push(dateRange(entry.startDate, entry.endDate));
      if (entry.details) lines.push(entry.details);
      lines.push("");
    }
  }

  if (doc.certifications.length > 0) {
    lines.push(SECTION_HEADINGS.certifications);
    for (const entry of doc.certifications) {
      const parts = [entry.name];
      if (entry.issuer) parts.push(entry.issuer);
      if (entry.issued) parts.push(entry.expires ? `${entry.issued} - ${entry.expires}` : entry.issued);
      lines.push(parts.join(", "));
    }
    lines.push("");
  }

  lines.push(SECTION_HEADINGS.skills);
  lines.push(doc.skills.join(", "));

  lines.push("", SECTION_HEADINGS.languages);
  lines.push(doc.languages.map((entry) => `${entry.language}: ${entry.level}`).join(", "));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
