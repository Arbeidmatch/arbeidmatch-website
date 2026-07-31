import { PDFParse } from "pdf-parse";
import { PDFDocument } from "pdf-lib";
import {
  SECTION_ORDER,
  dateRange,
  fullName,
  type CvDocument,
  type TemplateId,
} from "@/lib/cv/schema";
import { SAMPLE_CV } from "@/lib/cv/fixtures/sample-cv";
import { extractEmbeddedCvJson, renderCvPdf } from "@/lib/cv/pdf";

/** Whitespace collapsed so assertions are not defeated by line wrapping in the text layer. */
export function normaliseExtracted(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export interface ParsabilityResult {
  templateId: TemplateId;
  pageCount: number;
  failures: string[];
  text: string;
}

export async function checkTemplateParsability(
  templateId: TemplateId,
  source: CvDocument = SAMPLE_CV,
): Promise<ParsabilityResult> {
  const doc: CvDocument = { ...source, templateId };
  const rendered = await renderCvPdf(doc);
  const buffer = Buffer.from(rendered.bytes);

  const parser = new PDFParse({ data: new Uint8Array(rendered.bytes) });
  let parsed;
  try {
    parsed = await parser.getText();
  } finally {
    await parser.destroy();
  }

  const flat = normaliseExtracted(parsed.text);
  const failures: string[] = [];

  const requirePresent = (needle: string, what: string) => {
    if (!flat.includes(normaliseExtracted(needle))) failures.push(`${what} missing from the text layer: "${needle}"`);
  };

  // Name, email and phone must be on page 1.
  const firstPage = normaliseExtracted(parsed.pages[0]?.text ?? parsed.text);
  for (const [value, what] of [
    [fullName(doc.personal), "Full name"],
    [doc.personal.email, "Email"],
    [doc.personal.phone, "Phone"],
  ] as const) {
    if (!firstPage.includes(normaliseExtracted(value))) failures.push(`${what} is not on page 1`);
  }

  // Section headings: present, exactly once, in the linear order.
  let cursor = -1;
  for (const heading of SECTION_ORDER) {
    const occurrences = flat.split(heading).length - 1;
    if (occurrences === 0) {
      failures.push(`Section heading missing: ${heading}`);
      continue;
    }
    if (occurrences > 1) failures.push(`Section heading appears ${occurrences} times: ${heading}`);
    const index = flat.indexOf(heading);
    if (index < cursor) failures.push(`Section heading out of order: ${heading}`);
    cursor = index;
  }

  // Every role: title, company and dates present, and the title precedes its own dates and bullets.
  for (const entry of doc.experience) {
    requirePresent(entry.jobTitle, "Job title");
    requirePresent(entry.company, "Company");
    const range = dateRange(entry.startDate, entry.endDate);
    requirePresent(range, "Date range");

    const titleIndex = flat.indexOf(normaliseExtracted(entry.jobTitle));
    const rangeIndex = flat.indexOf(normaliseExtracted(range));
    if (titleIndex >= 0 && rangeIndex >= 0 && titleIndex > rangeIndex) {
      failures.push(`Date range is extracted before its job title: ${entry.jobTitle}`);
    }
    for (const bullet of entry.bullets) {
      requirePresent(bullet, "Bullet");
      const bulletIndex = flat.indexOf(normaliseExtracted(bullet));
      if (titleIndex >= 0 && bulletIndex >= 0 && bulletIndex < titleIndex) {
        failures.push(`Bullet is extracted before its job title: ${entry.jobTitle}`);
      }
    }
  }

  for (const skill of doc.skills) requirePresent(skill, "Skill");
  for (const language of doc.languages) requirePresent(language.language, "Language");
  for (const entry of doc.education) requirePresent(entry.qualification, "Qualification");
  for (const entry of doc.certifications) requirePresent(entry.name, "Certification");

  const pdf = await PDFDocument.load(rendered.bytes);
  const pageCount = pdf.getPageCount();
  if (pageCount > 2) failures.push(`PDF is ${pageCount} pages, the limit is 2`);

  const embedded = await extractEmbeddedCvJson(rendered.bytes);
  if (!embedded) {
    failures.push("Embedded JSON attachment is missing");
  } else if (JSON.stringify(embedded) !== JSON.stringify(doc)) {
    failures.push("Embedded JSON attachment does not round trip");
  }

  if (buffer.byteLength > 400 * 1024) {
    failures.push(`PDF is ${Math.round(buffer.byteLength / 1024)} KB, the target is under 400 KB`);
  }

  return { templateId, pageCount, failures, text: flat };
}
