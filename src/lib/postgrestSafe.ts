/**
 * A visitor's words as one ilike value (ORDER 415, 21 November 2026).
 *
 * Inside a PostgREST or-filter a comma, parenthesis or quote ends the value and
 * starts a clause of the caller's choosing, so they go; % and _ are escaped so
 * they match themselves rather than anything. Null when nothing usable is left.
 */
export function safeIlikePattern(value: string, maxLength = 60): string | null {
  const cleaned = value
    .replace(/[,()"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  if (cleaned.length < 2) return null;
  return `%${cleaned.replace(/[%_]/g, (c) => `\\${c}`)}%`;
}
