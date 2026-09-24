/**
 * The work location on the request wizard's job basics step.
 *
 * The owner, 24 September 2026: any Norwegian place, not only the towns in the
 * suggestion list. A client in Myre (Oksnes) could not name his own place:
 * typing it offered nothing and there was no way to keep what he typed. The
 * list stays as suggestions; a typed place is kept as it was written.
 */

/** The longest place name kept. Norway's longest names are well under this. */
export const PLACE_MAX_LENGTH = 60;

/**
 * A typed place, cleaned: whitespace collapsed, trimmed, cut to
 * PLACE_MAX_LENGTH, and no markup. "" when nothing usable is left (no letter,
 * or it contains < or >).
 */
export function normalizePlaceName(raw: string | null | undefined): string {
  const value = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  if (/[<>]/.test(value)) return "";
  if (!/\p{L}/u.test(value)) return "";
  return value.slice(0, PLACE_MAX_LENGTH).trim();
}

/** The listed town with the same name, ignoring case, or null. */
export function listedPlace(name: string, list: readonly string[]): string | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return list.find((city) => city.toLowerCase() === key) ?? null;
}

/**
 * The locations after the client adds what he typed. A name that matches a
 * listed town takes the list's spelling; a place already chosen is not added
 * twice. Unusable input leaves the list as it was.
 */
export function addTypedLocation(current: readonly string[], typed: string, list: readonly string[]): string[] {
  const clean = normalizePlaceName(typed);
  if (!clean) return [...current];
  const value = listedPlace(clean, list) ?? clean;
  if (current.some((item) => item.toLowerCase() === value.toLowerCase())) return [...current];
  return [...current, value];
}
