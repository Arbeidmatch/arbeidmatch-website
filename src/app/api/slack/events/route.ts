import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";

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
    const body = (await request.json()) as SlackEventBody;
    await notifyError({
      route: "/api/slack/events DEBUG",
      error: new Error(
        `Received event type: ${body.type} | Event type: ${body.event?.type} | Channel: ${body.event?.channel} | Text: ${body.event?.text}`,
      ),
    });

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

      const token = process.env.GITHUB_ISSUES_TOKEN;
      if (token) {
        const title = messageText.slice(0, 80);
        const issueBody = `${messageText}\n\nSent from Slack`;
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    await notifyError({ route: "/api/slack/events", error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
