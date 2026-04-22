import { escapeHtml } from "@/lib/htmlSanitizer";

export const DSB_CHECKLIST_EMAIL_SUBJECT = "Your Free DSB Document Checklist";

const CHECKLIST_ITEMS = [
  "CV with dated education and work experience",
  "Original school diploma or certificate",
  "Professional authorization from your home country",
  "Employer references (min. 1 year experience, last 10 years)",
  "Valid passport or national ID",
  "Authorized translations (if not in English/Swedish/Danish)",
];

/** Inner HTML only for dark `buildEmail` — flat structure, no nested layout tables. */
export function buildDsbChecklistEmailBodyHtml(firstName: string) {
  const display = (firstName || "").trim() || "there";
  const safeName = escapeHtml(display);
  const items = CHECKLIST_ITEMS.map(
    (item) =>
      `<li style="margin-bottom:8px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.88);">${escapeHtml(item)}</li>`,
  ).join("");
  const ctaUrl = "https://arbeidmatch.no/electricians-norway?section=dsb";

  return [
    `<p style="margin:0 0 20px;line-height:1.8;font-size:14px;color:rgba(255,255,255,0.92);">Hi ${safeName},</p>`,
    `<p style="margin:0 0 20px;line-height:1.8;font-size:14px;color:rgba(255,255,255,0.92);">Here is your free DSB authorization document checklist.</p>`,
    `<ul style="margin:0 0 20px;padding-left:20px;">${items}</ul>`,
    `<p style="margin:0 0 20px;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75);"><strong>Note:</strong> ${escapeHtml(
      "All documents must be in PDF format.",
    )}</p>`,
    `<p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#C9A84C;">Ready for the complete guide?</p>`,
    `<p style="margin:0 0 20px;text-align:center;"><a href="${escapeHtml(
      ctaUrl,
    )}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;">Get the Full DSB Guide</a></p>`,
    `<p style="margin:0;font-size:12px;line-height:1.65;color:rgba(255,255,255,0.45);">${escapeHtml(
      "If the button does not work, reply to this email and we will help you on business days.",
    )}</p>`,
  ].join("");
}
