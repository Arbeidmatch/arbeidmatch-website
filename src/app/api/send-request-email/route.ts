import { NextRequest } from "next/server";
import { z } from "zod";
import { getRateLimitResult, hasHoneypotValue, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { sendRequestLetters } from "@/lib/request-letters";
import { logApiError } from "@/lib/secureLogger";

const requestSchema = z
  .object({
    company: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    full_name: z.string().trim().max(120).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    position: z.string().trim().max(120).optional().or(z.literal("")),
    positionOther: z.string().trim().max(120).optional().or(z.literal("")),
    numberOfPositions: z.string().trim().max(20).optional().or(z.literal("")),
    startDate: z.string().trim().max(80).optional().or(z.literal("")),
    startDateOther: z.string().trim().max(80).optional().or(z.literal("")),
    howDidYouHear: z.string().trim().max(120).optional().or(z.literal("")),
    socialMediaPlatform: z.string().trim().max(120).optional().or(z.literal("")),
    socialMediaOther: z.string().trim().max(120).optional().or(z.literal("")),
    howDidYouHearOther: z.string().trim().max(120).optional().or(z.literal("")),
    referralCompanyName: z.string().trim().max(160).optional().or(z.literal("")),
    referralOrgNumber: z.string().trim().max(40).optional().or(z.literal("")),
    referralEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
    referenceId: z.string().trim().max(40).optional().or(z.literal("")),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .passthrough();

/** The detailed form's letters; the pop-up's are sent by the save route (ORDER 296). */
export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "send-request-email", 6, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
    const parsed = await parseJsonBodyWithSchema(request, requestSchema, { maxBytes: 64 * 1024 });
    if (!parsed.ok) return parsed.response;
    const rawData = parsed.data as Record<string, unknown>;
    if (hasHoneypotValue(rawData)) {
      return noStoreJson({ success: true });
    }
    await sendRequestLetters(rawData);
    return noStoreJson({ success: true });
  } catch (error) {
    console.error("[/api/send-request-email] failed to send email", error);
    logApiError("send-request-email", error);
    await notifyError({
      route: "/api/send-request-email",
      error,
      context: {
        recipient: "post@arbeidmatch.no",
        timestamp: new Date().toISOString(),
      },
    });
    return noStoreJson({ success: false, error: "Failed to send email." }, { status: 500 });
  }
}
