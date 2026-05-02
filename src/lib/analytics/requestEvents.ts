declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: Record<string, string | number>) => void;
  }
}

export function trackRequestStart(category: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "request_start", { category });
  }
}

export function trackRequestStepComplete(step: number, category: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "request_step_complete", { step, category });
  }
}

export function trackRequestSubmit(category: string, candidates_count: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "request_submit", { category, candidates_count });
  }
}

export function trackRareProfileView(category: string, count: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "rare_profile_view", { category, count });
  }
}

export function trackPartnerAccessRequest() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "partner_access_request");
  }
}
