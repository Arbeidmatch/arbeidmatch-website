import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { notifyError } from "@/lib/errorNotifier";

const schema = z.object({
  email: z.string().email(),
  token: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ verified: false }, { status: 500 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return NextResponse.json({ verified: false });

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, company_name, domain")
      .eq("domain", domain)
      .eq("active", true)
      .maybeSingle();

    if (partnerError) {
      if (partnerError.code === "PGRST116") {
        return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
      }
      if (partnerError.code === "42P01") {
        return NextResponse.json({ verified: false });
      }
      throw partnerError;
    }

    if (!partner) {
      return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
    }

    const company = (partner.company_name || domain).trim() || domain;
    const requestExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const tokenRow = {
      full_name: "Partner Contact",
      company,
      email,
      phone: "N/A",
      job_summary: "Partner candidate request",
      gdpr_consent: true,
      how_did_you_hear: "partner",
      expires_at: requestExpiresAt,
      used: false,
    };

    let requestToken: string;
    const existingToken = parsed.data.token;

    if (existingToken) {
      const { data: updated, error: updateError } = await supabase
        .from("request_tokens")
        .update(tokenRow)
        .eq("token", existingToken)
        .select("token")
        .maybeSingle();

      if (updateError) {
        if (updateError.code === "42P01") {
          return NextResponse.json({ verified: false });
        }
        throw updateError;
      }

      if (updated?.token) {
        requestToken = updated.token;
      } else {
        requestToken = crypto.randomUUID();
        const { error: insertError } = await supabase.from("request_tokens").insert({
          token: requestToken,
          ...tokenRow,
        });
        if (insertError) {
          if (insertError.code === "42P01") {
            return NextResponse.json({ verified: false });
          }
          throw insertError;
        }
      }
    } else {
      requestToken = crypto.randomUUID();
      const { error: insertError } = await supabase.from("request_tokens").insert({
        token: requestToken,
        ...tokenRow,
      });
      if (insertError) {
        if (insertError.code === "42P01") {
          return NextResponse.json({ verified: false });
        }
        throw insertError;
      }
    }

    return NextResponse.json({
      verified: true,
      token: requestToken,
      company_name: partner.company_name,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST116"
    ) {
      return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
    }
    await notifyError({ route: "/api/verify-partner", error });
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
