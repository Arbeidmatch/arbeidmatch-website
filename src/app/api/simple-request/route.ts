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
  console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SERVICE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase configuration missing - URL: " + process.env.NEXT_PUBLIC_SUPABASE_URL,
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
      orgNumber?: string;
    };

    if (!company || !email || !job_summary) {
      throw new Error("Missing required fields");
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
      job_summary,
      how_did_you_hear: howDidYouHear,
      social_media_platform: socialMediaPlatform,
      how_did_you_hear_other: howDidYouHearOther || socialMediaOther,
      expires_at: expiresAt,
      used: false,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("simple-request POST failed:", JSON.stringify(error));
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
