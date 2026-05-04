import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { notifyError } from "@/lib/errorNotifier";
import { isRateLimited } from "@/lib/requestProtection";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  gdpr_consent: z.literal(true),
  timestamp: z.string().optional(),
});

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-invite", 10, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "invalid_body" }, { status: 400 });
    }

    const { email, timestamp } = parsed.data;
    let consentedAt = new Date().toISOString();
    if (timestamp) {
      const parsedTs = Date.parse(timestamp);
      if (!Number.isNaN(parsedTs)) consentedAt = new Date(parsedTs).toISOString();
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "service_unavailable" }, { status: 503 });
    }

    const userAgent = request.headers.get("user-agent")?.slice(0, 2000) ?? null;

    const { error } = await supabase.from("candidate_invites").insert({
      email,
      gdpr_consent: true,
      consented_at: consentedAt,
      ip_address: clientIp(request),
      user_agent: userAgent,
    });

    if (error) {
      console.error("[candidate-invite] supabase", error);
      await notifyError({ route: "/api/candidate-invite", error });
      return NextResponse.json({ success: false, error: "persist_failed" }, { status: 500 });
    }

    // TODO(AM-WEB-111): Send magic-link invite email via Supabase Auth admin API or transactional email provider.

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-invite", error });
    console.error("[candidate-invite]", error);
    return NextResponse.json({ success: false, error: "unexpected" }, { status: 500 });
  }
}
