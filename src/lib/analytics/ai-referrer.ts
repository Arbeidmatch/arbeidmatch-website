/**
 * A visit that came out of an assistant's answer, and the crawlers that read
 * pages for one.
 *
 * COPIED, NOT SHARED: this is the ATS's own
 * `ats-recruitment/src/lib/public-jobs/ai-referrer.ts` (as of 13 September
 * 2026). Both sites write pageviews into the same table, ats_web_pageviews, and
 * a row from here must be classified exactly as a row written by the ATS sink,
 * or a report adding the two hosts together counts the same visit two ways.
 * Change it there first, then copy it here.
 *
 * It counts a floor, not the whole effect: an assistant that quotes us without
 * a link brings no visit, and a person who types the address brings no referrer.
 */

export type AiAssistant = "chatgpt" | "claude" | "perplexity" | "gemini" | "copilot" | "other";

const HOSTS: ReadonlyArray<{ suffix: string; assistant: AiAssistant }> = [
  { suffix: "chatgpt.com", assistant: "chatgpt" },
  { suffix: "openai.com", assistant: "chatgpt" },
  { suffix: "claude.ai", assistant: "claude" },
  { suffix: "anthropic.com", assistant: "claude" },
  { suffix: "perplexity.ai", assistant: "perplexity" },
  { suffix: "gemini.google.com", assistant: "gemini" },
  { suffix: "bard.google.com", assistant: "gemini" },
  { suffix: "aistudio.google.com", assistant: "gemini" },
  { suffix: "copilot.microsoft.com", assistant: "copilot" },
  { suffix: "bing.com/chat", assistant: "copilot" },
  { suffix: "you.com", assistant: "other" },
  { suffix: "phind.com", assistant: "other" },
  { suffix: "poe.com", assistant: "other" },
  { suffix: "mistral.ai", assistant: "other" },
  { suffix: "duckduckgo.com/aichat", assistant: "other" },
];

/** Which assistant sent this visit, or null when it was not one. */
export function assistantFromReferrer(referrerHost: string | null | undefined): AiAssistant | null {
  const host = String(referrerHost ?? "").trim().toLowerCase().replace(/^www\./, "");
  if (!host) return null;
  for (const entry of HOSTS) {
    if (host === entry.suffix || host.endsWith(`.${entry.suffix}`)) return entry.assistant;
  }
  return null;
}

const AI_CRAWLER_UA =
  /\b(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|Bytespider|Amazonbot|Meta-ExternalAgent)\b/i;

/** The name a crawler goes by, for the row that records it read us. */
export function aiCrawlerName(userAgent: string | null | undefined): string | null {
  const match = AI_CRAWLER_UA.exec(String(userAgent ?? ""));
  return match ? match[1] : null;
}
