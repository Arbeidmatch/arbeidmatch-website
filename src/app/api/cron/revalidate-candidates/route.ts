import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const timestamp = new Date().toISOString();
    revalidatePath("/request");
    console.log(`[CRON] Revalidated /request at ${timestamp}`);
    
    return NextResponse.json({ 
      success: true, 
      revalidated: "/request",
      timestamp 
    });
  } catch (e) {
    await notifyError({ route: "/api/cron/revalidate-candidates", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
