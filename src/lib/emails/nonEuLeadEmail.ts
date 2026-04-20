import { buildEmail } from "@/lib/emailTemplate";
import { escapeHtml } from "@/lib/htmlSanitizer";

/** Lead magnet HTML for non-EU candidates who request the free overview. */
export function buildNonEuLeadEmail(firstName: string): string {
  const name = escapeHtml(firstName);

  const section1 = `
    <h2 style="margin:28px 0 12px;font-size:17px;font-weight:700;color:#C9A84C;">What you need to work in Norway legally</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.65;">
      <li style="margin-bottom:8px;">Work permit (<em>oppholdstillatelse</em>) is required before arrival in most cases.</li>
      <li style="margin-bottom:8px;">Applications are handled via <a href="https://www.udi.no" style="color:#C9A84C;">UDI.no</a> (Norwegian Directorate of Immigration).</li>
      <li style="margin-bottom:8px;">Processing time is typically <strong>3–6 months</strong>.</li>
      <li style="margin-bottom:0;">You usually need a <strong>job offer</strong> before you can apply.</li>
    </ul>`;

  const section2 = `
    <h2 style="margin:28px 0 12px;font-size:17px;font-weight:700;color:#C9A84C;">The most common path for non-EU workers</h2>
    <ul style="margin:0;padding-left:20px;line-height:1.65;">
      <li style="margin-bottom:8px;"><strong>Skilled worker permit</strong> (<em>fagarbeider</em>)</li>
      <li style="margin-bottom:8px;"><strong>Seasonal worker permit</strong></li>
      <li style="margin-bottom:0;"><strong>Specialist permit</strong> for trades (electricians, welders, and similar)</li>
    </ul>`;

  const ctaUrl = "https://arbeidmatch.no/dsb-support/non-eu";
  const section3 = `
    <div style="margin:28px 0;padding:22px 20px;border:1px solid rgba(201,168,76,0.4);border-radius:12px;background:rgba(201,168,76,0.08);">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#ffffff;">Want the complete step-by-step guide?</p>
      <p style="margin:0 0 18px;line-height:1.65;color:rgba(255,255,255,0.92);">Our Non-EU Norway Work Guide covers everything: documents, DSB authorization, tax registration, banking, accommodation.</p>
      <a href="${ctaUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;text-align:center;">Get the Full Guide — 39 EUR</a>
    </div>`;

  const body = `
    <p style="margin:0 0 20px;">Hi ${name},</p>
    <p style="margin:0 0 20px;">Here is a practical overview to help you prepare before you apply.</p>
    ${section1}
    ${section2}
    ${section3}`;

  return buildEmail({
    title: "Your free Norway work guide is here",
    preheader: "Everything you need to know before applying",
    body,
    footerNote:
      "ArbeidMatch is a private recruitment agency, not an official Norwegian authority. Always verify requirements with UDI.no and Arbeidstilsynet.no.",
  });
}
