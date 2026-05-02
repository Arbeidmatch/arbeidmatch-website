import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { buildInternalEmailHtml, formatEmailTimestampCet, mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getUtcWeekStartIsoMonday() {
  const now = new Date();
  // UTC Monday 00:00 week boundary to keep the cron query deterministic.
  const day = now.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0));
  return monday.toISOString();
}

export async function GET(request: NextRequest) {
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
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing" }, { status: 500 });
    }

    const weekStartIso = getUtcWeekStartIsoMonday();

    const totalResult = await supabase
      .from("guide_interest_signups")
      .select("*", { count: "exact", head: true });

    const weeklyResult = await supabase
      .from("guide_interest_signups")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStartIso);

    if (totalResult.error || weeklyResult.error) {
      throw new Error(totalResult.error?.message || weeklyResult.error?.message || "Failed to load stats");
    }

    const totalInterested = totalResult.count ?? 0;
    const weeklyInterested = weeklyResult.count ?? 0;
    const launchTarget = 1000;
    const remaining = Math.max(launchTarget - totalInterested, 0);
    const progressPercent = Math.min(Math.round((totalInterested / launchTarget) * 100), 100);

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-reply@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const html = buildInternalEmailHtml({
      title: `Weekly guide interest report - total ${totalInterested}`,
      rows: [
        { label: "Report generated (CET)", value: formatEmailTimestampCet() },
        { label: "Context", value: "Guide interest signups (eligibility assistance flow)" },
        { label: "Total interested candidates", value: String(totalInterested) },
        { label: "New interested this week", value: String(weeklyInterested) },
        { label: "Product launch target", value: String(launchTarget) },
        { label: "Progress", value: `${progressPercent}% (${remaining} remaining to target)` },
      ],
    });

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `Weekly guide interest report | Total ${totalInterested}`,
      html,
    });

    return NextResponse.json({
      success: true,
      totalInterested,
      weeklyInterested,
      remaining,
      progressPercent,
    });
  } catch (error) {
    await notifyError({ route: "/api/weekly-guide-interest-report", error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
