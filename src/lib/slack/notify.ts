import "server-only";

type Severity = "critical" | "warning" | "info";

const SEVERITY_META: Record<Severity, { label: string; emoji: string }> = {
  critical: { label: "Critical", emoji: "🔴" },
  warning: { label: "Warning", emoji: "🟡" },
  info: { label: "Info", emoji: "🟢" },
};

function getSlackWebhookUrl(): string | null {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  return url && url.startsWith("http") ? url : null;
}

function formatNorwayTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Oslo",
  }).format(date);
}

function escapeCodeBlock(input: string): string {
  return input.replace(/```/g, "` ` `");
}

function deriveVercelLogsUrl(): string | null {
  const explicit = process.env.VERCEL_LOGS_URL?.trim();
  if (explicit) return explicit;
  const deployment = process.env.VERCEL_URL?.trim();
  if (!deployment) return null;
  return `https://${deployment}`;
}

async function postSlack(blocks: Array<Record<string, unknown>>, fallbackText: string): Promise<void> {
  const webhook = getSlackWebhookUrl();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fallbackText, blocks }),
    });
  } catch {
    // Never block request flows on Slack failures.
  }
}

function buildErrorBlocks(error: string, context: string, severity: Severity): Array<Record<string, unknown>> {
  const meta = SEVERITY_META[severity];
  const logsUrl = deriveVercelLogsUrl();
  const stackMatch = error.match(/(?:stack|trace)\s*[:\n][\s\S]*/i);
  const stackRaw = stackMatch ? stackMatch[0] : "";
  const errorSummary = (stackMatch ? error.replace(stackMatch[0], "") : error).trim() || "Unknown error";

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${meta.emoji} ${meta.label}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Timestamp (Norway):*\n${formatNorwayTimestamp()}` },
        { type: "mrkdwn", text: `*Severity:*\n${meta.label}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Context*\n${context || "-"}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Error*\n\`\`\`${escapeCodeBlock(errorSummary).slice(0, 2500)}\`\`\`` },
    },
  ];

  if (stackRaw.trim()) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Stack trace*\n\`\`\`${escapeCodeBlock(stackRaw).slice(0, 2500)}\`\`\`` },
    });
  }

  if (logsUrl) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `<${logsUrl}|Open Vercel logs>` }],
    });
  }

  return blocks;
}

export async function notifyError(error: string, context: string, severity: Severity): Promise<void> {
  const blocks = buildErrorBlocks(error, context, severity);
  await postSlack(blocks, `[${severity.toUpperCase()}] ${context}: ${error}`);
}

export async function notifyBuildFailed(commit: string, error: string): Promise<void> {
  await notifyError(error, `Build failed on commit ${commit}`, "critical");
}

export async function notifyCronFailed(cronName: string, error: string): Promise<void> {
  await notifyError(error, `Cron failed: ${cronName}`, "critical");
}

export async function notifyEmailFailed(
  to: string,
  subject: string,
  error: string,
  attempt: number,
): Promise<void> {
  await notifyError(error, `Email send failed to ${to}, subject "${subject}", attempt ${attempt}`, "warning");
}

export async function notifyNewPartnerRequest(companyName: string, email: string, sectors: string[]): Promise<void> {
  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: { type: "plain_text", text: "🟢 Info" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Timestamp (Norway):*\n${formatNorwayTimestamp()}` },
        { type: "mrkdwn", text: "*Event:*\nNew partner request" },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Company:*\n${companyName}` },
        { type: "mrkdwn", text: `*Email:*\n${email}` },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Sectors:*\n${sectors.length ? sectors.join(", ") : "-"}` },
    },
  ];
  await postSlack(blocks, `New partner request from ${companyName}`);
}

export async function notifyNewCandidateProfile(name: string, category: string, score: number): Promise<void> {
  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: { type: "plain_text", text: "🟢 Info" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Timestamp (Norway):*\n${formatNorwayTimestamp()}` },
        { type: "mrkdwn", text: "*Event:*\nNew candidate profile" },
      ],
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name:*\n${name}` },
        { type: "mrkdwn", text: `*Category:*\n${category}` },
        { type: "mrkdwn", text: `*Score:*\n${Number.isFinite(score) ? score : 0}` },
      ],
    },
  ];
  await postSlack(blocks, `New candidate profile: ${name}`);
}
