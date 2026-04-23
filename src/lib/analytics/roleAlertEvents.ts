declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: Record<string, string | number>) => void;
  }
}

export function trackAlertSubscribed(role: string, frequency: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "alert_subscribed", { role, frequency });
  }
}

export function trackAlertNotificationSent(role: string, count: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "alert_notification_sent", { role, count });
  }
}

export function trackAlertLinkClicked(role: string, alert_id: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "alert_link_clicked", { role, alert_id });
  }
}

