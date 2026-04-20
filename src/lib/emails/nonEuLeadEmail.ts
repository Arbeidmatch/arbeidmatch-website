import { buildEmail, emailBodyParagraph } from "@/lib/emailTemplate";
import { escapeHtml } from "@/lib/htmlSanitizer";

/** Lead magnet HTML for non-EU candidates who request the free overview. */
export function buildNonEuLeadEmail(firstName: string): string {
  const name = escapeHtml(firstName);
  const li = "margin-bottom:8px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.85);";
  const heading = "margin:0 0 10px;font-size:15px;font-weight:600;color:#C9A84C;";

  const section1 = `<p style="${heading}">What you need to work in Norway legally</p>
<ul style="margin:0 0 20px;padding-left:20px;">
<li style="${li}">Work permit (<em>oppholdstillatelse</em>) is required before arrival in most cases.</li>
<li style="${li}">Applications are handled via <a href="https://www.udi.no" style="color:#C9A84C;">UDI.no</a> (Norwegian Directorate of Immigration).</li>
<li style="${li}">Processing time is typically <strong>3–6 months</strong>.</li>
<li style="margin-bottom:0;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.85);">You usually need a <strong>job offer</strong> before you can apply.</li>
</ul>`;

  const section2 = `<p style="${heading}">The most common path for non-EU workers</p>
<ul style="margin:0 0 20px;padding-left:20px;">
<li style="${li}"><strong>Skilled worker permit</strong> (<em>fagarbeider</em>)</li>
<li style="${li}"><strong>Seasonal worker permit</strong></li>
<li style="margin-bottom:0;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.85);"><strong>Specialist permit</strong> for trades (electricians, welders, and similar)</li>
</ul>`;

  const ctaUrl = "https://arbeidmatch.no/dsb-support/non-eu";
  const section3 = `<p style="${heading}">Want the complete step-by-step guide?</p>
<p style="margin:0 0 16px;font-size:13px;line-height:1.8;color:rgba(255,255,255,0.8);">Our Non-EU Norway Work Guide covers everything: documents, DSB authorization, tax registration, banking, accommodation.</p>
<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;">Get the Full Guide — 39 EUR</a>`;

  const body = `${emailBodyParagraph(`Hi ${name},`)}
${emailBodyParagraph("Here is a practical overview to help you prepare before you apply.")}
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
