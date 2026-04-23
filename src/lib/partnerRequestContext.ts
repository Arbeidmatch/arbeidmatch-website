/** Session handoff from /request → partner session / search (same browser tab). */
export const PARTNER_REQUEST_CONTEXT_KEY = "arbeidmatch_partner_request_context";

export type PartnerRequestContext = {
  industry: string;
  role: string;
};

export function readPartnerRequestContext(): PartnerRequestContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PARTNER_REQUEST_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const industry = typeof (parsed as PartnerRequestContext).industry === "string" ? (parsed as PartnerRequestContext).industry : "";
    const role = typeof (parsed as PartnerRequestContext).role === "string" ? (parsed as PartnerRequestContext).role : "";
    if (!industry.trim() && !role.trim()) return null;
    return { industry: industry.trim(), role: role.trim() };
  } catch {
    return null;
  }
}

export function writePartnerRequestContext(industry: string, role: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PARTNER_REQUEST_CONTEXT_KEY, JSON.stringify({ industry, role }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearPartnerRequestContext() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PARTNER_REQUEST_CONTEXT_KEY);
  } catch {
    /* ignore */
  }
}
