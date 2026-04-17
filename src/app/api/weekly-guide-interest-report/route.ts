import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getOsloWeekStartIso() {
  const now = new Date();
  // Approximate Oslo week start with UTC Monday 00:00 to keep query deterministic in cron.
  const day = now.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0));
  return monday.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing" }, { status: 500 });
    }

    const weekStartIso = getOsloWeekStartIso();

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
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
            <div style="margin-top:8px;color:#DDE3ED;">Weekly guide interest report</div>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            <div style="margin-top:10px;font-size:13px;color:#C7D1DF;">Sent automatically every Monday at 07:00</div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            <p>You are receiving this email because candidates are joining the guide interest list from the eligibility assistance flow.</p>
            <p><strong>Total interested candidates:</strong> ${totalInterested}</p>
            <p><strong>New interested this week:</strong> ${weeklyInterested}</p>
            <p><strong>Product launch target:</strong> ${launchTarget} interested candidates</p>
            <p><strong>Progress:</strong> ${progressPercent}% (${remaining} remaining)</p>
            <p style="margin-top:14px;">
              Once you reach <strong>${launchTarget}</strong> interested candidates, you can move forward and launch the product with stronger demand validation.
            </p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
            ArbeidMatch Norge AS · post@arbeidmatch.no
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
