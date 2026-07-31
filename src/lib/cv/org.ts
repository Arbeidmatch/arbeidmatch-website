/** Controller details, used in consent copy, emails and the privacy section. */
export const CV_CONTROLLER = {
  name: "ArbeidMatch Norge AS",
  orgNumber: "935 667 089",
  address: "Sverre Svendsens veg 38, 7056 Ranheim",
  country: "Norway",
} as const;

export const CV_SUPPORT_EMAIL = "post@arbeidmatch.no";

export function controllerFooter(): string {
  return `${CV_CONTROLLER.name}, org.nr. ${CV_CONTROLLER.orgNumber}, ${CV_CONTROLLER.address}, ${CV_CONTROLLER.country}`;
}

export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.arbeidmatch.no";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).origin;
  } catch {
    return "https://www.arbeidmatch.no";
  }
}
