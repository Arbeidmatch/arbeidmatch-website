import { cachedSiteNumbers, text, type SiteNumbers } from "@/lib/numbers";

/**
 * Controller details, used in consent copy, emails and the privacy section.
 * The org number and the street are RecOS's (company_org_number,
 * company_street_address; ORDER 302). The CV documents and letters are built
 * synchronously, so they read what the server last fetched: the routes that
 * build them call getSiteNumbers() first. A missing one is left out.
 */
export const CV_CONTROLLER_NAME = "ArbeidMatch Norge AS";

export type CvController = { name: string; orgNumber: string | null; address: string | null; country: string };

export function cvController(numbers: SiteNumbers = cachedSiteNumbers()): CvController {
  const street = text(numbers, "company_street_address");
  return {
    name: CV_CONTROLLER_NAME,
    orgNumber: text(numbers, "company_org_number"),
    address: street ? `${street}, 7056 Ranheim` : null,
    country: "Norway",
  };
}

export function controllerFooter(numbers?: SiteNumbers): string {
  const c = cvController(numbers);
  return [c.name, c.orgNumber ? `org.nr. ${c.orgNumber}` : null, c.address, c.country].filter(Boolean).join(", ");
}

export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.arbeidmatch.no";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).origin;
  } catch {
    return "https://www.arbeidmatch.no";
  }
}
