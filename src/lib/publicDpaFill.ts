import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { COMPANY } from "@/lib/sitePolicies";

/**
 * The public /dpa page shows the platform's template, which is filled in for
 * one partner only when that partner accepts it. Until ORDER 424 (23 November
 * 2026) the page showed the raw {{PROCESSOR_ORG_NUMBER}}-style placeholders.
 * Our own details are filled from Enhetsregisteret (org.nr 935 667 089,
 * forretningsadresse Sverre Svendsens veg 38, 7056 Ranheim); the partner's and
 * the acceptance's fields read as plain bracketed labels, since the public page
 * belongs to no partner.
 */

const OWN: Record<string, string> = {
  PROCESSOR_ORG_NUMBER: COMPANY.orgNumber,
  PROCESSOR_REGISTERED_ADDRESS: `${COMPANY.address}, Norway`,
  PROCESSOR_SIGNATORY_LINE: "Authorized representative",
};

const PLACEHOLDER = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

export function fillPublicDpaText(text: string): string {
  return text.replace(PLACEHOLDER, (_m, key: string) => OWN[key] ?? `[${key.toLowerCase().replace(/_/g, " ")}]`);
}

export function fillPublicDpa(doc: AtsLegalDocumentJson): AtsLegalDocumentJson {
  return {
    ...doc,
    content_html: typeof doc.content_html === "string" ? fillPublicDpaText(doc.content_html) : doc.content_html,
    content_md: typeof doc.content_md === "string" ? fillPublicDpaText(doc.content_md) : doc.content_md,
  };
}
