export type HiringModel = "staffing" | "recruitment" | null;

export function contractLabel(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw) return null;
  if (raw === "permanent" || raw.startsWith("permanent ") || raw === "fast" || raw.startsWith("fast ")) return "Fast";
  if (raw === "temporary" || raw.startsWith("temporary ") || raw === "contract" || raw.startsWith("contract ") || raw === "midlertidig") return "Temporary";
  if (raw === "substitute" || raw.startsWith("substitute ") || raw === "vikariat") return "Vikariat";
  if (raw === "seasonal" || raw.startsWith("seasonal ") || raw === "sesong" || raw === "sesongarbeid") return "Seasonal";
  return value instanceof String || typeof value === "string" ? String(value).trim() || null : null;
}

export function hiringModelLabel(model: HiringModel): string | null {
  if (model === "staffing") return "ArbeidMatch employs you directly (Bemanning)";
  if (model === "recruitment") return "The client employs you; ArbeidMatch recruits (Recruitment)";
  return null;
}
