/**
 * EU/EEA DSB document checklist excerpted from docs/dsb-guide-eu.md (Step 3).
 * Used in confirmation emails for /dsb-checklist leads.
 */
export const DSB_EU_DOCUMENT_CHECKLIST_ITEMS: string[] = [
  "CV describing your personal data, education with dates and relevant practical experience in the profession you are applying for",
  "Copy of original school report or diploma including a list of subjects, transcript of grades and curriculum",
  "Copy of translated school report or diploma (if not in English, Swedish or Danish)",
  "Copy of original authorization, permission or certificate of competence to practice the profession in your home country",
  "Copy of translated authorization or certificate of competence (if applicable)",
  "Copy of original references from current or former employers proving at least one year of practical experience in the profession during the previous 10 years after graduation (experience must be from outside Norway)",
  "Copy of translated references (if not in English, Swedish or Danish)",
  "Copy of valid passport or national identity card issued by an EU/EEA or EFTA state",
];

export const DSB_SUBMISSION_NOTES = [
  "All documents must be submitted in PDF format.",
  "Documents not written in English, Swedish or Danish must be translated by an authorized translator (primarily English, secondarily Norwegian).",
  "Online portal (recommended): profapp.dsb.no · Email: postmottak@dsb.no",
  "From Jan 1, 2025, DSB processing fee: 3,200 NOK for the first profession; 2,400 NOK for each additional profession in the same application (payable to DSB directly).",
];

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDsbChecklistEmailHtml(firstName: string) {
  const safe = escapeHtml(firstName);
  const listItems = DSB_EU_DOCUMENT_CHECKLIST_ITEMS.map(
    (item, i) => `<li style="margin:0 0 10px 0;">${i + 1}. ${escapeHtml(item)}</li>`,
  ).join("");
  const notes = DSB_SUBMISSION_NOTES.map((n) => `<p style="margin:0 0 8px 0;">${escapeHtml(n)}</p>`).join("");

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#0a0f14;padding:24px;color:#e8ecf2;">
      <div style="max-width:640px;margin:0 auto;background:#111a24;border-radius:12px;border:1px solid rgba(201,168,76,0.35);overflow:hidden;">
        <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
          <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
          <div style="margin-top:8px;color:#DDE3ED;font-size:15px;">Your DSB Authorization Checklist (EU/EEA)</div>
        </div>
        <div style="padding:22px;">
          <p style="margin:0 0 14px 0;font-size:16px;">Hi ${safe},</p>
          <p style="margin:0 0 16px 0;line-height:1.55;color:#c9d2de;">
            Here is the complete document checklist for EU/EEA electricians applying for DSB approval in Norway.
          </p>
          <p style="margin:0 0 10px 0;font-weight:700;color:#C9A84C;">Required documents for all EU/EEA applicants</p>
          <ol style="margin:0;padding-left:18px;line-height:1.45;color:#e8ecf2;">${listItems}</ol>
          <div style="margin-top:18px;padding:14px;border-radius:8px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);font-size:13px;color:#c9d2de;">
            ${notes}
          </div>
          <p style="margin:20px 0 0 0;font-size:12px;color:#8a96a8;">
            This email is informational only and does not constitute legal advice. Verify current requirements with DSB before submitting.
          </p>
        </div>
      </div>
    </div>
  `;
}
