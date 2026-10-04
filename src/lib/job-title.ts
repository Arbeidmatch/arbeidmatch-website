/**
 * The role on its own, with the city taken off the end when the title already
 * carries it.
 *
 * Only a trailing city, separated by a hyphen, a comma or a bare space, and
 * only when something is left over: "Trondheim" alone is the whole role name
 * to whoever wrote it, and a title stripped to nothing is worse than one that
 * repeats itself.
 */
export function roleWithoutCity(title: string | null | undefined, city: string | null | undefined): string {
  const whole = String(title ?? "").trim();
  const place = String(city ?? "").trim();
  if (!whole || !place) return whole;
  const lower = whole.toLowerCase();
  if (!lower.endsWith(place.toLowerCase())) return whole;
  const head = whole.slice(0, whole.length - place.length).replace(/[\s,-]+$/u, "").trim();
  return head || whole;
}
