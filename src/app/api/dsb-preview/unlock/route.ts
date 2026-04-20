import { NextRequest } from "next/server";
import { z } from "zod";

import { getRateLimitResult, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";
import { buildPreviewCookieValue, previewCookieName, verifyPreviewPassword } from "@/lib/previewAuth";

const unlockSchema = z
  .object({
    password: z.string().min(1).max(256),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "dsb-preview-unlock", 10, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJsonBodyWithSchema(request, unlockSchema, { maxBytes: 4 * 1024 });
    if (!parsed.ok) return parsed.response;

    if (parsed.data.honeypot && parsed.data.honeypot.trim()) {
      return noStoreJson({ success: true });
    }

    if (!verifyPreviewPassword(parsed.data.password)) {
      return noStoreJson({ success: false, error: "Invalid password." }, { status: 401 });
    }

    const cookieValue = buildPreviewCookieValue();
    if (!cookieValue) {
      logApiError("dsb-preview/unlock", new Error("missing_preview_cookie_secret"));
      return noStoreJson({ success: false, error: "Preview is not configured." }, { status: 500 });
    }

    const response = noStoreJson({ success: true });
    response.cookies.set({
      name: previewCookieName(),
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    logApiError("dsb-preview/unlock", error);
    await notifyError({ route: "/api/dsb-preview/unlock", error });
    return noStoreJson({ success: false, error: "Unable to unlock preview." }, { status: 500 });
  }
}
