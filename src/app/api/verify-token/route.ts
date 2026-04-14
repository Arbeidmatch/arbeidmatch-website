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

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  const token = request.nextUrl.searchParams.get("token");

  if (!token || !supabase) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("request_tokens")
    .select("id, expires_at, used")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const isExpired = new Date(data.expires_at) < new Date();
  const isUsed = data.used;

  if (isExpired || isUsed) {
    return NextResponse.json({ valid: false }, { status: 410 });
  }

  return NextResponse.json({ valid: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseClient();
  const token = request.nextUrl.searchParams.get("token");

  if (!token || !supabase) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  await supabase
    .from("request_tokens")
    .update({ used: true })
    .eq("token", token);

  return NextResponse.json({ success: true });
}
