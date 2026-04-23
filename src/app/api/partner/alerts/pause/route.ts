import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  alert_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const update = await supabase
      .from("role_alerts")
      .update({ alert_status: "paused" })
      .eq("id", parsed.data.alert_id)
      .select("id,alert_status")
      .maybeSingle();

    if (update.error) {
      return NextResponse.json({ error: update.error.message }, { status: 500 });
    }
    if (!update.data) {
      return NextResponse.json({ error: "Alert not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert: update.data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected pause error." }, { status: 500 });
  }
}
