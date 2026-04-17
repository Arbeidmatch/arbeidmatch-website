export function escapeHtml(value: unknown): string {
  const stringValue = String(value ?? "");
  return stringValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeStringRecord(payload: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      sanitized[key] = escapeHtml(value.trim());
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = escapeHtml(String(value));
    } else {
      sanitized[key] = "";
    }
  }
  return sanitized;
}
