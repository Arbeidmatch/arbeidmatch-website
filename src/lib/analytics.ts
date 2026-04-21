export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (!(window as any).gtag) return;
  (window as any).gtag("event", eventName, params);
}
