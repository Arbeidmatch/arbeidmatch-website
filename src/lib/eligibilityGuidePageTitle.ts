export type WorkGuideTitleInput = {
  targetCountry: string;
  targetRegion: "" | "Scandinavia" | "Europe";
  urlRegion: string | null;
  urlCountry: string | null;
};

function normalizeUrlRegion(value: string | null | undefined): "Scandinavia" | "Europe" | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "scandinavia") return "Scandinavia";
  if (v === "europe") return "Europe";
  return null;
}

/** Region or country label used in "Work in … - Guide" (fallback: Europe). */
export function resolveWorkGuidePlace(input: WorkGuideTitleInput): string {
  const country = input.targetCountry.trim();
  if (country.length > 0) return country;

  if (input.targetRegion === "Scandinavia" || input.targetRegion === "Europe") {
    return input.targetRegion;
  }

  const urlCountry = input.urlCountry?.trim();
  if (urlCountry) return urlCountry;

  const urlRegion = normalizeUrlRegion(input.urlRegion);
  if (urlRegion) return urlRegion;

  return "Europe";
}

export function getWorkGuidePageTitle(input: WorkGuideTitleInput): string {
  return `Work in ${resolveWorkGuidePlace(input)}: Guide`;
}

export function getWorkGuidePageDescription(place: string): string {
  return `Guidance for working in ${place}: get notified when our step-by-step guide is ready, and understand the procedures if you do not yet have EU/EEA work rights. ArbeidMatch.`;
}

export function getWorkGuidePageMetadata(input: WorkGuideTitleInput): { title: string; description: string } {
  const place = resolveWorkGuidePlace(input);
  return {
    title: getWorkGuidePageTitle(input),
    description: getWorkGuidePageDescription(place),
  };
}
