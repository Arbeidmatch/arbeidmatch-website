const WEBHOOKS = {
  employers: process.env.SLACK_WEBHOOK_EMPLOYERS,
  contacts: process.env.SLACK_WEBHOOK_CONTACTS,
  recruiters: process.env.SLACK_WEBHOOK_RECRUITERS,
  dsbLeads: process.env.SLACK_WEBHOOK_DSB_LEADS,
  errors: process.env.SLACK_WEBHOOK_URL,
};

export async function notifySlack(
  channel: keyof typeof WEBHOOKS,
  message: { title: string; fields: Record<string, string> },
) {
  const url = WEBHOOKS[channel];
  if (!url) return;
  const text =
    `*${message.title}*\n` +
    Object.entries(message.fields)
      .map(([k, v]) => `• *${k}:* ${v}`)
      .join("\n");
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // silent - slack notification failure should not break the request
  }
}
