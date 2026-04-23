import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { notifyError } from "@/lib/slack/notify";

const payloadSchema = z.object({
  error: z.string().trim().min(1).max(8000),
  context: z.string().trim().max(2000).optional().default(""),
  url: z.string().trim().max(2000).optional().default(""),
  userAgent: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const data = parsed.data;
    const context = [data.context, data.url ? `url=${data.url}` : "", data.userAgent ? `ua=${data.userAgent}` : ""]
      .filter(Boolean)
      .join(" | ");

    await logAuditEvent("client_error", "other", null, "system", {
      error: data.error,
      context: data.context || null,
      url: data.url || null,
      userAgent: data.userAgent || null,
    });

    await notifyError(data.error, context || "client_error", "warning");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
