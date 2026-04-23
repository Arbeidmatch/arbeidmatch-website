import { escapeHtml } from "@/lib/htmlSanitizer";

export type PartnerDraftData = {
  companyName: string;
  orgNumber: string;
  contactName: string;
  contactTitle?: string;
  contactEmail: string;
};

type PartnerEmailDraft = {
  subject: string;
  html: string;
  text: string;
};

const PLACEHOLDER_PATTERN = /\{\{(company_name|org_number|contact_name|contact_title|contact_email|date_no|date_en)\}\}/g;

const OFFER_SUBJECT = "ArbeidMatch offer for {{company_name}}";
const OFFER_HTML = `
<p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.6);">Issued by ArbeidMatch Norge AS, Org.nr 935 667 089 MVA, Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
<p style="margin:0 0 18px;font-size:14px;color:rgba(255,255,255,0.6);">To {{company_name}} (Org.nr {{org_number}}), Att: {{contact_name}}{{contact_title}} | Date: {{date_no}}</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Kjære {{contact_name}},</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Takk for din interesse i våre tjenester. Vi presenterer herved følgende tilbud for kandidatsourcing og screening på vegne av {{company_name}}.</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);"><strong>Priser:</strong> Sourcing-honorar: NOK 10 000 per kandidat (ekskl. mva.)</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Honoraret forfaller kun ved signering av arbeids- eller oppdragsavtale mellom din bedrift og introdusert kandidat.</p>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Tilbudet er gyldig i 14 dager fra utstedelsesdato.</p>
<div style="margin:22px 0;padding:16px;border:1px solid rgba(201,168,76,0.35);border-radius:12px;background:rgba(255,255,255,0.03);">
  <p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.82);"><strong>Aksept og elektronisk signatur</strong></p>
  <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.72);">Ved å apăsa Semnez, confirmi că oferta a fost citită și acceptată, iar contractul complet va fi trimis imediat pentru semnătură electronică.</p>
</div>
<hr style="border:none;border-top:1px solid rgba(201,168,76,0.2);margin:26px 0;" />
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);"><strong>ENGLISH VERSION</strong></p>
<p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.6);">Issued by ArbeidMatch Norge AS, Org.nr 935 667 089 MVA, Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
<p style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.6);">To {{company_name}} (Org.nr {{org_number}}), Attention: {{contact_name}}{{contact_title}} | Date: {{date_en}}</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Dear {{contact_name}},</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Thank you for your interest in our services. We are pleased to present the following offer for candidate sourcing and screening on behalf of {{company_name}}.</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);"><strong>Pricing:</strong> Sourcing fee: NOK 10,000 per candidate (VAT excl.)</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">The fee is payable only upon signing of an employment or engagement contract between your company and the introduced candidate.</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">Signed on behalf of: {{company_name}} | {{contact_name}}{{contact_title}} | {{contact_email}}</p>
`;
const OFFER_TEXT = [
  "NORSK VERSJON",
  "Issued by ArbeidMatch Norge AS, Org.nr 935 667 089 MVA.",
  "To {{company_name}} (Org.nr {{org_number}}), Att: {{contact_name}}{{contact_title}}. Dato: {{date_no}}.",
  "",
  "Kjære {{contact_name}},",
  "Takk for din interesse i våre tjenester.",
  "Sourcing-honorar: NOK 10 000 per kandidat (ekskl. mva.).",
  "Tilbudet er gyldig i 14 dager fra utstedelsesdatoen.",
  "",
  "ENGLISH VERSION",
  "To {{company_name}} (Org.nr {{org_number}}), Attention: {{contact_name}}{{contact_title}}. Date: {{date_en}}.",
  "Dear {{contact_name}},",
  "Sourcing fee: NOK 10,000 per candidate (VAT excl.).",
  "This offer is valid for 14 days from the date of issue.",
  "",
  "Contact email on file: {{contact_email}}",
].join("\n");

const CONTRACT_SUBJECT = "ArbeidMatch contract draft for {{company_name}}";
const CONTRACT_HTML = `
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Hello {{contact_name}},
</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Attached below is the contract draft context for <strong>{{company_name}}</strong> (Org. {{org_number}}).
</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Replace this section with your legal contract terms or instructions for signing.
</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Primary contact email: {{contact_email}}
</p>
`;
const CONTRACT_TEXT = [
  "Hello {{contact_name}},",
  "",
  "Contract draft context for {{company_name}} (Org. {{org_number}}).",
  "Replace this text with your legal contract terms or signing instructions.",
  "",
  "Primary contact email: {{contact_email}}",
].join("\n");

function fillTemplate(template: string, data: PartnerDraftData): string {
  const todayNo = new Date().toLocaleDateString("nb-NO");
  const todayEn = new Date().toLocaleDateString("en-GB");
  const map: Record<string, string> = {
    company_name: data.companyName || "Company",
    org_number: data.orgNumber || "N/A",
    contact_name: data.contactName || "Partner Contact",
    contact_title: data.contactTitle ? `, ${data.contactTitle}` : "",
    contact_email: data.contactEmail || "",
    date_no: todayNo,
    date_en: todayEn,
  };
  return template.replace(PLACEHOLDER_PATTERN, (_, key: string) => map[key] ?? "");
}

function fillTemplateEscaped(template: string, data: PartnerDraftData): string {
  const todayNo = new Date().toLocaleDateString("nb-NO");
  const todayEn = new Date().toLocaleDateString("en-GB");
  const map: Record<string, string> = {
    company_name: escapeHtml(data.companyName || "Company"),
    org_number: escapeHtml(data.orgNumber || "N/A"),
    contact_name: escapeHtml(data.contactName || "Partner Contact"),
    contact_title: data.contactTitle ? `, ${escapeHtml(data.contactTitle)}` : "",
    contact_email: escapeHtml(data.contactEmail || ""),
    date_no: escapeHtml(todayNo),
    date_en: escapeHtml(todayEn),
  };
  return template.replace(PLACEHOLDER_PATTERN, (_, key: string) => map[key] ?? "");
}

export function buildPartnerOfferDraft(
  data: PartnerDraftData & { acceptUrl: string; declineUrl: string },
): PartnerEmailDraft {
  const actionButtons = `
  <div style="margin-top:26px;display:flex;gap:12px;flex-wrap:wrap;">
    <a href="${escapeHtml(data.acceptUrl)}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;padding:12px 24px;">Semnez</a>
    <a href="${escapeHtml(data.declineUrl)}" style="display:inline-block;border:1px solid rgba(255,255,255,0.35);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;padding:12px 24px;">Refuz</a>
  </div>`;

  return {
    subject: fillTemplate(OFFER_SUBJECT, data),
    html: fillTemplateEscaped(OFFER_HTML, data) + actionButtons,
    text: fillTemplate(OFFER_TEXT, data),
  };
}

export function buildPartnerContractDraft(data: PartnerDraftData): PartnerEmailDraft {
  return {
    subject: fillTemplate(CONTRACT_SUBJECT, data),
    html: fillTemplateEscaped(CONTRACT_HTML, data),
    text: fillTemplate(CONTRACT_TEXT, data),
  };
}

