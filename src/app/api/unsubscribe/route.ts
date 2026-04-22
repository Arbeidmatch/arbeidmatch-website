import { NextRequest, NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { unsubscribeByToken } from "@/lib/emailSubscription";
import { notifyError } from "@/lib/errorNotifier";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.redirect(new URL("/unsubscribed?success=false", request.url));
    const success = await unsubscribeByToken(token);
    if (success) void logAuditEvent("email_subscription_unsubscribed", "email", token, "candidate", { via: "get" });
    return NextResponse.redirect(new URL(`/unsubscribed?success=${success}`, request.url));
  } catch (error) {
    await notifyError({ route: "/api/unsubscribe", error });
    return NextResponse.redirect(new URL("/unsubscribed?success=false", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    if (!token) return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
    const success = await unsubscribeByToken(token);
    if (!success) return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
    void logAuditEvent("email_subscription_unsubscribed", "email", token, "candidate", { via: "post" });
    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/unsubscribe POST", error });
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
