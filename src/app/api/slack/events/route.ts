import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";

/**
 * Only Slack may call this.
 *
 * It had no check at all: anybody who POSTed an event_callback naming the
 * channel could open an issue on the website repository with any text, and
 * issues are read by the coding agents as work. Found 12 September 2026. The
 * same verification the interactions route already does, plus a five minute
 * window so a captured request cannot be replayed later.
 */
function isValidSlackSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  const signature = request.headers.get("x-slack-signature") || "";
  const timestamp = request.headers.get("x-slack-timestamp") || "";
  if (!secret || !signature.startsWith("v0=") || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

type SlackEventBody = {
  type?: string;
  challenge?: string;
  event?: {
    type?: string;
    bot_id?: string;
    text?: string;
    channel?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!isValidSlackSignature(request, rawBody)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const body = JSON.parse(rawBody) as SlackEventBody;

    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    if (body.type === "event_callback" && body.event?.type === "message") {
      if (body.event.bot_id) {
        return NextResponse.json({ ok: true });
      }

      const messageText = body.event.text?.trim() || "";
      if (!messageText) {
        return NextResponse.json({ ok: true });
      }

      const channelId = body.event.channel || "";
      const cursorTasksChannelId = process.env.SLACK_CURSOR_TASKS_CHANNEL_ID || "";
      if (channelId === cursorTasksChannelId && cursorTasksChannelId) {
        const token = process.env.GITHUB_ISSUES_TOKEN;
        if (token) {
          const title = messageText.slice(0, 80);
          const issueBody = `${messageText}\n\nSent from #cursor-tasks on Slack`;
          await fetch("https://api.github.com/repos/Arbeidmatch/arbeidmatch-website/issues", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
              body: issueBody,
            }),
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await notifyError({ route: "/api/slack/events", error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
