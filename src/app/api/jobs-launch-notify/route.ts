import { NextRequest, NextResponse } from "next/server";

import { notifyError } from "@/lib/errorNotifier";
import { getOrCreateSubscription } from "@/lib/emailSubscription";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "jobs-launch-notify", 10, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    await getOrCreateSubscription(email, "jobs-coming-soon");
    return NextResponse.json({ success: true });
  } catch (e) {
    await notifyError({ route: "/api/jobs-launch-notify", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
