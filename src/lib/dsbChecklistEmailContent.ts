import { escapeHtml } from "@/lib/htmlSanitizer";
import {
  emailCtaSection,
  emailDataTable,
  emailNoteBox,
  emailParagraph,
  emailSupportAfterCta,
  premiumCtaButton,
} from "@/lib/emailPremiumTemplate";

export const DSB_CHECKLIST_EMAIL_SUBJECT = "Your Free DSB Document Checklist";

const CHECKLIST_ITEMS = [
  "CV with dated education and work experience",
  "Original school diploma or certificate",
  "Professional authorization from your home country",
  "Employer references (min. 1 year experience, last 10 years)",
  "Valid passport or national ID",
  "Authorized translations (if not in English/Swedish/Danish)",
];

/** Inner HTML only — wrap with `wrapPremiumEmail` when sending. */
export function buildDsbChecklistEmailBodyHtml(firstName: string) {
  const display = (firstName || "").trim() || "there";
  const safeName = escapeHtml(display);
  const rows = CHECKLIST_ITEMS.map((item) => ({ label: "✓", value: item }));

  return [
    emailParagraph(`Hi ${safeName},`),
    emailParagraph("Here is your free DSB authorization document checklist."),
    emailDataTable(rows),
    emailNoteBox("<strong>Note:</strong> All documents must be in PDF format."),
    emailCtaSection("Ready for the complete guide?", premiumCtaButton("https://arbeidmatch.no/dsb-support", "Get the Full DSB Guide")),
    emailSupportAfterCta(),
  ].join("");
}
