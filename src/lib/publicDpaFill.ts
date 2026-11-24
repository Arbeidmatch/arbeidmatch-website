import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { text, type SiteNumbers } from "@/lib/numbers";
import { COMPANY } from "@/lib/sitePolicies";

/**
 * The public /dpa page shows the platform's template, which is filled in for
 * one partner only when that partner accepts it. Until ORDER 424 (23 November
 * 2026) the page showed the raw {{PROCESSOR_ORG_NUMBER}}-style placeholders.
 * Our own details are the ones in Enhetsregisteret, read from RecOS
 * (company_org_number, company_street_address; ORDER 302); the partner's and
 * the acceptance's fields read as plain bracketed labels, since the public page
 * belongs to no partner. A detail RecOS did not give reads as its label too.
 */

function own(numbers: SiteNumbers): Record<string, string> {
  const out: Record<string, string> = { PROCESSOR_SIGNATORY_LINE: "Authorized representative" };
  const org = text(numbers, "company_org_number");
  const street = text(numbers, "company_street_address");
  if (org) out.PROCESSOR_ORG_NUMBER = org;
  if (street) out.PROCESSOR_REGISTERED_ADDRESS = `${street}, ${COMPANY.postcodeTown}, Norway`;
  return out;
}

const PLACEHOLDER = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

export function fillPublicDpaText(text: string, numbers: SiteNumbers): string {
  const OWN = own(numbers);
  return text.replace(PLACEHOLDER, (_m, key: string) => OWN[key] ?? `[${key.toLowerCase().replace(/_/g, " ")}]`);
}

export function fillPublicDpa(doc: AtsLegalDocumentJson, numbers: SiteNumbers): AtsLegalDocumentJson {
  return {
    ...doc,
    content_html: typeof doc.content_html === "string" ? fillPublicDpaText(doc.content_html, numbers) : doc.content_html,
    content_md: typeof doc.content_md === "string" ? fillPublicDpaText(doc.content_md, numbers) : doc.content_md,
  };
}
