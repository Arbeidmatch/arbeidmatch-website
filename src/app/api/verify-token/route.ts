import { NextRequest } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getRateLimitResult, noStoreJson, parseJsonBodyWithSchema } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { logApiError } from "@/lib/secureLogger";

const createTokenSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    company: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(6).max(40),
    job_summary: z.string().trim().min(1).max(1000),
    website: z.string().max(256).optional(),
    company_website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const token = request.nextUrl.searchParams.get("token");
    const validToken = token ? z.string().uuid().safeParse(token).success : false;

    if (!validToken || !supabase) {
      return noStoreJson({ valid: false }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("request_tokens")
      .select("id, expires_at, used")
      .eq("token", token)
      .single();

    if (error || !data) {
      return noStoreJson({ valid: false }, { status: 404 });
    }

    const isExpired = new Date(data.expires_at) < new Date();
    const isUsed = data.used;

    if (isExpired || isUsed) {
      return noStoreJson({ valid: false }, { status: 410 });
    }

    return noStoreJson({ valid: true });
  } catch (error) {
    await notifyError({ route: "/api/verify-token", error });
    return noStoreJson({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rate = getRateLimitResult(request, "verify-token-post", 6, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return noStoreJson({ success: false, error: "Service unavailable." }, { status: 500 });
  }

  const parsed = await parseJsonBodyWithSchema(request, createTokenSchema, { maxBytes: 12 * 1024 });
  if (!parsed.ok) return parsed.response;
  if (parsed.data.honeypot || parsed.data.website || parsed.data.company_website) {
    return noStoreJson({ success: true });
  }

  try {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("request_tokens").insert({
      token,
      full_name: parsed.data.full_name,
      company: parsed.data.company,
      email: parsed.data.email,
      phone: parsed.data.phone,
      job_summary: parsed.data.job_summary,
      expires_at: expiresAt,
      used: false,
    });

    if (error) {
      throw error;
    }

    return noStoreJson({ success: true, token });
  } catch (error) {
    logApiError("verify-token/post", error);
    await notifyError({ route: "/api/verify-token", error });
    return noStoreJson({ success: false, error: "Unable to create token." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rate = getRateLimitResult(request, "verify-token-delete", 12, 10 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const supabase = getSupabaseAdminClient();
  const token = request.nextUrl.searchParams.get("token");
  const validToken = token ? z.string().uuid().safeParse(token).success : false;

  if (!validToken || !supabase) {
    return noStoreJson({ success: false }, { status: 400 });
  }

  try {
    await supabase
      .from("request_tokens")
      .update({ used: true })
      .eq("token", token);

    return noStoreJson({ success: true });
  } catch (error) {
    logApiError("verify-token/delete", error);
    await notifyError({ route: "/api/verify-token", error });
    return noStoreJson({ success: false, error: "Unable to update token." }, { status: 500 });
  }
}
