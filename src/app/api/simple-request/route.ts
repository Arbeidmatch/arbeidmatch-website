// v2
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase configuration missing.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const {
      full_name,
      company,
      email,
      phone,
      job_summary,
      howDidYouHear,
      socialMediaPlatform,
      socialMediaOther,
      howDidYouHearOther,
      referralCompanyName,
      referralOrgNumber,
      referralEmail,
      orgNumber,
    } = body as {
      full_name?: string;
      company?: string;
      email?: string;
      phone?: string;
      job_summary?: string;
      howDidYouHear?: string;
      socialMediaPlatform?: string;
      socialMediaOther?: string;
      howDidYouHearOther?: string;
      referralCompanyName?: string;
      referralOrgNumber?: string;
      referralEmail?: string;
      orgNumber?: string;
    };

    if (!company || !email) {
      throw new Error("Missing required fields: company and email are required.");
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("request_tokens").insert({
      token,
      full_name,
      company,
      email,
      phone,
      org_number: orgNumber,
      job_summary: job_summary?.trim() || "General hiring inquiry",
      how_did_you_hear: howDidYouHear,
      social_media_platform: socialMediaPlatform,
      how_did_you_hear_other: howDidYouHearOther || socialMediaOther,
      referral_company_name: referralCompanyName,
      referral_org_number: referralOrgNumber,
      referral_email: referralEmail,
      expires_at: expiresAt,
      used: false,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("simple-request POST failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
