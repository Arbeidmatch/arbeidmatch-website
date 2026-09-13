import { NextRequest, NextResponse } from "next/server";

import { unsubscribeByToken } from "@/lib/emailSubscription";
import { notifyError } from "@/lib/errorNotifier";

/**
 * A GET never unsubscribes anybody.
 *
 * Mail security scanners open every link in a letter with a GET, so a link
 * that acted on GET took clients off the list before they had read the mail.
 * GET now only shows the confirmation page (/unsubscribe); the change happens
 * on POST, from that page's button, or from a mail client's one-click
 * unsubscribe (RFC 8058), which also POSTs.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const target = new URL("/unsubscribe", request.url);
  if (token) target.searchParams.set("token", token);
  return NextResponse.redirect(target, 303);
}

async function readToken(request: NextRequest): Promise<{ token: string; wantsJson: boolean }> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  const fromQuery = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    return { token: token || fromQuery, wantsJson: true };
  }
  // The confirmation page's form, or a one-click POST ("List-Unsubscribe=One-Click"
  // in the body, the token in the URL).
  const form = await request.formData().catch(() => null);
  const fromForm = form?.get("token");
  const token = typeof fromForm === "string" && fromForm.trim() ? fromForm.trim() : fromQuery;
  return { token, wantsJson: false };
}

export async function POST(request: NextRequest) {
  let wantsJson = true;
  try {
    const read = await readToken(request);
    wantsJson = read.wantsJson;
    if (!read.token) {
      if (!wantsJson) return NextResponse.redirect(new URL("/unsubscribed?success=false", request.url), 303);
      return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
    }
    const success = await unsubscribeByToken(read.token);
    if (!wantsJson) return NextResponse.redirect(new URL(`/unsubscribed?success=${success}`, request.url), 303);
    if (!success) return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/unsubscribe POST", error });
    if (!wantsJson) return NextResponse.redirect(new URL("/unsubscribed?success=false", request.url), 303);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
