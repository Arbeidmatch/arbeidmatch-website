import { escapeHtml } from "@/lib/htmlSanitizer";

export type PartnerDraftData = {
  companyName: string;
  orgNumber: string;
  contactName: string;
  contactEmail: string;
};

type PartnerEmailDraft = {
  subject: string;
  html: string;
  text: string;
};

const PLACEHOLDER_PATTERN = /\{\{(company_name|org_number|contact_name|contact_email)\}\}/g;

const OFFER_SUBJECT = "ArbeidMatch offer for {{company_name}}";
const OFFER_HTML = `
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Hello {{contact_name}},
</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Thank you for your request from <strong>{{company_name}}</strong> (Org. {{org_number}}).
</p>
<p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
This is our draft offer. You can replace this paragraph with your final commercial details.
</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
Contact email on file: {{contact_email}}
</p>
`;
const OFFER_TEXT = [
  "Hello {{contact_name}},",
  "",
  "Thank you for your request from {{company_name}} (Org. {{org_number}}).",
  "This is our draft offer. Replace this text with your final commercial details.",
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
  const map: Record<string, string> = {
    company_name: data.companyName || "Company",
    org_number: data.orgNumber || "N/A",
    contact_name: data.contactName || "Partner Contact",
    contact_email: data.contactEmail || "",
  };
  return template.replace(PLACEHOLDER_PATTERN, (_, key: string) => map[key] ?? "");
}

function fillTemplateEscaped(template: string, data: PartnerDraftData): string {
  const map: Record<string, string> = {
    company_name: escapeHtml(data.companyName || "Company"),
    org_number: escapeHtml(data.orgNumber || "N/A"),
    contact_name: escapeHtml(data.contactName || "Partner Contact"),
    contact_email: escapeHtml(data.contactEmail || ""),
  };
  return template.replace(PLACEHOLDER_PATTERN, (_, key: string) => map[key] ?? "");
}

export function buildPartnerOfferDraft(data: PartnerDraftData): PartnerEmailDraft {
  return {
    subject: fillTemplate(OFFER_SUBJECT, data),
    html: fillTemplateEscaped(OFFER_HTML, data),
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

