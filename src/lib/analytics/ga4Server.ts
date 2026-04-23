import "server-only";

export async function trackGa4ServerEvent(eventName: string, params: Record<string, string | number>): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const apiSecret = process.env.GA4_API_SECRET?.trim();

  if (!measurementId || !apiSecret) return;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const payload = {
    client_id: "server.role_alert_cron",
    events: [
      {
        name: eventName,
        params,
      },
    ],
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Analytics should not break core flows.
  }
}

