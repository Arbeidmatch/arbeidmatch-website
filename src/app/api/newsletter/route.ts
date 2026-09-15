import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getRateLimitResult, hasHoneypotValue, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { TRADES } from "@/lib/trades";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  trade: z.string().refine((value) => TRADES.some((trade) => trade.name === value)),
  notifyConsent: z.literal(true),
  dataConsent: z.literal(true),
  website: z.string().max(200).optional().default(""),
});

/** Shares the existing job-alert subscription table and delivery worker. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return noStoreJson({ success: false, error: "Invalid origin." }, { status: 403 });
  }
  const rate = getRateLimitResult(request, "newsletter", 6, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ success: false, error: "Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const parsed = await parseJsonBodyWithSchema(request, schema, { maxBytes: 4096 });
  if (!parsed.ok) return parsed.response;
  if (hasHoneypotValue(parsed.data)) return noStoreJson({ success: true });
  const db = getSupabaseAdminClient();
  if (!db) return noStoreJson({ success: false, error: "Signup is temporarily unavailable." }, { status: 503 });
  try {
    const { error } = await db.from("ats_job_alert_subscriptions").upsert({
      email: parsed.data.email,
      trade: parsed.data.trade,
      notify_consent: true,
      data_consent: true,
      source: "website_newsletter",
      consented_at: new Date().toISOString(),
      // A fresh explicit signup also restores a previously withdrawn job alert.
      withdrawn_at: null,
    }, { onConflict: "email" });
    if (error) return noStoreJson({ success: false, error: "We could not save your signup. Please try again." }, { status: 503 });
    return noStoreJson({ success: true });
  } catch {
    return noStoreJson({ success: false, error: "We could not save your signup. Please try again." }, { status: 503 });
  }
}
