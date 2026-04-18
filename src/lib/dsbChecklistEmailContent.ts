export const DSB_CHECKLIST_EMAIL_SUBJECT = "Your Free DSB Document Checklist — ArbeidMatch";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDsbChecklistEmailHtml(firstName: string) {
  const safe = escapeHtml(firstName);

  return `
    <div style="background:#ffffff;padding:24px;">
      <div style="max-width:600px;margin:0 auto;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;">
        <div style="padding-bottom:14px;margin-bottom:20px;border-bottom:1px solid #ececec;">
          <div style="font-size:24px;font-weight:700;color:#B8860B;">ArbeidMatch</div>
        </div>

        <p style="margin:0 0 12px 0;">Hi ${safe},</p>
        <p style="margin:0 0 18px 0;">Here is your free DSB Authorization Document Checklist.</p>

        <p style="margin:0 0 8px 0;font-weight:700;color:#1a1a1a;">DOCUMENTS YOU NEED TO GATHER:</p>
        <ul style="margin:0 0 18px 0;padding-left:22px;color:#1a1a1a;">
          <li style="margin:0 0 8px 0;">CV with dated education and work experience</li>
          <li style="margin:0 0 8px 0;">Original school diploma or certificate including grades and curriculum</li>
          <li style="margin:0 0 8px 0;">Copy of your professional authorization or license from your home country</li>
          <li style="margin:0 0 8px 0;">Employer references proving at least 1 year of practical experience in the last 10 years</li>
          <li style="margin:0 0 8px 0;">Valid passport or national ID card</li>
          <li style="margin:0 0 8px 0;">Authorized translations of all documents not in English, Swedish or Danish</li>
        </ul>

        <p style="margin:0 0 8px 0;font-weight:700;color:#1a1a1a;">THINGS TO KEEP IN MIND:</p>
        <p style="margin:0 0 16px 0;">
          All files must be submitted in PDF format. Your practical experience must be from outside Norway.
          Processing times vary depending on your application type, and there is an official government fee to pay when you submit.
        </p>

        <div style="margin:18px 0;padding:16px;border:1px solid #e8d9b2;background:#fffaf0;border-radius:8px;">
          <p style="margin:0 0 8px 0;font-weight:700;color:#1a1a1a;">Ready for the next step?</p>
          <p style="margin:0 0 10px 0;">Our complete DSB Authorization Guide walks you through each stage in detail.</p>
          <a href="https://arbeidmatch.no/dsb-support" style="color:#B8860B;text-decoration:underline;">arbeidmatch.no/dsb-support</a>
        </div>

        <p style="margin:16px 0 0 0;">ArbeidMatch Norge AS</p>

        <hr style="border:none;border-top:1px solid #ececec;margin:20px 0;" />
        <p style="margin:0;font-size:12px;color:#666666;">
          You received this because you requested our free DSB checklist.
          Reply with "unsubscribe" to stop receiving emails from us.
        </p>
        </div>
      </div>
    </div>
  `;
}
